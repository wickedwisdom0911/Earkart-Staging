"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isToday, isSameDay } from "date-fns";
import { SessionStatus } from "@/models/enums";
import { useRouter, useParams } from "next/navigation";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import {
  User,
  Building2,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  XCircle,
  FileText,
  Calendar as CalendarIcon,
  Eye,
  Download,
  ArrowLeft,
  Filter,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/Badge";
import { VideoPlayer } from "@/components/VideoPlayer";
import { normalizePlaybackUrl } from "@/lib/url-utils";

export default function AudiologistDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const audiologistId = params.audiologistId as string;
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const today = new Date();

  const { data: consultations } = useGetAllConsultations();
  const { data: audiologists } = useGetAllAudiologists();

  // Find the audiologist
  const audiologist = useMemo(() => {
    if (!audiologists?.data || !Array.isArray(audiologists.data)) return null;
    return audiologists.data.find(
      (a: any) => (a.userId || a.id) === audiologistId
    );
  }, [audiologists, audiologistId]);

  // Get all consultations for this audiologist
  // Only include consultations that have an audiologist assigned
  const allConsultations = useMemo(() => {
    if (!consultations?.data) return [];
    const consultationsArray = extractConsultations(consultations.data);
    return consultationsArray.filter(
      (c) => c.audiologist?.userId === audiologistId && c.audiologist?.userId
    );
  }, [consultations, audiologistId]);

  // Filter consultations by selected date
  const filteredConsultations = useMemo(() => {
    if (!allConsultations) return [];

    if (!selectedDate) {
      return allConsultations.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
    }

    return allConsultations
      .filter((c) => {
        if (!c?.createdAt) return false;
        try {
          const consultationDate = new Date(c.createdAt);
          return isSameDay(consultationDate, selectedDate);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
  }, [allConsultations, selectedDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allConsultations.length;
    const completed = allConsultations.filter(
      (c) => c.status === SessionStatus.COMPLETED
    ).length;
    const pending = allConsultations.filter(
      (c) => c.status === SessionStatus.PENDING
    ).length;
    const inProgress = allConsultations.filter(
      (c) => c.status === SessionStatus.IN_PROGRESS
    ).length;

    return { total, completed, pending, inProgress };
  }, [allConsultations]);

  const statusConfig = {
    [SessionStatus.COMPLETED]: {
      color: "bg-red-50 text-red-700 border-red-200",
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Missed",
      gradient: "from-red-500 to-rose-500",
    },
    [SessionStatus.PENDING]: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="w-4 h-4" />,
      label: "Pending",
      gradient: "from-amber-500 to-orange-500",
    },
    [SessionStatus.IN_PROGRESS]: {
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <PlayCircle className="w-4 h-4" />,
      label: "In Progress",
      gradient: "from-blue-500 to-indigo-500",
    },
    [SessionStatus.FAILED]: {
      color: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle className="w-4 h-4" />,
      label: "Failed",
      gradient: "from-red-500 to-rose-500",
    },
    [SessionStatus.CANCELLED]: {
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Cancelled",
      gradient: "from-gray-500 to-slate-500",
    },
  };

  const safeFormatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return format(d, "dd/MM/yy, hh:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const renderConsultationCard = (consultation: ConsultationModelData) => {
    const dateStr = safeFormatDate(consultation.createdAt);

    const status =
      (consultation.status &&
        statusConfig[consultation.status as SessionStatus]) ||
      statusConfig[SessionStatus.PENDING];

    // Get all recordings
    const allRecs: any[] = [];
    if (Array.isArray(consultation.recordings)) {
      allRecs.push(...consultation.recordings);
    }
    if ((consultation as any)?.recordingUrl) {
      allRecs.push({
        id: "screen-rec",
        recordingUrl: (consultation as any).recordingUrl,
        createdAt: consultation.updatedAt || consultation.createdAt,
      });
    }
    const recordingName = (consultation as any)?.recordingName;
    if (recordingName && process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL) {
      const callbackUrl = `${process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL}?name=${encodeURIComponent(recordingName)}`;
      allRecs.push({
        id: "screen-callback",
        recordingUrl: normalizePlaybackUrl(callbackUrl) || callbackUrl,
        createdAt: consultation.updatedAt || consultation.createdAt,
      });
    }
    const playableRecordings = allRecs.filter((r) => !!r.recordingUrl);

    // Get tests
    const tests = [
      {
        name: "Audiometry",
        done: !!consultation.audiometry,
        report: (consultation as any).audiometryReport,
        icon: "🎧",
        color: "bg-purple-50 border-purple-200",
      },
      {
        name: "Tympanometry",
        done: !!consultation.tympanometry,
        report: (consultation as any).tympanometryReport,
        icon: "📊",
        color: "bg-blue-50 border-blue-200",
      },
      {
        name: "OAE",
        done: !!consultation.oae,
        report: (consultation as any).oaeReport,
        icon: "🔊",
        color: "bg-orange-50 border-orange-200",
      },
      {
        name: "Otoscopy",
        done: !!consultation.otoscopy,
        report: (consultation as any).otoscopyReport,
        icon: "🔬",
        color: "bg-teal-50 border-teal-200",
      },
    ].filter((test) => test.done);

    return (
      <Card
        key={consultation.id}
        className="group relative overflow-hidden border border-gray-200 bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:border-primary-300"
      >
        {/* Gradient accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${status.gradient}`} />
        
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${status.color}`}
            >
              {status.icon}
              {status.label}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateStr}
            </div>
          </div>

          {/* Patient & Centre Info */}
          <div className="space-y-3 bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Patient</p>
                <p className="text-sm font-semibold text-gray-900">
                  {consultation.patient?.name || "Unknown Patient"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Centre</p>
                <p className="text-sm font-semibold text-gray-900">
                  {consultation.centre?.user?.name || "Unknown Centre"}
                </p>
              </div>
            </div>
          </div>

          {/* Tests & Reports */}
          {tests.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary-600" />
                <p className="text-xs font-semibold text-gray-700">
                  Tests Completed ({tests.length})
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {tests.map((test) => (
                  <div
                    key={test.name}
                    className={`flex flex-col gap-2 p-3 rounded-lg border ${test.color} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{test.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {test.name}
                      </span>
                    </div>
                    {test.report ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs w-full bg-white hover:bg-gray-50"
                      >
                        <a
                          href={test.report}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-xs justify-center">
                        No Report
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recordings */}
          {playableRecordings.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <PlayCircle className="w-4 h-4 text-primary-600" />
                <p className="text-xs font-semibold text-gray-700">
                  Recordings ({playableRecordings.length})
                </p>
              </div>
              <div className="space-y-2">
                {playableRecordings.slice(0, 2).map((rec: any, idx: number) => {
                  const fileName = rec.fileName || `Recording ${idx + 1}`;
                  const isScreen =
                    fileName.includes(".webm") ||
                    fileName.includes("consultation-") ||
                    fileName.includes("session-");
                  const type = isScreen ? "Screen" : "Video";
                  const iconBg = isScreen ? "from-blue-500 to-indigo-600" : "from-emerald-500 to-teal-600";
                  
                  return (
                    <button
                      key={rec.id || idx}
                      onClick={() => {
                        setSelectedRecording({
                          url:
                            normalizePlaybackUrl(rec.recordingUrl) ||
                            rec.recordingUrl,
                          title: `${type} Recording ${idx + 1} - ${
                            consultation.patient?.name || "Consultation"
                          }`,
                        });
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 bg-white transition-all hover:shadow-md hover:border-primary-300 hover:bg-gradient-to-r hover:from-white hover:to-primary-50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                          <PlayCircle className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">
                          {type} Recording {idx + 1}
                        </span>
                      </div>
                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </button>
                  );
                })}
                {playableRecordings.length > 2 && (
                  <p className="text-xs text-gray-500 text-center pt-1 font-medium">
                    +{playableRecordings.length - 2} more recording{playableRecordings.length - 2 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* View Full Details Button */}
          <Button
            onClick={() => {
              router.push(`/dashboard/consultation-details/${consultation.id}`);
            }}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm py-3 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Full Details
          </Button>
        </div>
      </Card>
    );
  };

  if (!audiologist) {
    return (
      <DashboardBodyWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Audiologist not found
            </h2>
            <p className="text-gray-600 mb-4">
              The requested audiologist could not be found.
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  return (
    <DashboardBodyWrapper>
      <div className="space-y-8">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start gap-6">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    {audiologist.user?.name || "Audiologist"}
                  </h1>
                  <p className="text-primary-100 text-sm">
                    Consultation History & Details
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics cards were removed per request – focus on monitoring + list only */}
        </div>

        {/* Date Filter Card */}
        <Card className="border-2 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Filter Consultations</p>
                  <p className="text-xs text-gray-500">Select a date or view all</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                {/* Simple native date input for filter */}
                <input
                  type="date"
                  value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedDate(v ? new Date(v) : null);
                  }}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(today)}
                  className="h-10 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Today
                </Button>
                {selectedDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                    className="h-10 shadow-sm hover:shadow-md transition-shadow bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-primary-600 to-primary-400 rounded-full" />
            <div>
              <p className="text-lg font-bold text-gray-900">
                {filteredConsultations.length} Consultation{filteredConsultations.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-600">
                {selectedDate ? `on ${format(selectedDate, "dd/MM/yy")}` : "All time"}
              </p>
            </div>
          </div>
        </div>

        {/* Consultations Grid */}
        {filteredConsultations.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Consultations Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {selectedDate
                ? `No consultations were recorded on ${format(selectedDate, "dd/MM/yy")}. Try selecting a different date.`
                : "This audiologist hasn't completed any consultations yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredConsultations.map((consultation) =>
              renderConsultationCard(consultation)
            )}
          </div>
        )}
      </div>

      {/* Video Player Dialog */}
      <Dialog
        open={!!selectedRecording}
        onOpenChange={() => setSelectedRecording(null)}
      >
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0 overflow-hidden bg-gray-950 border-2 border-gray-800">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-5 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
              <DialogTitle className="text-white font-bold text-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                {selectedRecording?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedRecording && (
              <div className="flex-1 flex items-center justify-center bg-black p-6">
                <VideoPlayer url={selectedRecording.url} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardBodyWrapper>
  );
}
