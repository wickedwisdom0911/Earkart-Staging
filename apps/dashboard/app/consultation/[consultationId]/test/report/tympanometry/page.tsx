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
import useDemoAccount from "@/hooks/use-demo-account";
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
  const { isDemoAccount } = useDemoAccount();
  useEffect(() => {
    setComments(consultationData?.tympanometry?.notes || "");
  }, [consultationData?.tympanometry?.notes]);

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
    <div className="h-screen w-full overflow-hidden flex justify-center items-center bg-gray-100">
      <div className="w-[794px] max-h-[calc(100vh-2rem)] bg-white shadow-lg overflow-hidden">
        <ReportTopActions onDownload={handleDownloadPDF} onShare={handleShareReport} />

        <div ref={reportRef} data-report-capture="true" className="bg-white overflow-y-auto max-h-[calc(100vh-8rem)]" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="relative text-white overflow-hidden">
            <div className="relative flex items-center justify-between p-6 z-10">
              <div className="flex items-center bg-white p-2 rounded">
                <Image src="/EARKART LOGO BLUE.webp" alt="earKART Logo" width={200} height={250} className="bg-white" />
              </div>
              <div className="relative">
                <div className="text-blue-900 px-6 py-4 rounded-lg shadow-md" style={{ backgroundColor: '#8bdaef' }}>
                  <div className="text-center">
                    <p className="font-bold text-sm mb-2">{consultationData.centre?.user?.name || "Clinic Name"}</p>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-xs mr-1">👨‍⚕️</span>
                      <span className="text-xs">Dr. {consultationData.centre?.entName || "ENT Name"}</span>
                    </div>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-xs mr-1">📞</span>
                      <span className="text-xs">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-xs mr-1">📍</span>
                      <span className="text-xs">{consultationData.centre?.address || "Address"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="py-6 bg-gray-50 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <h2 className="text-xl font-bold text-gray-800">Impedance Audiometry</h2>
                {isDemoAccount && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
                    Demo Report
                  </span>
                )}
              </div>
              {isDemoAccount && (
                <p className="text-[11px] text-amber-800">
                  Generated from a demo account – data is illustrative only.
                </p>
              )}
            </div>
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
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{format(new Date(consultationData.createdAt), "dd/MM/yyyy")}</span>
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
              <div className="flex items-center">
                <span className="font-medium mr-2">Referred by :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.centre?.entName || "ENT Name"}</span>
              </div>
            </div>
          </div>

          {/* Tympanogram Charts */}
          <div className="px-8 py-6 bg-gray-50 relative z-0">
            {(() => {
              const leftReading = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.LEFT);
              const rightReading = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.RIGHT);

              const buildData = (r: TympanometryReadingModelData | undefined, ear: 'L' | 'R'): TympanogramPoint[] => {
                if (!r) return [];
                const data: TympanogramPoint[] = [];
                for (let pressure = 200; pressure >= -400; pressure -= 25) {
                  const distance = Math.abs(pressure - r.peakPressure);
                  const sigma = 100;
                  const normalized = distance / sigma;
                  const compliance = Math.max(r.staticCompliance * Math.exp(-(normalized * normalized) / 2), 0.05);
                  data.push({ pressure, compliance: compliance * 1.1, compensatedCompliance: compliance, ear });
                }
                return data;
              };

              // Build the list of graphs to render only for ears with data
              const graphs: React.ReactNode[] = [];
              if (rightReading) {
                graphs.push(
                  <div key="graph-right" className="flex-1 min-w-0">
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
              if (leftReading) {
                graphs.push(
                  <div key="graph-left" className="flex-1 min-w-0">
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

          {/* Investigation: Impedance */}
          <div className="mx-8 mb-6 relative z-10">
            <div className="bg-white border border-gray-300">
              <div className="bg-blue-900 text-white p-3 text-center">
                <h3 className="text-sm font-bold">Investigation : Impedance</h3>
              </div>
              <div className="grid grid-cols-4 text-sm">
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Test</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">SI Units</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Rt</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Lt</div>

                {(() => {
                  const left = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.LEFT);
                  const right = consultationData.tympanometry?.readings?.find(r => r.ear === Ear.RIGHT);
                  const row = (label: string, units: string, r?: (typeof right), l?: (typeof left), formatter?: (v: number) => string) => (
                    <>
                      <div className="font-semibold border border-gray-400 p-2 text-gray-800">{label}</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">{units}</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">{r ? (label === 'Tympanogram' ? r.tympType : formatter ? formatter((label === 'Compliance' ? r.staticCompliance : label === 'Ear canal volume' ? r.earCanalVolume : label === 'Peak Pressure' ? r.peakPressure : 0)) : '—') : '—'}</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">{l ? (label === 'Tympanogram' ? l.tympType : formatter ? formatter((label === 'Compliance' ? l.staticCompliance : label === 'Ear canal volume' ? l.earCanalVolume : label === 'Peak Pressure' ? l.peakPressure : 0)) : '—') : '—'}</div>
                    </>
                  );
                  return (
                    <>
                      {row('Tympanogram', '—', right, left)}
                      {row('Compliance', 'ml', right, left, (v) => `${v.toFixed(2)}`)}
                      {row('Ear canal volume', 'ml', right, left, (v) => `${v.toFixed(2)}`)}
                      {row('Peak Pressure', 'daPa', right, left, (v) => `${v}`)}
                      {/* Gradient not in model; show em dash */}
                      <div className="font-semibold border border-gray-400 p-2 text-gray-800">Gradient</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">daPa</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">—</div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">—</div>
                    </>
                  );
                })()}
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
  );
}
