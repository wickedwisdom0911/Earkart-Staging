"use client";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import StickyReportNavigation from "@/components/ui/StickyReportNavigation";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { exportElementToPdfBlob } from "@/lib/pdf";
import ReportTopActions from "@/components/ui/ReportTopActions";
import useSharedScreenShare from "@/hooks/agora/use-shared-screen-share";
import useDemoAccount from "@/hooks/use-demo-account";
import { useSocket } from "@/providers/socket-provider";
import { useShareReportWhatsApp } from "@/hooks/consultation/use-share-report-whatsapp";
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
  Legend,
} from "recharts";

const CURVE_LABELS = ["Baseline", "Swallow", "Valsalva"];

export default function ETFIntactReportPage() {
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

  // Debug: Log consultation data
  useEffect(() => {
    if (consultationData) {
      console.log("[ETF Report] Consultation data loaded:", {
        hasEtfIntact: !!consultationData.etfIntact,
        etfIntact: consultationData.etfIntact,
        allKeys: Object.keys(consultationData),
      });
    }
  }, [consultationData]);
  const updateConsultationMutation = useUpdateConsultation();
  const [comments, setComments] = useState<string>("");
  const { isSharing: isScreenSharing, isConnecting: isScreenConnecting, toggleScreenShare, error: screenShareError } = useSharedScreenShare();
  const [isShowingReport, setIsShowingReport] = useState(false);
  const { isDemoAccount } = useDemoAccount();
  
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

  // WhatsApp sharing hook
  const {
    isSharing: isWhatsAppSharing,
    isShareDialogOpen,
    setIsShareDialogOpen,
    sharePhone,
    setSharePhone,
    defaultPatientPhone,
    handleShareClick,
    handleDialogConfirm,
  } = useShareReportWhatsApp({
    consultationId: consultationId as string,
    reportType: ReportType.ETF,
    patientName: consultationData?.patient?.name,
    patientContact: consultationData?.patient?.contactNumber,
    reportRef,
  });

  useEffect(() => {
    // Extract comments from notes if available
    const notes = consultationData?.notes || "";
    if (notes.includes("ETF Intact")) {
      setComments(notes);
    }
  }, [consultationData?.notes]);

  useEffect(() => { setSharePhone(defaultPatientPhone); }, [defaultPatientPhone, setSharePhone]);

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
        notes: comments,
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
      await exportElementToPdf(
        reportRef.current,
        `etf-intact-report-${consultationData?.patient?.code || "unknown"}.pdf`,
        { singlePage: true, fullPage: true }
      );
      toast.success("PDF downloaded successfully!");
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

  if (isLoading) return <div className="p-6">Loading report...</div>;
  if (error)
    return (
      <div className="p-6 text-red-500">
        Error loading report: {error.message}
      </div>
    );
  if (!consultationData)
    return <div className="p-6">No consultation data found</div>;

  const etfIntactData = consultationData.etfIntact;
  
  console.log("[ETF Report] Checking etfIntactData:", {
    exists: !!etfIntactData,
    isNull: etfIntactData === null,
    type: typeof etfIntactData,
    hasCurves: !!etfIntactData?.curves,
    curvesLength: etfIntactData?.curves?.length ?? 0,
    ecv: etfIntactData?.ecv,
    probeToneFreq: etfIntactData?.probeToneFreq,
    fullData: etfIntactData,
  });
  
  // Check if etfIntact exists and has curves
  if (!etfIntactData || etfIntactData === null || !Array.isArray(etfIntactData?.curves) || etfIntactData.curves.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No ETF Intact Data
          </h2>
          <p className="text-gray-500">
            No ETF Intact test has been performed for this consultation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex justify-center items-center bg-gray-100">
      <div className="w-[794px] max-h-[calc(100vh-2rem)] bg-white shadow-lg overflow-hidden">
        <ReportTopActions onDownload={handleDownloadPDF} onShare={handleShareClick} />

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
                  <p className="font-bold text-sm mb-1">{consultationData.centre?.user?.name || "Clinic Name"}</p>
                  <p className="font-semibold text-xs text-gray-700 mb-1">Dr. {consultationData.centre?.entName || "ENT Name"}</p>
                  <p className="font-semibold text-xs text-gray-700 mb-1">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</p>
                  <p className="text-xs text-gray-600">{consultationData.centre?.address || "Address"}</p>
                </div>
              </div>
            ) : (
              <div className="relative flex items-center justify-between p-6 z-10">
                <div className="flex items-center bg-white p-2 rounded">
                  <Image src="/logo.webp" alt="earKART Logo" width={200} height={250} className="bg-white" />
                </div>
                <div className="text-blue-900 px-6 py-4 rounded-lg shadow-md" style={{ backgroundColor: '#8bdaef' }}>
                  <div className="text-center">
                    <p className="font-bold text-sm mb-2">{consultationData.centre?.user?.name || "Clinic Name"}</p>
                    <div className="flex items-center justify-center mb-1"><span className="text-xs mr-1">👨‍⚕️</span><span className="text-xs">Dr. {consultationData.centre?.entName || "ENT Name"}</span></div>
                    <div className="flex items-center justify-center mb-1"><span className="text-xs mr-1">📞</span><span className="text-xs">{consultationData.centre?.contactNumber || "+91 XXXXXXXXXX"}</span></div>
                    <div className="flex items-center justify-center"><span className="text-xs mr-1">📍</span><span className="text-xs">{consultationData.centre?.address || "Address"}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="py-6 bg-gray-50 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <h2 className="text-xl font-bold text-gray-800">ETF Intact Test</h2>
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

          {/* ETF Charts - Overlapped */}
          <div className="px-8 py-6 bg-gray-50 relative z-0">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ETF Intact Readings</h3>
            
            {/* Left Ear Chart - filter by ear field */}
            {(() => {
              const leftEarCurves = etfIntactData.curves.filter((c: any) => c.ear === "LEFT" || c.ear === "L");
              return leftEarCurves.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Left Ear</h4>
            <div className="border rounded p-4">
              <div className="h-[400px] relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const curvesToDisplay = leftEarCurves;
                      
                      console.log("[ETF Report] Building overlay data:");
                      console.log("  - Total curves in data:", etfIntactData.curves.length);
                      console.log("  - Displaying curves:", curvesToDisplay.length);
                      console.log("  - ECV:", etfIntactData.ecv);
                      console.log("  - Curves data:", curvesToDisplay.map((c, i) => ({
                        index: i,
                        id: c.id,
                        peakPressure: c.peakPressure,
                        peakCompliance: c.peakCompliance,
                        hasPressureData: !!c.pressureData,
                        hasComplianceData: !!c.complianceData,
                        pressureDataLength: c.pressureData?.length ?? 0,
                        complianceDataLength: c.complianceData?.length ?? 0,
                        firstFewPressures: c.pressureData?.slice(0, 3),
                        firstFewCompliances: c.complianceData?.slice(0, 3),
                        middleCompliances: c.complianceData?.slice(Math.floor((c.complianceData?.length ?? 0) / 2) - 2, Math.floor((c.complianceData?.length ?? 0) / 2) + 2),
                      })));
                      
                      // Build overlay data from first 3 curves (merge by pressure)
                      const overlayMap = new Map<number, any>();
                      
                      curvesToDisplay.forEach((curve, curveIndex) => {
                        if (!curve.pressureData || !curve.complianceData) {
                          console.log(`[ETF Report] Curve ${curveIndex + 1} missing data - skipping`);
                          return;
                        }
                        
                        const curveKey = `curve${curveIndex + 1}`;
                        const ecv = etfIntactData.ecv ?? 0;
                        
                        console.log(`[ETF Report] Processing Curve ${curveIndex + 1}:`, {
                          pressureDataLength: curve.pressureData.length,
                          complianceDataLength: curve.complianceData.length,
                          firstPressure: curve.pressureData[0],
                          firstCompliance: curve.complianceData[0],
                          ecv,
                        });
                        
                        // Sort by pressure descending
                        // CRITICAL: Backend saves RAW compliance values
                        // We need to subtract ECV to display COMPENSATED compliance (matching the test page)
                        const sortedPoints = curve.pressureData
                          .map((pressure, idx) => {
                            const rawCompliance = curve.complianceData?.[idx] ?? 0;
                            // Compensate: subtract ECV (same as test page display)
                            const compensatedCompliance = Math.max(0, rawCompliance - ecv);
                            
                            if (idx < 3) {
                              console.log(`[ETF Report] Curve ${curveIndex + 1} point ${idx}:`, {
                                pressure,
                                rawCompliance,
                                ecv,
                                compensatedCompliance,
                              });
                            }
                            
                            return {
                              pressure,
                              compliance: compensatedCompliance, // Display compensated
                            };
                          })
                          .filter(p => p.pressure !== undefined && !isNaN(p.pressure) && p.compliance !== undefined && !isNaN(p.compliance))
                          .sort((a, b) => b.pressure - a.pressure);
                        
                        console.log(`[ETF Report] Curve ${curveIndex + 1} sorted points:`, {
                          totalPoints: sortedPoints.length,
                          firstPoint: sortedPoints[0],
                          lastPoint: sortedPoints[sortedPoints.length - 1],
                          sampleMiddlePoints: sortedPoints.slice(Math.floor(sortedPoints.length / 2) - 2, Math.floor(sortedPoints.length / 2) + 2),
                        });
                        
                        sortedPoints.forEach((point) => {
                          const pressure = point.pressure;
                          const compliance = point.compliance;
                          
                          if (pressure !== undefined && !isNaN(pressure) && compliance !== undefined && !isNaN(compliance)) {
                            let overlayPoint = overlayMap.get(pressure);
                            if (!overlayPoint) {
                              overlayPoint = { pressure };
                              overlayMap.set(pressure, overlayPoint);
                            }
                            overlayPoint[curveKey] = compliance;
                          }
                        });
                      });
                      
                      const overlayPoints = Array.from(overlayMap.values()).sort((a, b) => b.pressure - a.pressure);
                      
                      console.log("[ETF Report] Overlay:", {
                        totalPoints: overlayPoints.length,
                        firstPoint: overlayPoints[0],
                        samplePoints: overlayPoints.slice(0, 3),
                      });
                      
                      return overlayPoints;
                    })()}
                    margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="pressure"
                      type="number"
                      domain={[200, -400]}
                      ticks={[200, 100, 0, -100, -200, -300, -400]}
                      tickFormatter={(value: number) => `${value}`}
                      label={{ value: "Pressure (daPa)", position: "bottom", offset: 0 }}
                      scale="linear"
                    />
                    <YAxis
                      domain={[0, 3]}
                      tickFormatter={(value: number) => value.toFixed(1)}
                      label={{ value: "Compliance (ml)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (value === undefined || value === null) return [null, null];
                        return [`${value.toFixed(2)} ml`, name];
                      }}
                      labelFormatter={(label: number) => `Pressure: ${label} daPa`}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    {[1, 2, 3].map((curveNum) => {
                      const color = curveNum === 1 ? "#3B82F6" : curveNum === 2 ? "#EF4444" : "#10B981";
                      const label = CURVE_LABELS[curveNum - 1];
                      return (
                        <Line
                          key={`curve${curveNum}`}
                          type="linear"
                          dataKey={`curve${curveNum}`}
                          stroke={color}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                          name={label}
                          connectNulls={true}
                          isAnimationActive={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
            );
            })()}
            
            {/* Right Ear Chart - filter by ear field */}
            {(() => {
              const rightEarCurves = etfIntactData.curves.filter((c: any) => c.ear === "RIGHT" || c.ear === "R");
              return rightEarCurves.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Right Ear</h4>
                <div className="border rounded p-4">
                  <div className="h-[400px] relative overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(() => {
                          const curvesToDisplay = rightEarCurves;
                          
                          const overlayMap = new Map<number, any>();
                          
                          curvesToDisplay.forEach((curve, curveIndex) => {
                            if (!curve.pressureData || !curve.complianceData) return;
                            
                            const curveKey = `curve${curveIndex + 1}`;
                            const ecv = etfIntactData.ecv ?? 0;
                            
                            curve.pressureData.forEach((pressure: number, dataIndex: number) => {
                              const compliance = curve.complianceData?.[dataIndex];
                              
                              if (compliance === undefined || compliance === null) return;
                              
                              const compensatedCompliance = Math.max(0, compliance - ecv);
                              
                              if (!overlayMap.has(pressure)) {
                                overlayMap.set(pressure, { pressure });
                              }
                              
                              overlayMap.get(pressure)[curveKey] = compensatedCompliance;
                            });
                          });
                          
                          return Array.from(overlayMap.values()).sort((a, b) => a.pressure - b.pressure);
                        })()}
                        margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="pressure"
                          type="number"
                          domain={[-300, 200]}
                          ticks={[-300, -250, -200, -150, -100, -50, 0, 50, 100, 150, 200]}
                          label={{ value: "Pressure (daPa)", position: "insideBottom", offset: -10, style: { fontSize: 14, fill: "#555" } }}
                          tick={{ fontSize: 11, fill: "#555" }}
                        />
                        <YAxis
                          type="number"
                          domain={[0, 5]}
                          ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]}
                          label={{ value: "Compensated Compliance (ml)", angle: -90, position: "insideLeft", style: { fontSize: 14, fill: "#555" } }}
                          tick={{ fontSize: 11, fill: "#555" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            padding: "10px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          }}
                          formatter={(value: number, name: string) => {
                            if (typeof value !== "number" || isNaN(value)) return ["—", name];
                            return [value.toFixed(3) + " ml", name];
                          }}
                          labelFormatter={(label: number) => `Pressure: ${label} daPa`}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        {[1, 2, 3].map((curveNum) => {
                          const color = curveNum === 1 ? "#3B82F6" : curveNum === 2 ? "#EF4444" : "#10B981";
                          const label = CURVE_LABELS[curveNum - 1];
                          return (
                            <Line
                              key={`curve${curveNum}`}
                              type="linear"
                              dataKey={`curve${curveNum}`}
                              stroke={color}
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                              name={label}
                              connectNulls={true}
                              isAnimationActive={false}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
            })()}
          </div>

          {/* Investigation: ETF Intact */}
          <div className="mx-8 mb-6 relative z-10">
            <div className="bg-white border border-gray-300">
              <div className="bg-blue-900 text-white p-3 text-center">
                <h3 className="text-sm font-bold">Investigation : ETF Intact</h3>
              </div>
              <div className="grid grid-cols-4 text-sm">
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Test</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">SI Units</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Rt</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Lt</div>

                <div className="font-semibold border border-gray-400 p-2 text-gray-800">ECV</div>
                <div className="border border-gray-400 p-2 text-center text-gray-800">ml</div>
                <div className="border border-gray-400 p-2 text-center text-gray-800">{etfIntactData.ecv?.toFixed(2) || '—'}</div>
                <div className="border border-gray-400 p-2 text-center text-gray-800">{etfIntactData.ecv?.toFixed(2) || '—'}</div>
                
                {/* Left Ear Data - filter by ear field */}
                {etfIntactData.curves
                  .filter((c: any) => c.ear === "LEFT" || c.ear === "L")
                  .map((curve: any, index: number) => (
                  <React.Fragment key={`left-${index}`}>
                    <div className="font-semibold border border-gray-400 p-2 text-gray-800">{CURVE_LABELS[index]} Peak Pressure</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">daPa</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">—</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">{curve.peakPressure?.toFixed(1) || '—'}</div>
                    <div className="font-semibold border border-gray-400 p-2 text-gray-800">{CURVE_LABELS[index]} Peak Compliance</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">ml</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">—</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">{curve.peakCompliance?.toFixed(2) || '—'}</div>
                  </React.Fragment>
                ))}
                
                {/* Right Ear Data - filter by ear field */}
                {etfIntactData.curves
                  .filter((c: any) => c.ear === "RIGHT" || c.ear === "R")
                  .map((curve: any, index: number) => (
                  <React.Fragment key={`right-${index}`}>
                    <div className="font-semibold border border-gray-400 p-2 text-gray-800">{CURVE_LABELS[index]} Peak Pressure</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">daPa</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">{curve.peakPressure?.toFixed(1) || '—'}</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">—</div>
                    <div className="font-semibold border border-gray-400 p-2 text-gray-800">{CURVE_LABELS[index]} Peak Compliance</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">ml</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">{curve.peakCompliance?.toFixed(2) || '—'}</div>
                    <div className="border border-gray-400 p-2 text-center text-gray-800">—</div>
                  </React.Fragment>
                ))}
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
        isSendingReport={isWhatsAppSharing}
        onToggleShowReport={handleShowReport}
        onShare={handleShareClick}
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
                onClick={handleDialogConfirm}
                disabled={isWhatsAppSharing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isWhatsAppSharing ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


