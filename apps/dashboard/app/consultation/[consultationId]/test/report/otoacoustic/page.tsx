"use client";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams, useRouter } from "next/navigation";
import { Ear } from "@/models/enums";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import StickyReportNavigation from "@/components/ui/StickyReportNavigation";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { exportElementToPdfBlob } from "@/lib/pdf";
import ReportTopActions from "@/components/ui/ReportTopActions";
import useSharedScreenShare from "@/hooks/agora/use-shared-screen-share";
import { useSocket } from "@/providers/socket-provider";
import initiateReportUpload from "@/actions/consultations/initiate-report-upload";
import completeReportUpload from "@/actions/consultations/complete-report-upload";
import { ReportType } from "@/models/enums";

export default function OtoacousticReportPage() {
  const { consultationId } = useParams();
  const router = useRouter();
  const socket = useSocket();
  const {
    data: consultation,
    isLoading,
    error,
  } = useGetConsultation(consultationId as string);
  const consultationData = ((consultation as any)?.data || null) as ConsultationModelData;
  const reportRef = useRef<HTMLDivElement>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  
  // Check if this is Shriram Hospital
  const isShriramHospital = consultationData?.centre?.user?.email?.toLowerCase() === "bills.shriramhospital@gmail.com" || 
                             consultationData?.centre?.user?.name?.toLowerCase()?.includes("shri ram") || 
                             consultationData?.centre?.user?.name?.toLowerCase()?.includes("shriram");
  const [sharePhone, setSharePhone] = useState<string>("");
  const updateConsultationMutation = useUpdateConsultation();
  const [comments, setComments] = useState<string>("");
  const { isSharing: isScreenSharing, isConnecting: isScreenConnecting, toggleScreenShare, error: screenShareError } = useSharedScreenShare();
  const [isShowingReport, setIsShowingReport] = useState(false);
  
  // AIIMS editable date state
  const [isAiims, setIsAiims] = useState(false);
  const [reportDate, setReportDate] = useState<string>("");
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isSavingDate, setIsSavingDate] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const aiims = localStorage.getItem('isAiims') === 'true';
      setIsAiims(aiims);
    }
  }, []);
  
  useEffect(() => {
    if (consultationData?.createdAt) {
      const dateStr = format(new Date(consultationData.createdAt), "dd/MM/yyyy");
      setReportDate(dateStr);
    }
  }, [consultationData]);

  useEffect(() => {
    if (consultationData?.oae?.notes) {
      setComments(consultationData.oae.notes);
    }
  }, [consultationData]);

  // Prevent refresh/close while report is being sent
  useEffect(() => {
    if (!isSendingReport) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Report is being sent. Leave anyway?";
      return "Report is being sent. Leave anyway?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSendingReport]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReportDate(e.target.value);
  };
  
  const handleDateSave = async () => {
    if (!consultationData || !reportDate) return;
    
    try {
      setIsSavingDate(true);
      const [day, month, year] = reportDate.split('/');
      const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      await updateConsultationMutation.mutateAsync({
        id: consultationId as string,
        createdAt: newDate.toISOString(),
      });
      
      setIsEditingDate(false);
      toast.success("Report date updated successfully");
    } catch (error) {
      console.error("Error updating date:", error);
      toast.error("Failed to update report date");
    } finally {
      setIsSavingDate(false);
    }
  };
  
  const handleDateCancel = () => {
    if (consultationData?.createdAt) {
      const dateStr = format(new Date(consultationData.createdAt), "dd/MM/yyyy");
      setReportDate(dateStr);
    }
    setIsEditingDate(false);
  };

  // Default patient phone formatted
  const defaultPatientPhone = (() => {
    const raw = consultationData?.patient?.contactNumber || "";
    const stripped = raw.replace(/^\+/, "");
    return stripped.startsWith("91") ? stripped : (stripped ? `91${stripped}` : "");
  })();
  useEffect(() => { setSharePhone(defaultPatientPhone); }, [defaultPatientPhone]);

  // Prevent body scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (screenShareError) {
      toast.error(`Screen sharing error: ${screenShareError}`);
    }
  }, [screenShareError]);

  const handleSaveComments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationData) return;
    try {
      await updateConsultationMutation.mutateAsync({
        ...consultationData,
        id: consultationData.id,
        oae: {
          ...consultationData.oae!,
          notes: comments,
        },
        updatedAt: new Date().toISOString(),
      });
      toast.success("Comments saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save comments");
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      toast.success("Generating PDF...");
      const { exportElementToPdf } = await import("@/lib/pdf");

      // Pre-rasterize Recharts SVGs to PNG <img> to avoid any CSP plugin/image loader issues
      const svgs = Array.from(reportRef.current.querySelectorAll("svg.recharts-surface")) as SVGSVGElement[];
      const cleanup: Array<() => void> = [];
      for (const svg of svgs) {
        try {
          const rect = svg.getBoundingClientRect();
          const width = Math.max(1, Math.floor(rect.width));
          const height = Math.max(1, Math.floor(rect.height));
          const xml = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
          const svgUrl = URL.createObjectURL(svgBlob);
          const img = document.createElement("img");
          img.width = width;
          img.height = height;
          img.style.width = `${width}px`;
          img.style.height = `${height}px`;
          await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); img.src = svgUrl; });
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.drawImage(img, 0, 0, width, height);
          const pngUrl = canvas.toDataURL("image/png");
          const pngImg = document.createElement("img");
          pngImg.src = pngUrl;
          pngImg.width = width;
          pngImg.height = height;
          pngImg.style.width = `${width}px`;
          pngImg.style.height = `${height}px`;
          svg.style.display = "none";
          svg.parentNode?.insertBefore(pngImg, svg);
          cleanup.push(() => {
            if (pngImg.parentNode) pngImg.parentNode.removeChild(pngImg);
            svg.style.display = "";
            URL.revokeObjectURL(svgUrl);
          });
        } catch {
          // ignore this one and proceed
        }
      }

      await exportElementToPdf(
        reportRef.current,
        `otoacoustic-report-${consultationData?.patient?.code || "unknown"}.pdf`,
        { singlePage: true, fullPage: true }
      );
      toast.success("PDF downloaded successfully!");
      cleanup.forEach(fn => fn());
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleShowReport = async () => {
    if (!socket) {
      toast.error("Socket connection not available");
      return;
    }

    const isCurrentlyShowing = isShowingReport || isScreenSharing;
    try {
      if (isCurrentlyShowing) {
        socket.emit("generate-report:end", { consultationId });
        setIsShowingReport(false);
        if (isScreenSharing) {
          await toggleScreenShare();
        }
        toast.success("Report hidden from patient");
      } else {
        socket.emit("generate-report:start", { consultationId });
        setIsShowingReport(true);
        if (reportRef.current) {
          await toggleScreenShare(reportRef.current);
        } else {
          await toggleScreenShare();
        }
        toast.success("Report shown to patient via screen share");
      }
    } catch (err) {
      console.error("Error handling report display:", err);
      toast.error("Failed to show/hide report");
    }
  };

  const sendReportToNumbers = async (toNumbersInput: string) => {
    if (!reportRef.current || !consultationData) return;
    
    setIsSendingReport(true);
    try {
      toast.info("Preparing report for sharing...");
      
      const blob = await exportElementToPdfBlob(reportRef.current, { singlePage: true, fullPage: true });
      const file = new File([blob], `otoacoustic-report-${consultationData.patient?.code || "unknown"}.pdf`, { type: "application/pdf" });
      
      const rawList = (toNumbersInput || consultationData.patient?.contactNumber || "9058075653");
      const recipients = rawList
        .split(/[\s,]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const formatNumber = (n: string) => {
        let x = n.replace(/^\+/, '');
        if (!/^91\d{10}$/.test(x)) {
          if (/^\d{10}$/.test(x)) x = `91${x}`;
        }
        return x;
      };

      const uniqueRecipients = Array.from(new Set(recipients.map(formatNumber)));

      const initiateResult = await initiateReportUpload({
        consultationId: consultationId as string,
        reportType: ReportType.OAE,
        fileName: file.name,
        contentType: file.type,
      });
      
      if (!initiateResult.success || !initiateResult.data) {
        throw new Error(initiateResult.message || "Failed to initiate upload");
      }
      
      const { presignedUrl, uploadId } = initiateResult.data;
      
      try {
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        const completeResult = await completeReportUpload({
          uploadId,
          consultationId: consultationId as string,
          reportType: ReportType.OAE,
        });
        
        if (!completeResult.success || !completeResult.data) {
          throw new Error(completeResult.message || "Failed to complete upload");
        }
        
        const finalReportUrl = completeResult.data.fileUrl;
        const patientName = consultationData.patient?.name || "Patient";
        
        const results = await Promise.allSettled(uniqueRecipients.map(async (to) => {
          try {
            const response = await fetch('/api/whatsapp/send-report-dialog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, patientName, reportUrl: finalReportUrl, reportType: 'otoacoustic' })
            });
            const json = await response.json();
            if (!json.success) throw new Error(json.error || 'Unknown error');
            return { to, success: true };
          } catch (e: any) {
            return { to, success: false, error: e?.message || String(e) };
          }
        }));

        const succeeded = results.filter(r => r.status === 'fulfilled' && (r as any).value?.success).length;
        const failed = uniqueRecipients.length - succeeded;

        if (failed === 0) {
          toast.success(`Report shared to ${succeeded} recipient(s)`);
        } else if (succeeded > 0) {
          toast.warning(`Shared to ${succeeded}, failed for ${failed}`);
        } else {
          toast.error('Failed to share report to all recipients');
        }
        
      } catch (s3Error) {
        console.error("S3 upload failed, using fallback:", s3Error);
        toast.warning("Using fallback URL for sharing");
        
        const patientName = consultationData.patient?.name || "Patient";
        
        const results = await Promise.allSettled(uniqueRecipients.map(async (to) => {
          try {
            const response = await fetch('/api/whatsapp/send-report-dialog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, patientName, reportUrl: "https://omni-two.s3.ap-south-1.amazonaws.com/reports/test-otoacoustic-report.pdf", reportType: 'otoacoustic' })
            });
            const json = await response.json();
            if (!json.success) throw new Error(json.error || 'Unknown error');
            return { to, success: true };
          } catch (e: any) {
            return { to, success: false, error: e?.message || String(e) };
          }
        }));

        const succeeded = results.filter(r => r.status === 'fulfilled' && (r as any).value?.success).length;
        const failed = uniqueRecipients.length - succeeded;

        if (failed === 0) {
          toast.success(`Report shared to ${succeeded} recipient(s)`);
        } else if (succeeded > 0) {
          toast.warning(`Shared to ${succeeded}, failed for ${failed}`);
        } else {
          toast.error('Failed to share report to all recipients');
        }
      }
      
    } catch (err) {
      console.error("Error sharing report:", err);
      toast.error(`Failed to share report: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleShareReport = () => {
    const isAiims = typeof window !== 'undefined' && localStorage.getItem('isAiims') === 'true';
    
    if (isAiims) {
      console.log('🏥 AIIMS employee detected - sending report to hardcoded number');
      sendReportToNumbers('919980936971');
    } else {
      setIsShareDialogOpen(true);
    }
  };

  if (isLoading) return <div className="p-6">Loading report...</div>;
  if (error)
    return (
      <div className="p-6 text-red-500">
        Error loading report: {error.message}
      </div>
    );
  if (!consultationData)
    return <div className="p-6">No consultation data found</div>;

  // Check for OAE data
  const oaeData = consultationData.oae;
  if (!oaeData || !oaeData.earTests || oaeData.earTests.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No OAE Data
          </h2>
          <p className="text-gray-500">
            No otoacoustic emissions test has been performed for this consultation.
          </p>
        </div>
      </div>
    );
  }

  // Extract left and right ear data
  const leftEarData = oaeData.earTests.find((et: any) => et.ear === "LEFT");
  const rightEarData = oaeData.earTests.find((et: any) => et.ear === "RIGHT");

  return (
    <div className="h-screen w-full overflow-hidden flex justify-center items-center bg-gray-100">
      <div className="w-[794px] max-h-[calc(100vh-2rem)] bg-white shadow-lg overflow-hidden">
        <ReportTopActions onDownload={handleDownloadPDF} onShare={handleShareReport} />

        <div ref={reportRef} data-report-capture="true" className="bg-white overflow-y-auto max-h-[calc(100vh-8rem)]" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="relative overflow-hidden" data-section="header">
            {isShriramHospital ? (
              <div className="p-6">
                <div className="flex items-center justify-center gap-6 mb-3">
                  <Image src="/logo.webp" alt="earKART Logo" width={140} height={70} className="object-contain" style={{ height: '100px', width: 'auto' }} />
                  <img src="/logos/shriram-hospital-logo.webp" alt="Shriram Hospital Logo" style={{ height: '100px', width: 'auto', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="text-center text-black">
                  <p className="font-bold text-base mb-1">{consultationData.centre?.user?.name || "Demo Clinic"}</p>
                  <p className="font-semibold text-sm text-gray-700 mb-1">Dr. {consultationData.centre?.entName || "Demo ENT"}</p>
                  <p className="font-semibold text-sm text-gray-700 mb-1">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</p>
                  <p className="text-sm text-gray-600">{consultationData.centre?.address || "Address"}</p>
                </div>
              </div>
            ) : (
              <div className="relative flex items-center justify-between p-6 z-10">
                <div className="flex items-center bg-white p-2 rounded">
                  <Image src="/logo.webp" alt="earKART Logo" width={200} height={250} className="bg-white" />
                </div>
                <div className="text-blue-900 px-6 py-4 rounded-lg shadow-md" style={{ backgroundColor: '#8bdaef' }}>
                  <div className="text-center">
                    <p className="font-bold text-base mb-2">{consultationData.centre?.user?.name || "Demo Clinic"}</p>
                    <div className="flex items-center justify-center mb-1"><span className="text-sm mr-1">👨‍⚕️</span><span className="text-sm">Dr. {consultationData.centre?.entName || "Demo ENT"}</span></div>
                    <div className="flex items-center justify-center mb-1"><span className="text-sm mr-1">📞</span><span className="text-sm">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span></div>
                    <div className="flex items-center justify-center"><span className="text-sm mr-1">📍</span><span className="text-sm">{consultationData.centre?.address || "Address"}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center py-6 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Otoacoustic Emissions (OAE)</h2>
          </div>

          {/* Patient Information */}
          <div className="px-8 py-4 bg-white border-b">
            <div className="grid grid-cols-12 gap-4 text-sm">
              <div className="col-span-3 flex items-center">
                <span className="font-medium mr-2">ID :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.code || ""}</span>
              </div>
              <div className="col-span-6 flex items-center">
                <span className="font-medium mr-2">Name :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.name || ""}</span>
              </div>
              <div className="col-span-3 flex items-center">
                <span className="font-medium mr-2">Date :</span>
                {isAiims && isEditingDate ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="text"
                      value={reportDate}
                      onChange={handleDateChange}
                      placeholder="dd/MM/yyyy"
                      className="border-b border-dotted border-gray-400 flex-1 pb-1 h-auto px-0 text-sm"
                      maxLength={10}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDateSave}
                      disabled={isSavingDate}
                      className="h-6 px-2 text-xs"
                    >
                      {isSavingDate ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDateCancel}
                      disabled={isSavingDate}
                      className="h-6 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <span 
                    className={`border-b border-dotted border-gray-400 flex-1 pb-1 ${isAiims ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => isAiims && setIsEditingDate(true)}
                    title={isAiims ? "Click to edit date" : ""}
                  >
                    {reportDate || format(new Date(consultationData.createdAt), "dd/MM/yyyy")}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 text-sm mt-3">
              <div className="col-span-7 flex items-center">
                <span className="font-medium mr-2">Address :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.address || ""}</span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="font-medium mr-2">Age :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {consultationData.patient?.age || 
                   (consultationData.patient?.dob ? 
                     Math.floor((Date.now() - new Date(consultationData.patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
                     : "")}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="font-medium mr-2">Sex :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.gender || ""}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
              <div className="flex items-center">
                <span className="font-medium mr-2">Contact No. :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.contactNumber || ""}</span>
              </div>
            </div>
          </div>

          {/* OAE Test Results */}
          <div className="px-8 py-6 bg-gray-50 relative z-0">
            <h3 className="text-lg font-bold mb-4">OAE Test Results</h3>
            
            {/* Left Ear Results */}
            {leftEarData && (
              <div className="mb-6 border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-600">Left Ear</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      leftEarData.pass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {leftEarData.pass ? "✓ Pass" : "✗ Refer"}
                    </span>
                    {leftEarData.result && (
                      <span className="text-sm text-gray-600">({leftEarData.result})</span>
                    )}
                  </div>
                </div>
                
                {leftEarData.earVolume !== null && leftEarData.earVolume !== undefined && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Ear Volume:</span> {leftEarData.earVolume.toFixed(2)} ml
                  </p>
                )}
                
                {leftEarData.minimumSignalThreshold !== null && leftEarData.minimumSignalThreshold !== undefined && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Minimum Signal Threshold:</span> {leftEarData.minimumSignalThreshold} dB SPL
                  </p>
                )}

                {leftEarData.frequencyResponses && leftEarData.frequencyResponses.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-sm mb-2">Frequency Responses:</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Frequency (Hz)</th>
                            <th className="border p-2 text-left">Signal (dB SPL)</th>
                            <th className="border p-2 text-left">Noise (dB SPL)</th>
                            <th className="border p-2 text-left">SNR (dB)</th>
                            <th className="border p-2 text-left">Artefacts</th>
                            <th className="border p-2 text-left">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leftEarData.frequencyResponses.map((fr: any, idx: number) => {
                            // Helper to format valid numbers
                            const formatNumber = (val: any): string => {
                              if (val === null || val === undefined) return "N/A";
                              if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return "N/A";
                              return val.toFixed(2);
                            };
                            
                            // Calculate SNR: Signal - Noise (with validation)
                            const signal = fr.signal;
                            const noise = fr.noise;
                            const isValidSignal = typeof signal === 'number' && !isNaN(signal) && isFinite(signal);
                            const isValidNoise = typeof noise === 'number' && !isNaN(noise) && isFinite(noise);
                            
                            let snr = "N/A";
                            if (isValidSignal && isValidNoise) {
                              const calculatedSnr = signal - noise;
                              snr = formatNumber(calculatedSnr);
                            } else if (typeof fr.snr === 'number' && !isNaN(fr.snr) && isFinite(fr.snr)) {
                              snr = fr.snr.toFixed(2);
                            }
                            
                            return (
                              <tr key={idx} className={fr.pass ? "bg-green-50" : "bg-red-50"}>
                                <td className="border p-2">{fr.frequencyHz}</td>
                                <td className="border p-2">{formatNumber(fr.signal)}</td>
                                <td className="border p-2">{formatNumber(fr.noise)}</td>
                                <td className="border p-2 font-semibold">{snr}</td>
                                <td className="border p-2">{fr.artefacts ?? 0}</td>
                                <td className="border p-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    fr.pass ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                                  }`}>
                                    {fr.pass ? "Pass" : "Fail"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Right Ear Results */}
            {rightEarData && (
              <div className="mb-6 border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-red-600">Right Ear</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      rightEarData.pass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {rightEarData.pass ? "✓ Pass" : "✗ Refer"}
                    </span>
                    {rightEarData.result && (
                      <span className="text-sm text-gray-600">({rightEarData.result})</span>
                    )}
                  </div>
                </div>
                
                {rightEarData.earVolume !== null && rightEarData.earVolume !== undefined && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Ear Volume:</span> {rightEarData.earVolume.toFixed(2)} ml
                  </p>
                )}
                
                {rightEarData.minimumSignalThreshold !== null && rightEarData.minimumSignalThreshold !== undefined && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Minimum Signal Threshold:</span> {rightEarData.minimumSignalThreshold} dB SPL
                  </p>
                )}

                {rightEarData.frequencyResponses && rightEarData.frequencyResponses.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium text-sm mb-2">Frequency Responses:</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Frequency (Hz)</th>
                            <th className="border p-2 text-left">Signal (dB SPL)</th>
                            <th className="border p-2 text-left">Noise (dB SPL)</th>
                            <th className="border p-2 text-left">SNR (dB)</th>
                            <th className="border p-2 text-left">Artefacts</th>
                            <th className="border p-2 text-left">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rightEarData.frequencyResponses.map((fr: any, idx: number) => {
                            // Helper to format valid numbers
                            const formatNumber = (val: any): string => {
                              if (val === null || val === undefined) return "N/A";
                              if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return "N/A";
                              return val.toFixed(2);
                            };
                            
                            // Calculate SNR: Signal - Noise (with validation)
                            const signal = fr.signal;
                            const noise = fr.noise;
                            const isValidSignal = typeof signal === 'number' && !isNaN(signal) && isFinite(signal);
                            const isValidNoise = typeof noise === 'number' && !isNaN(noise) && isFinite(noise);
                            
                            let snr = "N/A";
                            if (isValidSignal && isValidNoise) {
                              const calculatedSnr = signal - noise;
                              snr = formatNumber(calculatedSnr);
                            } else if (typeof fr.snr === 'number' && !isNaN(fr.snr) && isFinite(fr.snr)) {
                              snr = fr.snr.toFixed(2);
                            }
                            
                            return (
                              <tr key={idx} className={fr.pass ? "bg-green-50" : "bg-red-50"}>
                                <td className="border p-2">{fr.frequencyHz}</td>
                                <td className="border p-2">{formatNumber(fr.signal)}</td>
                                <td className="border p-2">{formatNumber(fr.noise)}</td>
                                <td className="border p-2 font-semibold">{snr}</td>
                                <td className="border p-2">{fr.artefacts ?? 0}</td>
                                <td className="border p-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    fr.pass ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                                  }`}>
                                    {fr.pass ? "Pass" : "Fail"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Investigation: OAE */}
          <div className="mx-8 mb-6 relative z-10">
            <div className="bg-white border border-gray-300">
              <div className="bg-blue-900 text-white p-3 text-center">
                <h3 className="text-sm font-bold">Investigation : Otoacoustic Emissions</h3>
              </div>
              <div className="grid grid-cols-4 text-sm">
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Test</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">SI Units</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Lt</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Rt</div>

                {/* OAE Test Results */}
                <div className="font-semibold border border-gray-400 p-2 text-gray-800">OAE Test</div>
                <div className="border border-gray-400 p-2 text-center text-gray-800">Pass/Refer</div>
                <div className="border border-gray-400 p-2 text-center text-gray-800">
                  {leftEarData ? (leftEarData.pass ? "Pass" : "Refer") : "—"}
                </div>
                <div className="border border-gray-400 p-2 text-center text-gray-800">
                  {rightEarData ? (rightEarData.pass ? "Pass" : "Refer") : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="px-8 mb-6">
            <form onSubmit={handleSaveComments} className="space-y-3 print:hidden">
              <div className="text-sm font-bold">Comments :</div>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter comments..."
                className="h-28 resize-none border border-gray-300 bg-gray-50"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateConsultationMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {updateConsultationMutation.isPending ? "Saving..." : "Save Comments"}
                </Button>
              </div>
            </form>
            <div className="hidden print:block border border-gray-300 p-4 min-h-[120px] mt-0">
              <div className="text-sm font-bold mb-2">Comments :</div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible">{comments || "No comments entered"}</div>
            </div>
          </div>

          {/* Audiologist Box */}
          <div className="px-8 mb-6 flex justify-end">
            <div className="border-2 border-blue-600 bg-blue-50 p-4 text-center">
              <div className="text-sm font-bold text-blue-900">Audiologist Name</div>
              <div className="text-xs text-blue-800 mt-1">{consultationData.audiologist?.user?.name || ""}</div>
              <div className="text-xs text-blue-900 font-bold mt-2">RCI No.</div>
              <div className="text-xs text-blue-800">{consultationData.audiologist?.rciNumber || ""}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-blue-900 text-white p-4">
            <div className="flex justify-center items-center space-x-8 text-sm">
              <div className="flex items-center"><span className="mr-2">📞</span><span>{consultationData.centre?.contactNumber || "+91 9289097578"}</span></div>
              <div className="flex items-center"><span className="mr-2">🌐</span><span>www.earkart.in</span></div>
              <div className="flex items-center"><span className="mr-2">📧</span><span>info@earkart.in</span></div>
            </div>
            <div className="text-center text-xs mt-2 opacity-80">(Not for Medico-legal Purpose)</div>
          </div>
        </div>
      </div>
      <StickyReportNavigation
        isScreenConnecting={isScreenConnecting}
        isScreenSharing={isScreenSharing}
        isShowingReport={isShowingReport}
        isSendingReport={isSendingReport}
        onToggleShowReport={handleShowReport}
        onShare={handleShareReport}
        onDoAnotherTest={() => {
          if (isShowingReport || isScreenSharing) {
            handleShowReport();
          }
          router.push(`/consultation/${consultationId}/test-selection`);
        }}
        onEndConsultation={() => router.push(`/consultation/${consultationId}/end-consultation`)}
      />
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share report via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">Enter one or more WhatsApp numbers. Separate with commas or spaces. Use 10-digit or include country code.</div>
            <Input
              placeholder="e.g. 9876543210, 919876543210"
              value={sharePhone}
              onChange={(e) => setSharePhone(e.target.value)}
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  setIsShareDialogOpen(false);
                  await sendReportToNumbers(sharePhone);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


