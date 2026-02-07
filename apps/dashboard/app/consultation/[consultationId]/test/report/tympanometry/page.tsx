"use client";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams, useRouter } from "next/navigation";
import { Ear, TympType } from "@/models/enums";
import { TympanometryReadingModelData } from "@/models/tympanometry.model";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
// PDF export utility is loaded dynamically to avoid bundling issues
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

interface TympanogramPoint {
  pressure: number;
  compliance: number;
  compensatedCompliance?: number;
  ear: "L" | "R";
}

interface TympanogramGraphProps {
  realTimeData: TympanogramPoint[];
  finalData: TympanogramPoint[];
  isTestCompleted: boolean;
  selectedEar: "L" | "R";
  pressureMax: number;
  pressureMin: number;
  complianceMax: number;
  complianceMin: number;
}

const TympanogramGraph: React.FC<TympanogramGraphProps> = ({
  realTimeData,
  finalData,
  isTestCompleted,
  selectedEar,
  pressureMax,
  pressureMin,
  complianceMax,
  complianceMin,
}) => {
  const data = isTestCompleted ? finalData : realTimeData;
  const color = selectedEar === "L" ? "#3B82F6" : "#EF4444";

  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="border rounded p-4">
        <div className="h-[400px] relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-medium">No Tympanogram Data</p>
              <p className="text-sm">Tympanogram data not available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded p-4">
      <div className="h-[400px] relative overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="pressure"
              domain={[200, -400]}
              ticks={[200, 100, 0, -100, -200, -300, -400]}
              tickFormatter={(value: number) => `${value}`}
              label={{ value: "Pressure (daPa)", position: "bottom" }}
              type="number"
              scale="linear"
            />
            <YAxis
              domain={[0, 2]}
              tickCount={5}
              tickFormatter={(value: number) => value.toFixed(1)}
              label={{ value: "Compliance (ml)", angle: -90, position: "left" }}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toFixed(2)} ml`,
                "Compensated Compliance",
              ]}
              labelFormatter={(label: number) => `Pressure: ${label} daPa`}
            />
            <ReferenceArea
              x1={pressureMax}
              x2={pressureMin}
              y1={complianceMin}
              y2={complianceMax}
              fill={selectedEar === "L" ? "#e6f3ff" : "#ffebee"}
              stroke={selectedEar === "L" ? "#3B82F6" : "#EF4444"}
              strokeWidth={1.5}
              fillOpacity={0.3}
              isFront={false}
            />
            <Line
              type="monotone"
              dataKey="compensatedCompliance"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
              name="Compensated Compliance"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function TympanometryReportPage() {
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
  const [sharePhone, setSharePhone] = useState<string>("");
  const updateConsultationMutation = useUpdateConsultation();
  const [comments, setComments] = useState<string>("");
  const { isSharing: isScreenSharing, isConnecting: isScreenConnecting, toggleScreenShare, error: screenShareError } = useSharedScreenShare();
  const [isShowingReport, setIsShowingReport] = useState(false);
  const [leftTympType, setLeftTympType] = useState<TympType | "">("");
  const [rightTympType, setRightTympType] = useState<TympType | "">("");
  
  // Diagnosis and Recommendation state
  const [diagnosisComment, setDiagnosisComment] = useState<string>("");
  const [suggestiveOf, setSuggestiveOf] = useState<string>("");
  const [recommendationComment, setRecommendationComment] = useState<string>("");
  
  // Storage key for diagnosis data
  const diagnosisStorageKey = `tympanometry-diagnosis-${consultationId}`;
  
  // Load diagnosis data from localStorage on mount
  useEffect(() => {
    if (consultationId && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(diagnosisStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDiagnosisComment(parsed.diagnosisComment || "");
          setRecommendationComment(parsed.recommendationComment || "");
          setSuggestiveOf(parsed.suggestiveOf || "");
        }
      } catch (e) {
        console.error("Failed to load diagnosis from localStorage:", e);
      }
    }
  }, [consultationId, diagnosisStorageKey]);
  
  // Load diagnosis from consultation data if available
  useEffect(() => {
    if (consultationData?.tympanometry?.notes) {
      try {
        const notes = JSON.parse(consultationData.tympanometry.notes);
        if (notes.diagnosisComment) setDiagnosisComment(notes.diagnosisComment);
        if (notes.recommendationComment) setRecommendationComment(notes.recommendationComment);
        if (notes.suggestiveOf) setSuggestiveOf(notes.suggestiveOf);
      } catch {
        // If notes is not JSON, treat as plain text (backward compatibility)
        if (typeof consultationData.tympanometry.notes === 'string') {
          setComments(consultationData.tympanometry.notes);
        }
      }
    }
  }, [consultationData?.tympanometry?.notes]);
  
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
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReportDate(e.target.value);
  };
  
  const handleDateSave = async () => {
    if (!consultationData || !reportDate) return;
    
    try {
      setIsSavingDate(true);
      // Parse the date from dd/MM/yyyy format
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
  // Keep comments empty - don't load from consultation data
  // useEffect(() => {
  //   setComments(consultationData?.tympanometry?.notes || "");
  // }, [consultationData?.tympanometry?.notes]);

  // Load tymp types from consultation data
  useEffect(() => {
    if (consultationData?.tympanometry?.readings) {
      const leftReading = consultationData.tympanometry.readings.find(r => r.ear === Ear.LEFT);
      const rightReading = consultationData.tympanometry.readings.find(r => r.ear === Ear.RIGHT);
      if (leftReading) setLeftTympType(leftReading.tympType);
      if (rightReading) setRightTympType(rightReading.tympType);
    }
  }, [consultationData?.tympanometry?.readings]);

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
        tympanometry: {
          ...consultationData.tympanometry!,
          notes: comments,
        },
      });
      toast.success("Comments saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save comments");
    }
  };

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationData) return;
    try {
      // Combine all diagnosis fields into notes as JSON
      const notesData = JSON.stringify({
        diagnosisComment,
        suggestiveOf,
        recommendationComment,
        recommendation: recommendationComment, // For backward compatibility
      });
      
      await updateConsultationMutation.mutateAsync({
        ...consultationData,
        tympanometry: {
          ...consultationData.tympanometry!,
          notes: notesData,
        },
      });
      
      // Also save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(diagnosisStorageKey, JSON.stringify({
          diagnosisComment,
          suggestiveOf,
          recommendationComment,
        }));
      }
      
      toast.success("Diagnosis and recommendation saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save diagnosis");
    }
  };
  
  // Save diagnosis/recommendation to localStorage whenever they change
  useEffect(() => {
    if (consultationId && typeof window !== 'undefined') {
      localStorage.setItem(diagnosisStorageKey, JSON.stringify({
        diagnosisComment,
        suggestiveOf,
        recommendationComment,
      }));
    }
  }, [diagnosisComment, suggestiveOf, recommendationComment, consultationId, diagnosisStorageKey]);

  const handleSaveTympTypes = async () => {
    if (!consultationData?.tympanometry) return;
    
    // Update readings only if tymp types are selected (not mandatory)
    const updatedReadings = consultationData.tympanometry.readings?.map(reading => {
      if (reading.ear === Ear.LEFT && leftTympType) {
        return { ...reading, tympType: leftTympType };
      }
      if (reading.ear === Ear.RIGHT && rightTympType) {
        return { ...reading, tympType: rightTympType };
      }
      return reading;
    }) || [];

    try {
      await updateConsultationMutation.mutateAsync({
        ...consultationData,
        tympanometry: {
          ...consultationData.tympanometry,
          readings: updatedReadings,
        },
      });
      toast.success("Tymp types saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save tymp types");
    }
  };

  // Handle tymp type change - just update state, don't modify comments
  const handleTympTypeChange = (ear: 'left' | 'right', tympType: TympType | "") => {
    if (ear === 'left') {
      setLeftTympType(tympType);
    } else {
      setRightTympType(tympType);
    }
  };

  // Helper: convert inline SVGs to images in the cloned DOM before rasterizing
  const rasterizeSVGsSync = (container: HTMLElement, ownerDocument: Document) => {
    const svgs = Array.from(container.querySelectorAll("svg")) as SVGSVGElement[];
    for (const svg of svgs) {
      try {
        const clone = svg.cloneNode(true) as SVGSVGElement;
        if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const rect = svg.getBoundingClientRect();
        const width = rect.width || Number(clone.getAttribute("width")) || svg.clientWidth;
        const height = rect.height || Number(clone.getAttribute("height")) || svg.clientHeight;
        if (width && height) {
          clone.setAttribute("width", String(width));
          clone.setAttribute("height", String(height));
        }
        const xml = new XMLSerializer().serializeToString(clone);
        const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
        const img = ownerDocument.createElement("img");
        (img as any).decoding = "sync";
        if ("loading" in img) (img as any).loading = "eager";
        img.setAttribute("width", String(width));
        img.setAttribute("height", String(height));
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
        img.style.display = getComputedStyle(svg).display === "inline" ? "inline-block" : "block";
        img.src = dataUrl;
        svg.style.display = "none";
        svg.parentNode?.insertBefore(img, svg);
      } catch {
        // ignore
      }
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
          // Serialize SVG and draw onto a canvas, then swap with <img src=png>
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
        `tympanometry-report-${consultationData?.patient?.code || "unknown"}.pdf`,
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
    
    try {
      toast.info("Preparing report for sharing...");
      
      // Generate fresh PDF
      const blob = await exportElementToPdfBlob(reportRef.current, { singlePage: true, fullPage: true });
      const file = new File([blob], `tympanometry-report-${consultationData.patient?.code || "unknown"}.pdf`, { type: "application/pdf" });
      
      // Prepare recipients list once so both success and fallback can use it
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

      // Get pre-signed URL
      const initiateResult = await initiateReportUpload({
        consultationId: consultationId as string,
        reportType: ReportType.TYMPANOMETRY,
        fileName: file.name,
        contentType: file.type,
      });
      
      if (!initiateResult.success || !initiateResult.data) {
        throw new Error(initiateResult.message || "Failed to initiate upload");
      }
      
      const { presignedUrl, uploadId } = initiateResult.data;
      
      // Upload to S3
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
        
        // Complete the upload
        const completeResult = await completeReportUpload({
          uploadId,
          consultationId: consultationId as string,
          reportType: ReportType.TYMPANOMETRY,
        });
        
        if (!completeResult.success || !completeResult.data) {
          throw new Error(completeResult.message || "Failed to complete upload");
        }
        
        const finalReportUrl = completeResult.data.fileUrl;
        
        // Send WhatsApp message
        const patientName = consultationData.patient?.name || "Patient";
        // uniqueRecipients available from earlier
        
        const results = await Promise.allSettled(uniqueRecipients.map(async (to) => {
          try {
            const response = await fetch('/api/whatsapp/send-report-dialog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, patientName, reportUrl: finalReportUrl, reportType: 'tympanometry' })
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
          console.warn('Some sends failed:', results);
        } else {
          toast.error('Failed to share report to all recipients');
        }
        
      } catch (s3Error) {
        console.error("S3 upload failed, using fallback:", s3Error);
        toast.warning("Using fallback URL for sharing");
        
        // Fallback to hardcoded URL
        const patientName = consultationData.patient?.name || "Patient";
        
        const results = await Promise.allSettled(uniqueRecipients.map(async (to) => {
          try {
            const response = await fetch('/api/whatsapp/send-report-dialog', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, patientName, reportUrl: "https://omni-two.s3.ap-south-1.amazonaws.com/reports/test-tympanometry-report.pdf", reportType: 'tympanometry' })
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
          console.warn('Some sends failed:', results);
        } else {
          toast.error('Failed to share report to all recipients');
        }
      }
      
    } catch (err) {
      console.error("Error sharing report:", err);
      toast.error(`Failed to share report: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleShareReport = () => {
    // Check if user is AIIMS employee
    const isAiims = typeof window !== 'undefined' && localStorage.getItem('isAiims') === 'true';
    
    if (isAiims) {
      // For AIIMS employees, directly send to hardcoded number
      console.log('🏥 AIIMS employee detected - sending report to hardcoded number');
      sendReportToNumbers('919980936971'); // Hardcoded AIIMS number with country code
    } else {
      // For other users, show the dialog
      setIsShareDialogOpen(true);
    }
  };

  const getTympTypeDescription = (type: TympType): string => {
    switch (type) {
      case TympType.A:
        return "Normal - Normal middle ear function";
      case TympType.As:
        return "Shallow - Reduced compliance, possible ossicular fixation";
      case TympType.Ad:
        return "Deep - High compliance, possible ossicular discontinuity";
      case TympType.B:
        return "Flat - No compliance peak, possible middle ear effusion or perforation";
      case TympType.C:
        return "Negative Pressure - Eustachian tube dysfunction";
      default:
        return "Unknown";
    }
  };

  const getEarLabel = (ear: Ear): string => {
    return ear === Ear.LEFT ? "Left Ear" : "Right Ear";
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

  const tympanometryData = consultationData.tympanometry;

  if (!tympanometryData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No Tympanometry Data
          </h2>
          <p className="text-gray-500">
            No tympanometry test has been performed for this consultation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ===== PRINT STYLES (@media print) ===== */
        /* Goal: print output should match on-screen appearance exactly */
        @media print {
          /* Logo */
          [data-section="header"] img {
            max-height: 90px !important;
            width: auto !important;
            height: auto !important;
          }
          
          /* Centre details - match on-screen: text-base (16px) clinic name, text-sm (14px) details */
          [data-section="header"] .text-blue-900 {
            padding: 16px 20px !important;
          }
          [data-section="header"] .text-blue-900 p {
            font-size: 16px !important;
            margin-bottom: 6px !important;
            font-weight: bold !important;
          }
          [data-section="header"] .text-blue-900 div {
            font-size: 14px !important;
            margin-bottom: 4px !important;
          }
          [data-section="header"] .text-blue-900 span {
            font-size: 14px !important;
          }
          
          /* Patient info - match on-screen: text-base (16px) */
          .patient-info-section {
            font-size: 16px !important;
          }
          .patient-info-section .font-medium {
            font-size: 16px !important;
            font-weight: 500 !important;
          }
          .patient-info-section span {
            font-size: 16px !important;
          }
          
          /* Title */
          .report-title h2 {
            font-size: 20px !important;
          }
          
          /* Investigation table header - match on-screen: text-base (16px) */
          .investigation-table .bg-blue-900 {
            padding: 12px !important;
          }
          .investigation-table .bg-blue-900 h3 {
            font-size: 16px !important;
          }
          
          /* Investigation table cells - match on-screen: text-base (16px) */
          .investigation-table .grid.grid-cols-4 > div {
            font-size: 16px !important;
            padding: 8px !important;
          }
          
          /* Diagnosis section - match on-screen form: text-sm (14px) labels, text-sm content */
          .diagnosis-section-container {
            padding: 0 !important;
            margin-bottom: 3mm !important;
          }
          .diagnosis-section-container > div {
            gap: 3mm !important;
          }
          .diagnosis-section-container .border {
            padding: 8px !important;
            min-height: 20mm !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
          }
          .diagnosis-section-container div[class*="font-bold"] {
            font-size: 14px !important;
            margin-bottom: 4px !important;
          }
          
          /* Comments section - match on-screen form: text-sm (14px) */
          .comments-print-section {
            padding: 12px !important;
            min-height: 20mm !important;
          }
          .comments-print-section .font-bold {
            font-size: 14px !important;
            margin-bottom: 4px !important;
          }
          .comments-print-section .whitespace-pre-wrap {
            font-size: 14px !important;
            line-height: 1.6 !important;
          }
          
          /* Audiologist box - match on-screen */
          .audiologist-box {
            padding: 12px !important;
          }
          .audiologist-box .font-bold {
            font-size: 14px !important;
          }
          .audiologist-box .text-xs {
            font-size: 12px !important;
          }
          
          /* Footer - match on-screen */
          .report-footer .text-sm {
            font-size: 14px !important;
          }
          .report-footer .text-xs {
            font-size: 12px !important;
          }
        }
        
        /* ===== PDF EXPORT STYLES (html2canvas ignores @media print) ===== */
        /* Same sizes as @media print so PDF download matches print exactly */
        
        /* Logo */
        [data-export-mark="1"] [data-section="header"] img {
          max-height: 90px !important;
          width: auto !important;
          height: auto !important;
        }
        
        /* Centre details - match on-screen */
        [data-export-mark="1"] [data-section="header"] .text-blue-900 {
          padding: 16px 20px !important;
        }
        [data-export-mark="1"] [data-section="header"] .text-blue-900 p {
          font-size: 16px !important;
          margin-bottom: 6px !important;
          font-weight: bold !important;
        }
        [data-export-mark="1"] [data-section="header"] .text-blue-900 div {
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }
        [data-export-mark="1"] [data-section="header"] .text-blue-900 span {
          font-size: 14px !important;
        }
        
        /* Patient info - match on-screen: text-base (16px) */
        [data-export-mark="1"] .patient-info-section {
          font-size: 16px !important;
        }
        [data-export-mark="1"] .patient-info-section .font-medium {
          font-size: 16px !important;
          font-weight: 500 !important;
        }
        [data-export-mark="1"] .patient-info-section span {
          font-size: 16px !important;
        }
        
        /* Title */
        [data-export-mark="1"] .report-title h2 {
          font-size: 20px !important;
        }
        
        /* Investigation table header - match on-screen: text-base (16px) */
        [data-export-mark="1"] .investigation-table .bg-blue-900 {
          padding: 12px !important;
        }
        [data-export-mark="1"] .investigation-table .bg-blue-900 h3 {
          font-size: 16px !important;
        }
        
        /* Investigation table cells - match on-screen: text-base (16px) */
        [data-export-mark="1"] .investigation-table .grid.grid-cols-4 > div {
          font-size: 16px !important;
          padding: 8px !important;
        }
        
        /* Diagnosis section - match on-screen form: text-sm (14px) */
        [data-export-mark="1"] .diagnosis-section-container {
          padding: 0 !important;
          margin-bottom: 3mm !important;
        }
        [data-export-mark="1"] .diagnosis-section-container > div {
          gap: 3mm !important;
        }
        [data-export-mark="1"] .diagnosis-section-container .border {
          padding: 8px !important;
          min-height: 20mm !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        [data-export-mark="1"] .diagnosis-section-container div[class*="font-bold"] {
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }
        
        /* Comments section - match on-screen form: text-sm (14px) */
        [data-export-mark="1"] .comments-print-section {
          padding: 12px !important;
          min-height: 20mm !important;
        }
        [data-export-mark="1"] .comments-print-section .font-bold {
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }
        [data-export-mark="1"] .comments-print-section .whitespace-pre-wrap {
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        
        /* Audiologist box - match on-screen */
        [data-export-mark="1"] .audiologist-box {
          padding: 12px !important;
        }
        [data-export-mark="1"] .audiologist-box .font-bold {
          font-size: 14px !important;
        }
        [data-export-mark="1"] .audiologist-box .text-xs {
          font-size: 12px !important;
        }
        
        /* Footer - match on-screen */
        [data-export-mark="1"] .report-footer .text-sm {
          font-size: 14px !important;
        }
        [data-export-mark="1"] .report-footer .text-xs {
          font-size: 12px !important;
        }
      `}</style>
      <div className="h-screen w-full overflow-hidden flex justify-center items-center bg-gray-100">
        <div className="w-[794px] max-h-[calc(100vh-2rem)] bg-white shadow-lg overflow-hidden">
          <ReportTopActions onDownload={handleDownloadPDF} onShare={handleShareReport} />

        <div ref={reportRef} data-report-capture="true" className="bg-white overflow-y-auto max-h-[calc(100vh-8rem)]" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="relative text-white overflow-hidden" data-section="header">
            <div className="relative flex items-center justify-between p-6 z-10">
              <div className="flex items-center bg-white p-2 rounded">
                <Image src="/EARKART LOGO BLUE.webp" alt="earKART Logo" width={200} height={250} className="bg-white" />
              </div>
              <div className="relative">
                <div className="text-blue-900 px-6 py-4 rounded-lg shadow-md" style={{ backgroundColor: '#8bdaef' }}>
                  <div className="text-center">
                    <p className="font-bold text-base mb-2">{consultationData.centre?.user?.name || "Demo Clinic"}</p>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-sm mr-1">👨‍⚕️</span>
                      <span className="text-sm">Dr. {consultationData.centre?.entName || "Demo ENT"}</span>
                    </div>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-sm mr-1">📞</span>
                      <span className="text-sm">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-sm mr-1">📍</span>
                      <span className="text-sm">{consultationData.centre?.address || "Address"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-3 bg-gray-50 report-title">
            <h2 className="text-xl font-bold text-gray-800">Impedance Audiometry</h2>
          </div>

            {/* Patient Information */}
          <div className="px-8 py-3 bg-white border-b patient-info-section">
            <div className="grid grid-cols-12 gap-4 text-base">
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

            <div className="grid grid-cols-12 gap-4 text-base mt-2">
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

            <div className="grid grid-cols-2 gap-4 text-base mt-2">
              <div className="flex items-center">
                <span className="font-medium mr-2">Contact No. :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.patient?.contactNumber || ""}</span>
                </div>
              <div className="flex items-center">
                <span className="font-medium mr-2">Referred by :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.centre?.entName || "ENT Name"}</span>
              </div>
            </div>
          </div>

          {/* Tympanogram Charts */}
          <div className="px-8 py-4 print:py-3 bg-gray-50 relative z-0">
            {(() => {
              const leftReading = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.LEFT);
              const rightReading = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.RIGHT);

              const buildData = (r: TympanometryReadingModelData | undefined, ear: 'L' | 'R'): TympanogramPoint[] => {
                if (!r) return [];
                
                // Only use saved pressureData and complianceData arrays - NO synthetic generation
                // This ensures Report curve = Test curve exactly
                if (r.pressureData && r.complianceData && r.pressureData.length > 0) {
                  const savedPoints: TympanogramPoint[] = r.pressureData.map(
                    (pressure: number, index: number) => {
                      const rawCompliance = r.complianceData![index];
                      const ecvValue = r.earCanalVolume;
                      const compensatedCompliance = Math.max(0, rawCompliance - ecvValue);
                      return {
                        pressure,
                        compliance: rawCompliance,
                        compensatedCompliance,
                        ear,
                      };
                    }
                  );
                  return savedPoints;
                }
                
                // No data arrays available - return empty array (no graph shown)
                // This ensures we never show a synthetic curve that doesn't match the test
                return [];
              };

              // Build the list of graphs to render only for ears with data
              // Left ear on left side, Right ear on right side
              const graphs: React.ReactNode[] = [];
              if (leftReading) {
                graphs.push(
                  <div key="graph-left" className="flex-1 min-w-0">
                    <div className="text-center text-sm font-bold text-blue-600 mb-2">Left Ear</div>
                    <TympanogramGraph
                      realTimeData={[]}
                      finalData={buildData(leftReading, 'L')}
                      isTestCompleted={true}
                      selectedEar={'L'}
                      pressureMax={200}
                      pressureMin={-400}
                      complianceMax={2.0}
                      complianceMin={0}
                    />
                  </div>
                );
              }
              if (rightReading) {
                graphs.push(
                  <div key="graph-right" className="flex-1 min-w-0">
                    <div className="text-center text-sm font-bold text-red-600 mb-2">Right Ear</div>
                    <TympanogramGraph
                      realTimeData={[]}
                      finalData={buildData(rightReading, 'R')}
                      isTestCompleted={true}
                      selectedEar={'R'}
                      pressureMax={200}
                      pressureMin={-400}
                      complianceMax={2.0}
                      complianceMin={0}
                    />
                  </div>
                );
              }

              // If no readings at all, show a single placeholder
              if (graphs.length === 0) {
                return (
                  <div className="border rounded p-4">
                    <div className="h-[200px] flex items-center justify-center text-gray-500">
                      No Tympanogram Data
                    </div>
                  </div>
                );
              }

              return (
                <div className={`flex items-start gap-8 ${graphs.length === 1 ? 'justify-center' : 'justify-between'}`}>
                  {graphs}
                </div>
              );
            })()}
          </div>

          {/* Tymp Type Selection */}
          <div className="px-8 mb-6 print:hidden">
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <h3 className="text-sm font-bold mb-4">Tympanogram Type Selection</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Left Ear</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={leftTympType}
                    onChange={(e) => handleTympTypeChange('left', e.target.value as TympType | "")}
                  >
                    <option value="">Select Type (Optional)</option>
                    <option value={TympType.A}>Type A - Normal</option>
                    <option value={TympType.As}>Type As - Shallow</option>
                    <option value={TympType.Ad}>Type Ad - Deep</option>
                    <option value={TympType.B}>Type B - Flat</option>
                    <option value={TympType.C}>Type C - Negative Pressure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Right Ear</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={rightTympType}
                    onChange={(e) => handleTympTypeChange('right', e.target.value as TympType | "")}
                  >
                    <option value="">Select Type (Optional)</option>
                    <option value={TympType.A}>Type A - Normal</option>
                    <option value={TympType.As}>Type As - Shallow</option>
                    <option value={TympType.Ad}>Type Ad - Deep</option>
                    <option value={TympType.B}>Type B - Flat</option>
                    <option value={TympType.C}>Type C - Negative Pressure</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSaveTympTypes}
                  disabled={updateConsultationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateConsultationMutation.isPending ? "Saving..." : "Save Tymp Types"}
                </Button>
              </div>
            </div>
          </div>

          {/* Investigation: Impedance */}
          <div className="mx-8 mb-4 relative z-10 investigation-table">
            <div className="bg-white border border-gray-300">
              <div className="bg-blue-900 text-white p-3 text-center">
                <h3 className="text-base font-bold">Investigation : Impedance</h3>
              </div>
              <div className="grid grid-cols-4 text-base">
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Test</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">SI Units</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Lt</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Rt</div>

                {(() => {
                  const left = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.LEFT);
                  const right = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.RIGHT);
                  const row = (label: string, units: string, l?: (typeof left), r?: (typeof right), formatter?: (v: number) => string) => {
                    // For Compliance, prefer peakCompensatedWithECV if available (matches controls), otherwise use staticCompliance
                    const getComplianceValue = (reading?: typeof right | typeof left) => {
                      if (!reading) return 0;
                      if (label === 'Compliance') {
                        return reading.peakCompensatedWithECV ?? reading.staticCompliance ?? 0;
                      }
                      if (label === 'Ear canal volume') return reading.earCanalVolume ?? 0;
                      if (label === 'Peak Pressure') return reading.peakPressure ?? 0;
                      if (label === 'Gradient') return reading.gradient ?? 0;
                      return 0;
                    };
                    
                    // For Tympanogram row, use the selected tymp types from state (updates immediately on selection)
                    const getLeftTympType = () => leftTympType || l?.tympType || '—';
                    const getRightTympType = () => rightTympType || r?.tympType || '—';
                    
                    return (
                      <>
                        <div className="font-semibold border border-gray-400 p-2 text-gray-800 text-base">{label}</div>
                        <div className="border border-gray-400 p-2 text-center text-gray-800 text-base">{units}</div>
                        <div className="border border-gray-400 p-2 text-center text-gray-800 text-base">{l ? (label === 'Tympanogram' ? getLeftTympType() : formatter ? formatter(getComplianceValue(l)) : '—') : (label === 'Tympanogram' && leftTympType ? getLeftTympType() : '—')}</div>
                        <div className="border border-gray-400 p-2 text-center text-gray-800 text-base">{r ? (label === 'Tympanogram' ? getRightTympType() : formatter ? formatter(getComplianceValue(r)) : '—') : (label === 'Tympanogram' && rightTympType ? getRightTympType() : '—')}</div>
                      </>
                    );
                  };
                  return (
                    <>
                      {row('Tympanogram', '—', left, right)}
                      {row('Compliance', 'ml', left, right, (v) => `${v.toFixed(2)}`)}
                      {row('Ear canal volume', 'ml', left, right, (v) => `${v.toFixed(2)}`)}
                      {row('Peak Pressure', 'daPa', left, right, (v) => `${v}`)}
                      {row('Gradient', 'ml/daPa', left, right, (v) => v > 0 ? `${v.toFixed(2)}` : '—')}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Diagnosis and Recommendation Section */}
          <div className="px-8 mb-4 print:mb-2">
            <form onSubmit={handleSaveDiagnosis} className="space-y-4 print:hidden">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-bold mb-1">Provisional Diagnosis :</div>
                  <Textarea
                    value={diagnosisComment}
                    onChange={(e) => setDiagnosisComment(e.target.value)}
                    placeholder="Enter provisional diagnosis..."
                    className="h-20 resize-none border border-gray-400 bg-gray-50 text-sm"
                  />
                </div>

                <div>
                  <div className="text-sm font-bold mb-1">Suggestive of Diagnosis :</div>
                  <Textarea
                    value={suggestiveOf}
                    onChange={(e) => setSuggestiveOf(e.target.value)}
                    placeholder="Enter suggestive diagnosis..."
                    className="h-20 resize-none border border-gray-400 bg-gray-50 text-sm"
                  />
                </div>

                <div>
                  <div className="text-sm font-bold mb-1">Recommendation :</div>
                  <Textarea
                    value={recommendationComment}
                    onChange={(e) => setRecommendationComment(e.target.value)}
                    placeholder="Enter recommendations..."
                    className="h-20 resize-none border border-gray-400 bg-gray-50 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateConsultationMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {updateConsultationMutation.isPending ? "Saving..." : "Save Diagnosis & Recommendation"}
                </Button>
              </div>
            </form>
            
            {/* Print/PDF Display for Diagnosis and Recommendation */}
            <div className="hidden print:block diagnosis-section-container">
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-bold mb-1">Provisional Diagnosis :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible min-h-[20px]">
                    {diagnosisComment || "No diagnosis entered"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-bold mb-1">Suggestive of Diagnosis :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible min-h-[20px]">
                    {suggestiveOf || "No suggestions entered"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-bold mb-1">Recommendation :</div>
                  <div className="border border-gray-400 bg-gray-50 p-2 whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible min-h-[20px]">
                    {recommendationComment || "No recommendations entered"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="px-8 mb-4 print:mb-2">
            <form onSubmit={handleSaveComments} className="space-y-3 print:hidden">
              <div className="text-sm font-bold">Comments :</div>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter comments..."
                className="h-24 resize-none border border-gray-300 bg-gray-50 text-sm"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateConsultationMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {updateConsultationMutation.isPending ? "Saving..." : "Save Comments"}
                </Button>
              </div>
            </form>
            <div className="hidden print:block border border-gray-300 p-3 min-h-[60px] mt-0 comments-print-section">
              <div className="text-sm font-bold mb-1">Comments :</div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible">{comments || "No comments entered"}</div>
            </div>
          </div>

          {/* Audiologist Box */}
          <div className="px-8 mb-4 flex justify-end">
            <div className="border-2 border-blue-600 bg-blue-50 p-3 text-center audiologist-box">
              <div className="text-sm font-bold text-blue-900">Audiologist Name</div>
              <div className="text-xs text-blue-800 mt-1">{consultationData.audiologist?.user?.name || ""}</div>
              <div className="text-xs text-blue-900 font-bold mt-2">RCI No.</div>
              <div className="text-xs text-blue-800">{consultationData.audiologist?.rciNumber || ""}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-blue-900 text-white p-4 report-footer">
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
        onToggleShowReport={handleShowReport}
        onShare={handleShareReport}
        onDoAnotherTest={() => {
          // Automatically hide the report if it's currently being shown
          if (isShowingReport || isScreenSharing) {
            handleShowReport(); // This will toggle it off
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
    </>
  );
}