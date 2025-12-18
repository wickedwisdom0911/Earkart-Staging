"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Video,
  Download,
  PlayCircle,
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import getConsultation from "@/actions/consultations/get_consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { normalizePlaybackUrl } from "@/lib/url-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/VideoPlayer";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useSocket } from "@/providers/socket-provider";
import { toast } from "sonner";

export default function ConsultationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.consultationId as string;
  const socket = useSocket();
  
  const [consultation, setConsultation] = useState<ConsultationModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<{
    url: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getConsultation(consultationId);
        console.log("📊 Full API Response:", response);
        
        const consultationData = Array.isArray(response.data) 
          ? response.data[0] 
          : response.data;
          
        console.log("📊 Consultation Data:", consultationData);
        console.log("👤 Patient Data:", consultationData?.patient);
        console.log("🔬 Tests:", {
          audiometry: consultationData?.audiometry,
          tympanometry: consultationData?.tympanometry,
          oae: consultationData?.oae,
          otoscopy: consultationData?.otoscopy
        });
        console.log("🎥 Recordings:", consultationData?.recordings);
        
        if (!consultationData) {
          throw new Error("No consultation data found");
        }
        
        setConsultation(consultationData);
      } catch (err) {
        console.error("Failed to fetch consultation:", err);
        setError(err instanceof Error ? err.message : "Failed to load consultation");
      } finally {
        setLoading(false);
      }
    };

    if (consultationId) {
      fetchConsultation();
    }
  }, [consultationId]);

  // Listen for real-time consultation updates via WebSocket
  useEffect(() => {
    if (!socket || !consultationId) return;

    const handleConsultationUpdate = (data: ConsultationModelData) => {
      if (data.id === consultationId) {
        console.log("📢 Consultation updated in detail view:", data);
        setConsultation(data);
      }
    };

    // Handle real-time broadcast when an audiologist joins any consultation
    const handleAudiologistJoinedConsultation = (data: { consultation: ConsultationModelData; audiologistId: string; timestamp: string }) => {
      const { consultation: updatedConsultation } = data;
      if (updatedConsultation.id === consultationId) {
        console.log("📢 Audiologist joined this consultation:", updatedConsultation);
        setConsultation(updatedConsultation);
        toast.info("Consultation has been assigned to an audiologist");
      }
    };

    socket.on("consultation_updated", handleConsultationUpdate);
    socket.on("audiologist_joined_consultation", handleAudiologistJoinedConsultation);

    return () => {
      socket.off("consultation_updated", handleConsultationUpdate);
      socket.off("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
    };
  }, [socket, consultationId]);

  if (loading) {
    return (
      <DashboardBodyWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading consultation details...</p>
          </div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  if (error || !consultation) {
    return (
      <DashboardBodyWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl text-red-600 mb-2">{error || "Consultation not found"}</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  const safeFormatDate = (date: any, formatStr: string = "dd MMM yyyy, hh:mm a") => {
    if (!date) return "Not available";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Invalid date";
      return format(d, formatStr);
    } catch {
      return "Invalid date";
    }
  };

  return (
    <DashboardBodyWrapper>
      <div className="p-6 max-w-7xl mx-auto">
        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Consultation Details</h1>
          <p className="text-gray-600 mt-2">
            View comprehensive information about this consultation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Details */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="bg-gradient-to-r from-primary-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-primary-700">
                  <User className="w-5 h-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
                    {consultation.patient?.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {consultation.patient?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {consultation.patient?.id?.substring(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-sm">
                        {consultation.patient?.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium text-sm">
                        {consultation.patient?.contactNumber || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {consultation.patient?.city && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-medium text-sm">
                          {consultation.patient.city.name}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium text-sm">
                        {safeFormatDate(consultation.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tests and Recordings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tests & Reports */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <FileText className="w-5 h-5" />
                  Tests & Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!consultation.audiometry && 
                 !consultation.tympanometry && 
                 !consultation.oae && 
                 !consultation.otoscopy ? (
                  <p className="text-center py-8 text-gray-500">No tests performed</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: "Audiometry", done: !!consultation.audiometry, report: consultation.audiometryReport, icon: "🎧" },
                      { name: "Tympanometry", done: !!consultation.tympanometry, report: consultation.tympanometryReport, icon: "📊" },
                      { name: "OAE", done: !!consultation.oae, report: consultation.oaeReport, icon: "🔊" },
                      { name: "Otoscopy", done: !!consultation.otoscopy, report: consultation.otoscopyReport, icon: "🔬" },
                    ].filter(test => test.done).map(test => (
                      <div key={test.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{test.icon}</span>
                          <span className="font-semibold">{test.name}</span>
                        </div>
                        {test.report ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={test.report} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        ) : (
                          <Badge variant="secondary">No Report</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Questionnaire Answers */}
            {consultation.questionnaire && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <ClipboardList className="w-5 h-5" />
                    Questionnaire Responses
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {(() => {
                    const questionnaire = consultation.questionnaire as any;
                    const answers = questionnaire?.answers || [];
                    
                    if (answers.length === 0) {
                      return <p className="text-center py-8 text-gray-500">No questionnaire responses</p>;
                    }
                    
                    return (
                      <div className="space-y-4">
                        {/* Submitted date */}
                        {questionnaire?.submittedAt && (
                          <div className="text-sm text-gray-500 mb-4 pb-3 border-b">
                            Submitted on {safeFormatDate(questionnaire.submittedAt)}
                          </div>
                        )}
                        
                        {answers.map((answer: any, idx: number) => {
                          // Get question text from the question object if available
                          const questionText = answer.question?.text || `Question ${idx + 1}`;
                          const questionType = answer.question?.type;
                          
                          // Get the answer value
                          let answerValue = "";
                          if (answer.value) {
                            answerValue = answer.value;
                          } else if (answer.selectedOptions && answer.selectedOptions.length > 0) {
                            answerValue = answer.selectedOptions
                              .map((opt: any) => opt.option?.value || opt.option?.label || opt.value)
                              .filter(Boolean)
                              .join(", ");
                          }
                          
                          const hasAnswer = answerValue && answerValue.trim() !== "";
                          
                          return (
                            <div 
                              key={answer.id || idx} 
                              className={`p-4 rounded-lg border ${
                                hasAnswer 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {hasAnswer ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800 mb-1">
                                    {idx + 1}. {questionText}
                                  </p>
                                  {questionType && (
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded mb-2 inline-block">
                                      {questionType.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  <p className={`text-sm ${hasAnswer ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                                    {hasAnswer ? answerValue : "Not answered"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Summary */}
                        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Total Questions: {answers.length}
                          </span>
                          <span className="text-green-600 font-medium">
                            Answered: {answers.filter((a: any) => 
                              a.value || (a.selectedOptions && a.selectedOptions.length > 0)
                            ).length}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Recordings */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Video className="w-5 h-5" />
                  Recordings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {(() => {
                  const allRecs = [];
                  if (Array.isArray(consultation.recordings)) {
                    allRecs.push(...consultation.recordings);
                  }
                  if ((consultation as any)?.recordingUrl) {
                    allRecs.push({
                      id: 'screen-rec',
                      recordingUrl: (consultation as any).recordingUrl,
                      createdAt: consultation.updatedAt,
                    });
                  }
                  const recordingName = (consultation as any)?.recordingName;
                  if (recordingName && process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL) {
                    const callbackUrl = `${process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL}?name=${encodeURIComponent(recordingName)}`;
                    allRecs.push({
                      id: 'screen-callback',
                      recordingUrl: normalizePlaybackUrl(callbackUrl) || callbackUrl,
                      createdAt: consultation.updatedAt,
                    });
                  }
                  const playable = allRecs.filter(r => !!r.recordingUrl);

                  if (playable.length === 0) {
                    return <p className="text-center py-8 text-gray-500">No recordings available</p>;
                  }

                  return (
                    <div className="space-y-3">
                      {playable.map((rec, idx) => {
                        const fileName = (rec as any).fileName || `Recording ${idx + 1}`;
                        const isScreen = fileName.includes('.webm') || fileName.includes('consultation-') || fileName.includes('session-');
                        const type = isScreen ? '🖥️ Screen' : '🎥 Video';
                        return (
                          <button
                            key={rec.id || idx}
                            onClick={() => {
                              setSelectedRecording({
                                url: normalizePlaybackUrl(rec.recordingUrl) || rec.recordingUrl,
                                title: `${type} Recording ${idx + 1}`
                              });
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                              isScreen 
                                ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                                : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <PlayCircle className="w-6 h-6" />
                              <div className="text-left">
                                <p className="font-semibold">{type} Recording {idx + 1}</p>
                                <p className="text-xs text-gray-600">
                                  {safeFormatDate(rec.createdAt)}
                                </p>
                              </div>
                            </div>
                            <PlayCircle className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] p-0 overflow-hidden bg-gray-900">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 bg-gray-800 border-b border-gray-700">
              <DialogTitle className="text-white font-semibold">
                {selectedRecording?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedRecording && (
              <div className="flex-1 flex items-center justify-center bg-black p-4">
                <VideoPlayer
                  url={selectedRecording.url}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardBodyWrapper>
  );
}

