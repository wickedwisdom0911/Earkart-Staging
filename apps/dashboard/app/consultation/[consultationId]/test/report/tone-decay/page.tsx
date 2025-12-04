"use client";

import React, { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ear, ToneDecayResult, ReportType } from "@/models/enums";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StickyReportNavigation from "@/components/ui/StickyReportNavigation";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import { toast } from "sonner";
import Image from "next/image";
import { exportElementToPdfBlob } from "@/lib/pdf";
import ReportTopActions from "@/components/ui/ReportTopActions";
import useSharedScreenShare from "@/hooks/agora/use-shared-screen-share";
import useDemoAccount from "@/hooks/use-demo-account";
import { useSocket } from "@/providers/socket-provider";
import { useShareReportWhatsApp } from "@/hooks/consultation/use-share-report-whatsapp";
import { ROUTES } from "@/lib/routes";

export default function ToneDecayReportPage() {
  const params = useParams();
  const router = useRouter();
  const socket = useSocket();
  const consultationId = params.consultationId as string;

  const { data: consultationResponse, isLoading, error } = useGetConsultation(consultationId);
  const consultation = consultationResponse?.data as ConsultationModelData | undefined;
  const consultationData = consultation;
  
  const testResults = consultation?.toneDecay?.earTests || [];
  
  const reportRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState("");
  const updateConsultationMutation = useUpdateConsultation();
  
  const { isDemoAccount } = useDemoAccount();
  const { 
    isSharing: isScreenSharing, 
    isConnecting: isScreenConnecting, 
    toggleScreenShare, 
    error: screenShareError 
  } = useSharedScreenShare();
  const [isShowingReport, setIsShowingReport] = useState(false);

  // WhatsApp sharing hook
  const {
    isSharing,
    isShareDialogOpen,
    setIsShareDialogOpen,
    sharePhone,
    setSharePhone,
    defaultPatientPhone,
    handleShareClick,
    handleDialogConfirm,
  } = useShareReportWhatsApp({
    consultationId,
    reportType: ReportType.TONE,
    patientName: consultationData?.patient?.name,
    patientContact: consultationData?.patient?.contactNumber,
    reportRef,
  });

  React.useEffect(() => {
    setSharePhone(defaultPatientPhone);
  }, [defaultPatientPhone, setSharePhone]);

  // Update comments state when consultation data loads
  React.useEffect(() => {
    if (consultation?.toneDecayReport) {
      setComments(consultation.toneDecayReport);
    }
  }, [consultation]);

  // Prevent body scrolling when component mounts
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  React.useEffect(() => {
    if (screenShareError) {
      toast.error(`Screen sharing error: ${screenShareError}`);
    }
  }, [screenShareError]);

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

  const handleBackToSelection = () => {
    router.push(ROUTES.CONSULTATION_TEST_SELECTION(consultationId));
  };

  const handleDownloadPDF = async () => {
    try {
      const reportElement = reportRef.current;
      if (!reportElement) return;

      await exportElementToPdfBlob(reportElement, "tone-decay-report.pdf");
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download report");
    }
  };

  const handleSaveComments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultationData) return;

    try {
      await updateConsultationMutation.mutateAsync({
        ...consultationData,
        toneDecayReport: comments,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Comments saved successfully");
    } catch (error) {
      toast.error("Failed to save comments");
    }
  };

  const getResultColor = (result: ToneDecayResult) => {
    switch (result) {
      case ToneDecayResult.NORMAL:
        return "text-green-600";
      case ToneDecayResult.ABNORMAL:
        return "text-red-600";
      case ToneDecayResult.CANNOT_DETERMINE:
        return "text-yellow-600";
      case ToneDecayResult.NOT_COMPLETED:
        return "text-gray-600";
      default:
        return "text-gray-600";
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

  const toneDecayData = consultationData.toneDecay;

  if (!toneDecayData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            No Tone Decay Data
          </h2>
          <p className="text-gray-500">
            No Tone Decay test has been performed for this consultation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden flex justify-center items-center bg-gray-100">
      <div className="w-[794px] max-h-[calc(100vh-2rem)] bg-white shadow-lg overflow-hidden flex flex-col">
        <ReportTopActions onDownload={handleDownloadPDF} onShare={handleShareClick} />

        <div ref={reportRef} data-report-capture="true" className="bg-white overflow-y-auto flex-1" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="relative text-white overflow-hidden">
            <div className="relative flex items-center justify-between p-6 z-10">
              <div className="flex items-center bg-white p-2 rounded">
                <Image src="/EARKART LOGO BLUE.webp" alt="earKART Logo" width={200} height={250} className="bg-white" />
              </div>
              <div className="relative">
                <div className="text-blue-900 px-6 py-4 rounded-lg shadow-md" style={{ backgroundColor: '#8bdaef' }}>
                  <div className="text-center">
                    <p className="font-bold text-sm mb-2">{consultationData?.centre?.user?.name || "Clinic Name"}</p>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-xs mr-1">👨‍⚕️</span>
                      <span className="text-xs">Dr. {consultationData?.centre?.entName || "ENT Name"}</span>
                    </div>
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-xs mr-1">📞</span>
                      <span className="text-xs">{consultationData?.centre?.contactNumber || "+91 XXXXXXXXXX"}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-xs mr-1">📍</span>
                      <span className="text-xs">{consultationData?.centre?.address || "Address"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="py-4 bg-gray-50 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <h2 className="text-xl font-bold text-gray-800">Tone Decay Test</h2>
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
                <span className="border-b border-dotted border-gray-400 flex-1 pb-1">
                  {format(new Date(consultationData.createdAt), "dd/MM/yyyy")}
                </span>
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

          {/* Investigation: Tone Decay */}
          <div className="mx-8 my-6 relative z-10">
            <div className="bg-white border border-gray-300">
              <div className="bg-blue-900 text-white p-3 text-center">
                <h3 className="text-sm font-bold">Investigation : Tone Decay Test</h3>
              </div>
              <div className="grid grid-cols-6 text-sm">
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Ear</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Frequency</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Starting Level</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Final Level</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Decay Time</div>
                <div className="text-center font-bold border border-gray-400 p-2 bg-gray-100 text-gray-800">Result</div>

                {testResults.length === 0 ? (
                  <div className="col-span-6 border border-gray-400 p-4 text-center text-gray-500">
                    No test results available
                  </div>
                ) : (
                  testResults.map((result, index) => (
                    <React.Fragment key={index}>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">
                        {result.ear === Ear.LEFT ? "Left" : "Right"}
                      </div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">
                        {result.frequencyHz} Hz
                      </div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">
                        {result.startingDb} dB HL
                      </div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">
                        {result.finalDb !== null && result.finalDb !== undefined ? `${result.finalDb} dB HL` : "—"}
                      </div>
                      <div className="border border-gray-400 p-2 text-center text-gray-800">
                        {result.decayTimeSec !== null && result.decayTimeSec !== undefined 
                          ? `${result.decayTimeSec}s` 
                          : "No decay"}
                      </div>
                      <div className={`border border-gray-400 p-2 text-center font-semibold ${getResultColor(result.result)}`}>
                        {result.result}
                      </div>
                    </React.Fragment>
                  ))
                )}
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
              <div className="whitespace-pre-wrap text-sm leading-relaxed break-words overflow-visible">
                {comments || "No comments entered"}
              </div>
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
              <div className="flex items-center">
                <span className="mr-2">📞</span>
                <span>{consultationData.centre?.contactNumber || "+91 9289097578"}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🌐</span>
                <span>www.earkart.in</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📧</span>
                <span>info@earkart.in</span>
              </div>
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
          router.push(ROUTES.CONSULTATION_TEST_SELECTION(consultationId));
        }}
        onEndConsultation={() => {
          router.push(`/consultation/${consultationId}`);
        }}
      />

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share report via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Enter one or more WhatsApp numbers. Separate with commas or spaces. Use 10-digit or include country code.
            </div>
            <Input
              placeholder="e.g. 9876543210, 919876543210"
              value={sharePhone}
              onChange={(e) => setSharePhone(e.target.value)}
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDialogConfirm}
                disabled={isSharing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSharing ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
