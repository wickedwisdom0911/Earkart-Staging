"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Video,
  Download,
  PlayCircle,
  ClipboardList,
  CheckCircle2,
  Circle,
  Stethoscope,
  CreditCard,
  ExternalLink,
  ArrowLeft,
  MapPin,
  ChevronRight,
  Link2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { ConsultationModelData } from "@/models/consultation.model";
import { normalizePlaybackUrl } from "@/lib/url-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/VideoPlayer";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useSocket } from "@/providers/socket-provider";
import { toast } from "sonner";
import { VideoAnalysisSection } from "@/components/consultation/VideoAnalysisSection";
import { useGetConsultation, getConsultationFromResponse } from "@/hooks/consultation/use-get-consultation";
import { useQueryClient } from "@tanstack/react-query";

export default function ConsultationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params.consultationId as string;
  const socket = useSocket();
  const queryClient = useQueryClient();

  const {
    data: response,
    isLoading: loading,
    isError,
    error,
  } = useGetConsultation(consultationId);
  const consultation = response ? getConsultationFromResponse(response) : null;

  const reconnectedByConsultationId = (consultation as { reconnectedByConsultationId?: string | null })?.reconnectedByConsultationId;
  const reconnectedId = typeof reconnectedByConsultationId === "string" && reconnectedByConsultationId.trim() ? reconnectedByConsultationId : "";
  const { data: reconnectedResponse } = useGetConsultation(reconnectedId);
  const originalConsultation = reconnectedResponse ? getConsultationFromResponse(reconnectedResponse) : null;

  const [selectedRecording, setSelectedRecording] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [localRecordings, setLocalRecordings] = useState<{ id: string; url: string; name?: string }[]>([]);

  // Load recordings from localStorage (saved during live consultation, incl. after refresh/recovery)
  useEffect(() => {
    if (!consultationId || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`recordings_${consultationId}`);
      const list = raw ? JSON.parse(raw) : [];
      const valid = (list as any[]).filter(
        (r) => r?.url && typeof r.url === "string" &&
          !["Processing...", "Recording...", "Accumulating..."].includes(r.url) &&
          r.url.startsWith("http") // Exclude blob: URLs – they're invalid after page navigation
      );
      setLocalRecordings(valid);
    } catch {
      setLocalRecordings([]);
    }
  }, [consultationId]);

  useEffect(() => {
    if (!socket || !consultationId) return;
    const handleConsultationUpdate = (data: ConsultationModelData) => {
      if (data.id === consultationId) {
        queryClient.setQueryData(
          ["consultation", consultationId],
          (prev: typeof response) =>
            prev ? { ...prev, data: data } : prev
        );
      }
    };
    const handleAudiologistJoinedConsultation = (data: {
      consultation: ConsultationModelData;
      audiologistId: string;
      timestamp: string;
    }) => {
      const { consultation: updatedConsultation } = data;
      if (updatedConsultation.id === consultationId) {
        queryClient.setQueryData(
          ["consultation", consultationId],
          (prev: typeof response) =>
            prev ? { ...prev, data: updatedConsultation } : prev
        );
        toast.info("Consultation has been assigned to an audiologist");
      }
    };
    socket.on("consultation_updated", handleConsultationUpdate);
    socket.on("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
    return () => {
      socket.off("consultation_updated", handleConsultationUpdate);
      socket.off("audiologist_joined_consultation", handleAudiologistJoinedConsultation);
    };
  }, [socket, consultationId, queryClient]);

  if (loading) {
    return (
      <DashboardBodyWrapper>
        <div className="min-h-screen bg-[#EEF4F9] flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#40A3DB] mx-auto" />
            <p className="mt-4 text-gray-600">Loading consultation details...</p>
          </div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  const errorMessage =
    error instanceof Error ? error.message : "Failed to load consultation";
  if (isError || !consultation) {
    return (
      <DashboardBodyWrapper>
        <div className="min-h-screen bg-[#EEF4F9] flex items-center justify-center w-full">
          <div className="text-center">
            <p className="text-xl text-red-600 mb-2">
              {errorMessage || "Consultation not found"}
            </p>
            <Button
              onClick={() => router.push("/dashboard/all-consultations")}
              className="mt-4"
            >
              Back to All Consultations
            </Button>
          </div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  const safeFormatDate = (
    date: any,
    formatStr: string = "dd MMM yyyy, hh:mm a"
  ) => {
    if (!date) return "Not available";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "Invalid date";
      return format(d, formatStr);
    } catch {
      return "Invalid date";
    }
  };

  // ─── helpers ──────────────────────────────────────────────────────────────
  const tests = [
    {
      name: "Audiometry",
      done: !!consultation.audiometry,
      report: consultation.audiometryReport,
      icon: "🎧",
    },
    {
      name: "Tympanometry",
      done: !!consultation.tympanometry,
      report: consultation.tympanometryReport,
      icon: "📊",
    },
    {
      name: "OAE",
      done: !!consultation.oae,
      report: consultation.oaeReport,
      icon: "🔊",
    },
    {
      name: "Otoscopy",
      done: !!consultation.otoscopy,
      report: consultation.otoscopyReport,
      icon: "🔬",
    },
  ].filter((t) => t.done);

  const allRecs: any[] = [];
  if (Array.isArray(consultation.recordings))
    allRecs.push(...consultation.recordings);
  if ((consultation as any)?.recordingUrl) {
    allRecs.push({
      id: "screen-rec",
      recordingUrl: (consultation as any).recordingUrl,
      createdAt: consultation.updatedAt,
    });
  }
  const recordingName = (consultation as any)?.recordingName;
  if (recordingName && process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL) {
    const callbackUrl = `${process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL}?name=${encodeURIComponent(recordingName)}`;
    allRecs.push({
      id: "screen-callback",
      recordingUrl: normalizePlaybackUrl(callbackUrl) || callbackUrl,
      createdAt: consultation.updatedAt,
    });
  }
  // Include recordings saved in localStorage during live consultation (incl. after refresh/recovery)
  localRecordings.forEach((r) => {
    allRecs.push({
      id: r.id || `local-${r.url?.slice(0, 20)}`,
      recordingUrl: r.url,
      fileName: r.name,
      createdAt: consultation.updatedAt,
    });
  });
  const playable = allRecs.filter((r) => !!r.recordingUrl);

  const questionnaire = consultation.questionnaire as any;
  const answers = questionnaire?.answers || [];

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <DashboardBodyWrapper className="!bg-[#EEF4F9] !gap-0 !p-0 !border-0 !rounded-none">
      <div className="w-full h-full p-4 sm:p-6 bg-[#EEF4F9]">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <button onClick={() => router.push("/dashboard")} className="hover:text-gray-700 transition-colors">Dashboard</button>
          <ChevronRight className="w-4 h-4" />
          <button onClick={() => router.push("/dashboard/all-consultations")} className="hover:text-gray-700 transition-colors">Consultations</button>
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.push(`/dashboard/all-consultations?scrollTo=${consultationId}`)}
            className="flex items-center gap-1.5 text-sm text-[#40A3DB] hover:text-[#3592c7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <Button
            onClick={() => router.push(`/consultation/${consultationId}`)}
            className="bg-[#40A3DB] hover:bg-[#3592c7] text-white rounded-xl"
          >
            <User className="w-4 h-4 mr-2" />
            Open Consultation
          </Button>
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Consultation Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">View comprehensive information about this consultation</p>
        </div>

        {/* ── Main two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-5">

            {/* Patient Information */}
            <div className="bg-white rounded-2xl border border-[#E1E6EA] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#EBF6FD] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#40A3DB]" />
                </div>
                <h2 className="font-semibold text-gray-900">Patient Information</h2>
              </div>

              {/* Avatar + name row */}
              <div className="flex items-center gap-3 mb-5 p-3 bg-[#EEF4F9] rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#40A3DB] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {consultation.patient?.name?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {consultation.patient?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400">
                    ID: {consultation.patient?.id?.substring(0, 8)}
                  </p>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-3">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email">
                  {consultation.patient?.email || "Not provided"}
                </InfoRow>
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Contact">
                  {consultation.patient?.contactNumber || "Not provided"}
                </InfoRow>
                {consultation.patient?.city && (
                  <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location">
                    {consultation.patient.city.name}
                  </InfoRow>
                )}
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date">
                  {safeFormatDate(consultation.createdAt)}
                </InfoRow>

                {(consultation as any).reconnectedByConsultationId && (
                  <InfoRow icon={<Link2 className="w-4 h-4" />} label="This call was reconnected to">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/consultation-details/${(consultation as any).reconnectedByConsultationId}`
                        )
                      }
                      className="text-left text-[#40A3DB] hover:underline font-medium"
                    >
                      {originalConsultation
                        ? `${originalConsultation.patient?.name || "Unknown"} at ${originalConsultation.centre?.user?.name || "Unknown Centre"}`
                        : reconnectedId
                          ? "Loading..."
                          : (consultation as any).reconnectedByConsultationId}
                    </button>
                  </InfoRow>
                )}

                {(consultation as any).consultationPricing?.length > 0 && (
                  <InfoRow icon={<Stethoscope className="w-4 h-4" />} label="Tests Selected">
                    {(consultation as any).consultationPricing
                      .map((cp: any) => cp?.pricing?.name || cp?.pricing?.description || "—")
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </InfoRow>
                )}

                {(() => {
                  const payments = (consultation as any).Payment ?? (consultation as any).payment;
                  const payment = Array.isArray(payments) ? payments[0] : null;
                  if (!payment) return null;
                  return (
                    <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Payment">
                      ₹{payment.amount ?? "—"}
                      {payment.paymentType && (
                        <span className="text-gray-400 ml-1">
                          ({payment.paymentType.replace(/_/g, " ")})
                        </span>
                      )}
                    </InfoRow>
                  );
                })()}
              </div>
            </div>

            {/* Tests & Reports */}
            <div className="bg-white rounded-2xl border border-[#E1E6EA] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-500" />
                </div>
                <h2 className="font-semibold text-gray-900">Tests & Reports</h2>
              </div>

              {tests.length === 0 ? (
                <div className="text-center py-8 bg-[#EEF4F9] rounded-xl">
                  <p className="text-sm text-gray-400">No tests performed</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tests.map((test) => (
                    <div
                      key={test.name}
                      className="flex items-center justify-between px-4 py-3 bg-[#EBF6FD] rounded-xl border border-[#D0EAF8]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{test.icon}</span>
                        <span className="text-sm font-medium text-gray-800">{test.name}</span>
                      </div>
                      {test.report ? (
                        <a
                          href={test.report}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 transition-colors bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">No Report</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recordings */}
            <div className="bg-white rounded-2xl border border-[#E1E6EA] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
                  <Video className="w-4 h-4 text-violet-500" />
                </div>
                <h2 className="font-semibold text-gray-900">Recordings</h2>
              </div>

              {playable.length === 0 ? (
                <div className="text-center py-8 bg-[#EEF4F9] rounded-xl">
                  <p className="text-sm text-gray-400">No recordings available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {playable.map((rec, idx) => {
                    const fileName = (rec as any).fileName || `Recording ${idx + 1}`;
                    const isScreen =
                      fileName.includes(".webm") ||
                      fileName.includes("consultation-") ||
                      fileName.includes("session-");
                    const type = isScreen ? "Screen" : "Video";
                    const recordingUrl = normalizePlaybackUrl(rec.recordingUrl) || rec.recordingUrl;

                    return (
                      <div
                        key={rec.id || idx}
                        className="flex items-center justify-between px-4 py-3 bg-[#EEF4F9] rounded-xl border border-[#E1E6EA]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                            <PlayCircle className="w-4 h-4 text-violet-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-800">{type} Recordings</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRecording({ url: recordingUrl, title: `${type} Recording ${idx + 1}` })}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-violet-300 text-violet-600 text-xs font-medium hover:bg-violet-50 transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            Play
                          </button>
                          <a
                            href={recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Video Call Analysis */}
            <VideoAnalysisSection consultationId={consultationId} />
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-5">

            {/* Questionnaire Responses */}
            <div className="bg-white rounded-2xl border border-[#E1E6EA] p-6 shadow-sm flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EBF6FD] flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-[#40A3DB]" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-base leading-tight">
                    Questionnaire Responses
                  </h2>
                  {questionnaire?.submittedAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted on {safeFormatDate(questionnaire.submittedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Body */}
              {!consultation.questionnaire || answers.length === 0 ? (
                <div className="text-center py-10 bg-[#EEF4F9] rounded-xl">
                  <p className="text-sm text-gray-400">No questionnaire responses</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {answers.map((answer: any, idx: number) => {
                    const questionText = answer.question?.text || `Question ${idx + 1}`;
                    const questionType = answer.question?.type;
                    const answerValue =
                      answer.value ||
                      (answer.selectedOptions || [])
                        .map((opt: any) => opt.option?.value || opt.option?.label || opt.value)
                        .filter(Boolean)
                        .join(", ") ||
                      "";
                    const hasAnswer = answerValue.trim() !== "";

                    const typeLabel = questionType
                      ? questionType === "multiple_choice"
                        ? "Multiple Choice"
                        : questionType === "short_text"
                        ? "Short Test"
                        : questionType.replace(/_/g, " ")
                      : null;

                    const isShortTest = typeLabel === "Short Test";

                    return (
                      <div
                        key={answer.id || idx}
                        className="p-4 rounded-xl border border-[#E1E6EA] bg-[#EEF4F9]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-gray-700 flex-1 leading-snug">
                            <span className="font-bold text-gray-900 mr-1.5">{idx + 1}</span>
                            {questionText}
                          </p>
                          {typeLabel && (
                            <span
                              className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                                isShortTest
                                  ? "border-orange-300 text-orange-500 bg-orange-50"
                                  : "border-[#D0EAF8] text-[#40A3DB] bg-[#EBF6FD]"
                              }`}
                            >
                              {typeLabel}
                            </span>
                          )}
                        </div>
                        <p className={`mt-2 text-sm ${hasAnswer ? "text-gray-700" : "text-gray-400"}`}>
                          {hasAnswer ? answerValue : "None"}
                        </p>
                      </div>
                    );
                  })}

                  {/* Summary footer */}
                  <div className="pt-3 border-t border-[#E1E6EA] flex items-center justify-between text-xs text-gray-500">
                    <span>Total Questions: {answers.length}</span>
                    <span className="text-green-600 font-medium">
                      Answered:{" "}
                      {answers.filter((a: any) => a.value || (a.selectedOptions && a.selectedOptions.length > 0)).length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Video Player Dialog ── */}
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
                <VideoPlayer url={selectedRecording.url} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardBodyWrapper>
  );
}

// ─── Small helper component ────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#EEF4F9] transition-colors">
      <span className="mt-0.5 text-[#40A3DB]">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800">{children}</p>
      </div>
    </div>
  );
}