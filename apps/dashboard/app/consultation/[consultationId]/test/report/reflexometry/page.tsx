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
import ReportTopActions from "@/components/ui/ReportTopActions";
import useSharedScreenShare from "@/hooks/agora/use-shared-screen-share";
import useDemoAccount from "@/hooks/use-demo-account";
import { useSocket } from "@/providers/socket-provider";
import { useShareReportWhatsApp } from "@/hooks/consultation/use-share-report-whatsapp";
import { ReportType } from "@/models/enums";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const FREQUENCIES = [500, 1000, 2000, 4000];

const WaveformGraph: React.FC<{
  data: { time: number; amplitude: number }[];
  ear: Ear;
  mode: "IPSI" | "CONTRA";
  frequency: number;
}> = ({ data, ear, mode, frequency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-20 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }
  const amplitudes = data.map(d => d.amplitude);
  const minAmp = Math.min(...amplitudes);
  const maxAmp = Math.max(...amplitudes);
  const padding = (maxAmp - minAmp) * 0.1 || 0.1;
  const yDomain: [number, number] = [minAmp - padding, maxAmp + padding];
  const color = ear === Ear.LEFT ? "#3B82F6" : "#EF4444";
  return (
    <div className="h-20 bg-white border border-gray-200 rounded">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={yDomain} hide />
          <Line type="monotone" dataKey="amplitude" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface ReflexResponse {
  ear: "LEFT" | "RIGHT";
  earType: number;  // 0 = IPSI, 1 = CONTRA
  signalType: number;
  frequencyHz: number;
  stimulusDurationMs: number;
  samplesWithStimulusOn: number;
  levelDb: number;
  startingLevelDb: number;
  complianceData: number[];
  possibleReflex: boolean;
  deflectionThreshold: number;
  mode: "IPSI" | "CONTRA";
}

export default function ReflexometryReportPage() {
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
  const updateConsultationMutation = useUpdateConsultation();
  
  // Check if this is Shriram Hospital
  const isShriramHospital = consultationData?.centre?.user?.email?.toLowerCase() === "bills.shriramhospital@gmail.com" || 
                             consultationData?.centre?.user?.name?.toLowerCase()?.includes("shri ram") || 
                             consultationData?.centre?.user?.name?.toLowerCase()?.includes("shriram");
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
    reportType: ReportType.REFLEXES,
    patientName: consultationData?.patient?.name,
    patientContact: consultationData?.patient?.contactNumber,
    reportRef,
  });

  useEffect(() => {
    setComments((consultationData as any)?.reflexometryReport || "");
  }, [(consultationData as any)?.reflexometryReport]);

  useEffect(() => { setSharePhone(defaultPatientPhone); }, [defaultPatientPhone, setSharePhone]);

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
        reflexometryReport: comments,
      } as any);
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
        `reflexometry-report-${consultationData?.patient?.code || "unknown"}.pdf`,
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

  // Helper functions for data extraction (defined before early returns)
  const getResponsesForEar = (ear: Ear): ReflexResponse[] => {
    const reflexData = (consultationData as any)?.reflexometry;
    if (!reflexData?.responses) return [];
    const earStr = ear === Ear.LEFT ? "LEFT" : "RIGHT";
    return reflexData.responses.filter((r: ReflexResponse) => r.ear === earStr);
  };

  const getThreshold = (ear: Ear, mode: "IPSI" | "CONTRA", freq: number): string => {
    const responses = getResponsesForEar(ear);
    const response = responses.find((r: ReflexResponse) => r.mode === mode && r.frequencyHz === freq);
    if (!response) return "—";
    if (!response.possibleReflex) return "NR";
    return `${response.levelDb}`;
  };

  const getWaveformData = (ear: Ear, mode: "IPSI" | "CONTRA", freq: number): { time: number; amplitude: number }[] => {
    const responses = getResponsesForEar(ear);
    const response = responses.find((r: ReflexResponse) => r.mode === mode && r.frequencyHz === freq);
    if (!response || !response.complianceData || response.complianceData.length === 0) return [];
    return response.complianceData.map((amplitude, index) => ({
      time: index,
      amplitude: amplitude,
    }));
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

  const reflexometryData = (consultationData as any)?.reflexometry;

  // Check if reflexometry data exists and has responses
  if (!reflexometryData || !reflexometryData.responses || reflexometryData.responses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No Reflexometry Data
          </h2>
          <p className="text-gray-500">
            No acoustic reflex test has been performed for this consultation.
          </p>
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>Debug: Check console for consultation data structure</div>
            {reflexometryData && (
              <div className="mt-2 text-red-500">
                Found reflexometry object but no responses (status: {reflexometryData.status}, responses: {reflexometryData.responses?.length || 0})
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex justify-center items-center bg-gray-100">
      <div className="w-[794px] max-h-[calc(100vh-2rem)] bg-white shadow-lg overflow-hidden">
        <ReportTopActions onDownload={handleDownloadPDF} onShare={handleShareClick} />

        <div ref={reportRef} data-report-capture="true" className="bg-white overflow-y-auto max-h-[calc(100vh-8rem)]" style={{ fontFamily: "Arial, sans-serif" }}>
          {/* Header */}
          <div className="relative overflow-hidden" data-section="header">
            {isShriramHospital ? (
              <div className="p-6">
                <div className="flex items-center justify-center gap-6 mb-3">
                  <Image src="/logo.webp" alt="earKART Logo" width={140} height={70} className="object-contain" style={{ height: "100px", width: "auto" }} />
                  <img src="/logos/shriram-hospital-logo.webp" alt="Shriram Hospital Logo" style={{ height: "100px", width: "auto", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
                <h2 className="text-xl font-bold text-gray-800">Acoustic Reflex Test</h2>
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
              <div className="flex items-center">
                <span className="font-medium mr-2">Referred by :</span>
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">{consultationData.centre?.entName || "ENT Name"}</span>
              </div>
            </div>
          </div>

          {/* Reflex Results Table */}
          <div className="mx-8 my-6">
            <div className="bg-white border border-gray-300">
              <div className="bg-blue-900 text-white p-3 text-center">
                <h3 className="text-sm font-bold">Acoustic Reflex Thresholds (dB HL)</h3>
              </div>

              {/* Right Ear Table */}
              <div className="p-4 border-b">
                <h4 className="text-sm font-bold text-red-600 mb-2">Right Ear</h4>
                <div className="grid grid-cols-5 text-sm">
                  <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Mode</div>
                  {FREQUENCIES.map(freq => (
                    <div key={freq} className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">
                      {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                    </div>
                  ))}

                  <div className="font-semibold border border-gray-400 p-2 text-gray-800 bg-red-50">IPSI</div>
                  {FREQUENCIES.map(freq => (
                    <div key={`right-ipsi-${freq}`} className="border border-gray-400 p-2 text-center text-gray-800">
                      {getThreshold(Ear.RIGHT, "IPSI", freq)}
                    </div>
                  ))}

                  <div className="font-semibold border border-gray-400 p-2 text-gray-800 bg-red-50">CONTRA</div>
                  {FREQUENCIES.map(freq => (
                    <div key={`right-contra-${freq}`} className="border border-gray-400 p-2 text-center text-gray-800">
                      {getThreshold(Ear.RIGHT, "CONTRA", freq)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Left Ear Table */}
              <div className="p-4">
                <h4 className="text-sm font-bold text-blue-600 mb-2">Left Ear</h4>
                <div className="grid grid-cols-5 text-sm">
                  <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Mode</div>
                  {FREQUENCIES.map(freq => (
                    <div key={freq} className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">
                      {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                    </div>
                  ))}

                  <div className="font-semibold border border-gray-400 p-2 text-gray-800 bg-blue-50">IPSI</div>
                  {FREQUENCIES.map(freq => (
                    <div key={`left-ipsi-${freq}`} className="border border-gray-400 p-2 text-center text-gray-800">
                      {getThreshold(Ear.LEFT, "IPSI", freq)}
                    </div>
                  ))}

                  <div className="font-semibold border border-gray-400 p-2 text-gray-800 bg-blue-50">CONTRA</div>
                  {FREQUENCIES.map(freq => (
                    <div key={`left-contra-${freq}`} className="border border-gray-400 p-2 text-center text-gray-800">
                      {getThreshold(Ear.LEFT, "CONTRA", freq)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="px-4 pb-4">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Legend:</span> NR = No Response (Absent), — = Not Tested
                </div>
              </div>
            </div>
          </div>

          {/* Waveform Graphs */}
          <div className="mx-8 my-6">
            <div className="bg-white border border-gray-300">
              <div className="bg-blue-900 text-white p-3 text-center">
                <h3 className="text-sm font-bold">Reflex Waveforms</h3>
              </div>

              {/* Right Ear Waveforms */}
              <div className="p-4 border-b">
                <h4 className="text-sm font-bold text-red-600 mb-3">Right Ear</h4>
                
                {/* IPSI Waveforms */}
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">IPSI</h5>
                  <div className="grid grid-cols-4 gap-2">
                    {FREQUENCIES.map(freq => (
                      <div key={`right-ipsi-${freq}`} className="border border-gray-300 rounded p-2">
                        <div className="text-xs font-medium text-center mb-1 text-gray-700">
                          {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                        </div>
                        <WaveformGraph
                          data={getWaveformData(Ear.RIGHT, "IPSI", freq)}
                          ear={Ear.RIGHT}
                          mode="IPSI"
                          frequency={freq}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* CONTRA Waveforms */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">CONTRA</h5>
                  <div className="grid grid-cols-4 gap-2">
                    {FREQUENCIES.map(freq => (
                      <div key={`right-contra-${freq}`} className="border border-gray-300 rounded p-2">
                        <div className="text-xs font-medium text-center mb-1 text-gray-700">
                          {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                        </div>
                        <WaveformGraph
                          data={getWaveformData(Ear.RIGHT, "CONTRA", freq)}
                          ear={Ear.RIGHT}
                          mode="CONTRA"
                          frequency={freq}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Left Ear Waveforms */}
              <div className="p-4">
                <h4 className="text-sm font-bold text-blue-600 mb-3">Left Ear</h4>
                
                {/* IPSI Waveforms */}
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">IPSI</h5>
                  <div className="grid grid-cols-4 gap-2">
                    {FREQUENCIES.map(freq => (
                      <div key={`left-ipsi-${freq}`} className="border border-gray-300 rounded p-2">
                        <div className="text-xs font-medium text-center mb-1 text-gray-700">
                          {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                        </div>
                        <WaveformGraph
                          data={getWaveformData(Ear.LEFT, "IPSI", freq)}
                          ear={Ear.LEFT}
                          mode="IPSI"
                          frequency={freq}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* CONTRA Waveforms */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">CONTRA</h5>
                  <div className="grid grid-cols-4 gap-2">
                    {FREQUENCIES.map(freq => (
                      <div key={`left-contra-${freq}`} className="border border-gray-300 rounded p-2">
                        <div className="text-xs font-medium text-center mb-1 text-gray-700">
                          {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
                        </div>
                        <WaveformGraph
                          data={getWaveformData(Ear.LEFT, "CONTRA", freq)}
                          ear={Ear.LEFT}
                          mode="CONTRA"
                          frequency={freq}
                        />
                      </div>
                    ))}
                  </div>
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



