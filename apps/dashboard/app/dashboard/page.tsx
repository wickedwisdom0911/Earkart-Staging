"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useEffect, useState } from "react";
import { ConsultationModelData } from "@/models/consultation.model";
import { useSocket } from "@/providers/socket-provider";
import { format } from "date-fns";
import {
  AudiologistConsultationStatus,
  SessionStatus,
  Role,
} from "@/models/enums";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { normalizePlaybackUrl } from "@/lib/url-utils";
import {
  User,
  Building2,
  Video,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  XCircle,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useUpdateConsultation } from "@/hooks/consultation/use-update-consultation";
import getConsultation from "@/actions/consultations/get_consultation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/VideoPlayer";

// Removed RecordingLink component – we will use consultation.recordings provided by API

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useGetUser();
  const [allConsulations, setAllConsulations] = useState<
    ConsultationModelData[]
  >([]);
  const [blinkingIds, setBlinkingIds] = useState<string[]>([]);
  const { data: consultations, isLoading, isError } = useGetAllConsultations();
  const socket = useSocket();


  // NEW: Track socket connection status
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  // NEW: Track loading state for join consultation buttons
  const [joiningConsultationId, setJoiningConsultationId] = useState<
    string | null
  >(null);
  // NEW: Track selected recording for video player
  const [selectedRecording, setSelectedRecording] = useState<{
    url: string;
    title: string;
    playlist?: Array<{ url: string; title: string }>;
    currentIndex?: number;
  } | null>(null);
  // NEW: Track which consultation's recordings are expanded
  const [expandedRecordings, setExpandedRecordings] = useState<Set<string>>(new Set());

  // Add update consultation mutation
  const { mutate: updateConsultationMutation } = useUpdateConsultation();

  // Check if user is an audiologist
  const isAudiologist = user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

  useEffect(() => {
    if (Array.isArray(consultations?.data)) {
      // 🐛 DEBUG: Console log consultations data structure
      console.log("[CONSULTATIONS] Raw consultations data:", consultations.data.map(c => ({
        id: c.id.substring(0, 8),
        status: c.status,
        recordings: c.recordings?.map(r => ({
          id: r.id,
          fileName: (r as any).fileName,
          mimeType: (r as any).mimeType,
          recordingUrl: r.recordingUrl,
          createdAt: r.createdAt,
          // 🐛 Show ALL fields to see what's available
          allFields: Object.keys(r)
        })),
        recordingName: (c as any).recordingName,
        recordingUrl: (c as any).recordingUrl
      })));
      
      setAllConsulations(consultations?.data);
      
      // Recording details are now included in the consultation response
      
      // NEW: Check and notify for consultations that need attention when they're displayed
      if (user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST) {
        // Clear notification cache to allow re-checking of consultations
        const clearCacheEvent = new CustomEvent('clearNotificationCache');
        window.dispatchEvent(clearCacheEvent);
        
        // Small delay to ensure cache is cleared before checking consultations
        setTimeout(() => {
          if (Array.isArray(consultations.data)) {
            consultations.data.forEach((consultation: ConsultationModelData) => {
              // Check if consultation needs attention (no audiologist assigned) AND not in progress/completed/cancelled
              const needsAttention = 
                (!consultation.audiologist) &&
                consultation.status !== SessionStatus.IN_PROGRESS && // NOT in progress (being handled)
                consultation.status !== SessionStatus.COMPLETED && // NOT completed  
                consultation.status !== SessionStatus.CANCELLED; // NOT cancelled
              
              if (needsAttention) {
                // Create a notification for this consultation
                const event = new CustomEvent('consultationNeedsAttention', {
                  detail: consultation
                });
                window.dispatchEvent(event);
              }
            });
          }
        }, 100);
      }
    }
  }, [consultations, user?.role]);

  useEffect(() => {
    if (!socket) return;

    // Handler functions
    // socket.onAny((event, ...args) => {
    //   console.log(`[SOCKET EVENT]: ${event}`, ...args);
    // });
    const onNewConsultation = (data: ConsultationModelData) => {
      setAllConsulations((prev) => {
        // Only add if not already present
        if (prev.some((c) => c.id === data.id)) return prev;
        return [data, ...prev];
      });

      // If audiologist and consultation needs attention, toast + blink
      const isAudiologistUser = user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;
      if (isAudiologistUser) {
        const needsAttention = (!data.audiologist)
          && data.status !== SessionStatus.IN_PROGRESS
          && data.status !== SessionStatus.COMPLETED
          && data.status !== SessionStatus.CANCELLED;
        if (needsAttention) {
          const patientName = data.patient?.name || "New patient";
          toast.info(`New consultation: ${patientName}`);
          setBlinkingIds((prev) => prev.includes(data.id) ? prev : [...prev, data.id]);
          // Remove blink after 6 seconds
          setTimeout(() => {
            setBlinkingIds((prev) => prev.filter((id) => id !== data.id));
          }, 6000);
        }
      }
    };

    const onConsultationUpdate = (data: ConsultationModelData) => {
      console.log("Consultation updated:", data);
      setAllConsulations((prev) => {
        return prev.map((consultation) => 
          consultation.id === data.id ? data : consultation
        );
      });
    };

    // NEW: Listen for connect/disconnect
    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    // Handle join consultation responses
    const handleJoined = async (data: string) => {
      console.log("Joined consultation:", data);
      if (joiningConsultationId && data === joiningConsultationId) {
        try {
          // Fetch current consultation data
          const consultationResponse = await getConsultation(data);
          if (consultationResponse.success && consultationResponse.data) {
            const currentConsultation = consultationResponse.data as ConsultationModelData;
            
            // Update consultation status to IN_PROGRESS if it's currently PENDING
            if (currentConsultation.status === SessionStatus.PENDING) {
              const updatedConsultation = {
                ...currentConsultation,
                status: SessionStatus.IN_PROGRESS,
                updatedAt: new Date().toISOString(),
              };
              
              console.log("Updating consultation status to IN_PROGRESS for:", data);
              
              // Update consultation status
              updateConsultationMutation(updatedConsultation, {
                onSuccess: (response) => {
                  if (response.success) {
                    console.log("Successfully updated consultation status to IN_PROGRESS");
                    toast.success("Consultation started successfully");
                    
                    // Stop notification sound when audiologist joins consultation
                    const stopSoundEvent = new CustomEvent('stopContinuousSound');
                    window.dispatchEvent(stopSoundEvent);
                  }
                },
                onError: (error) => {
                  console.error("Failed to update consultation status:", error);
                  toast.error("Failed to update consultation status");
                },
              });
            } else {
              // Even if status wasn't PENDING, stop notification sound when joining
              const stopSoundEvent = new CustomEvent('stopContinuousSound');
              window.dispatchEvent(stopSoundEvent);
            }
          }
        } catch (error) {
          console.error("Error updating consultation status:", error);
          toast.error("Failed to update consultation status");
        }
        
        setJoiningConsultationId(null);
        router.push(ROUTES?.CONSULTATION(data));
      }
    };

    const handleJoinError = (error: unknown) => {
      console.error("Failed to join consultation:", error);
      setJoiningConsultationId(null);
    };

    socket.on("new_consultation", onNewConsultation);
    socket.on("consultation_updated", onConsultationUpdate);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("joined", handleJoined);
    socket.on("join_error", handleJoinError);

    // Set initial status
    setIsSocketConnected(socket.connected);

    // Cleanup: remove listeners
    return () => {
      socket.off("new_consultation", onNewConsultation);
      socket.off("consultation_updated", onConsultationUpdate);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("joined", handleJoined);
      socket.off("join_error", handleJoinError);
    };
  }, [socket, joiningConsultationId, router, user?.role]);

  const joinRoom = (consultationId: string) => {
    console.log(consultationId);

    // Set loading state
    setJoiningConsultationId(consultationId);

    // Emit join request
    socket?.emit("join_consultation", { consultationId });
  };

  const toggleRecordings = (consultationId: string) => {
    setExpandedRecordings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(consultationId)) {
        newSet.delete(consultationId);
      } else {
        newSet.add(consultationId);
      }
      return newSet;
    });
  };

  const renderConsultationCard = (consultation: ConsultationModelData) => {
    const dateStr = consultation.createdAt
      ? format(new Date(consultation.createdAt), "dd MMM yyyy, hh:mm a")
      : "N/A";

    // Status colors and icons
    const statusConfig = {
      [SessionStatus.COMPLETED]: {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle2 className="w-5 h-5" />,
        label: "Completed",
      },
      [SessionStatus.PENDING]: {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: <Clock className="w-5 h-5" />,
        label: "Pending",
      },
      [SessionStatus.IN_PROGRESS]: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <PlayCircle className="w-5 h-5" />,
        label: "In Progress",
      },
      [SessionStatus.FAILED]: {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <AlertCircle className="w-5 h-5" />,
        label: "Failed",
      },
      [SessionStatus.CANCELLED]: {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: <XCircle className="w-5 h-5" />,
        label: "Cancelled",
      },
    };

    const status =
      statusConfig[consultation.status] || statusConfig[SessionStatus.PENDING];
    const isAudiologist =
      user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

    // Button styles vary by session status
    const statusButtonStyles = {
      [SessionStatus.PENDING]: "bg-yellow-500 hover:bg-yellow-600",
      [SessionStatus.IN_PROGRESS]: "bg-blue-600 hover:bg-blue-700",
      [SessionStatus.COMPLETED]: "bg-green-600 hover:bg-green-700",
      [SessionStatus.FAILED]: "bg-red-600 hover:bg-red-700",
      [SessionStatus.CANCELLED]: "bg-gray-500 hover:bg-gray-600",
    } as const;
    const commonButtonStyles =
      "w-full text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
    const buttonClassName = `${statusButtonStyles[consultation.status as keyof typeof statusButtonStyles] || "bg-primary-600 hover:bg-primary-700"} ${commonButtonStyles}`;

    return (
      <div
        key={consultation.id}
        className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700"
      >
        {/* Header with status */}
        <div className={`px-4 py-3 border-b ${status.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.icon}
              <span className="font-medium">{status.label}</span>
            </div>
            <span className="text-sm opacity-75">{dateStr}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Patient Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-primary-600 dark:text-primary-400">
                <User className="w-5 h-5" />
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {consultation.patient?.name || "Unknown Patient"}
              </span>
            </div>
          </div>

          {/* Centre Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-primary-600 dark:text-primary-400">
                <Building2 className="w-5 h-5" />
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {consultation.centre?.user?.name || "Centre Name"}
              </span>
            </div>
          </div>

          {/* Audiologist Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-primary-600 dark:text-primary-400">
                <User className="w-5 h-5" />
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {consultation.audiologist?.user?.name ||
                  "No Audiologist Assigned"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isAudiologist && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            {!consultation.audiologist &&
              consultation.audiologistStatus ===
                AudiologistConsultationStatus.PENDING &&
              consultation.status === SessionStatus.PENDING && (
                <button
                  onClick={() => joinRoom(consultation.id)}
                  disabled={joiningConsultationId === consultation.id}
                  className={buttonClassName}
                >
                  {joiningConsultationId === consultation.id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Join Consultation
                    </>
                  )}
                </button>
              )}
            {consultation.audiologist &&
              consultation.audiologist.userId === user?.id &&
              (consultation.status === SessionStatus.IN_PROGRESS ||
                consultation.status === SessionStatus.PENDING) && (
                <button
                  onClick={() => joinRoom(consultation.id)}
                  disabled={joiningConsultationId === consultation.id}
                  className={buttonClassName}
                >
                  {joiningConsultationId === consultation.id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Rejoining...
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5" />
                      Rejoin Consultation
                    </>
                  )}
                </button>
              )}
                        {consultation.status === SessionStatus.COMPLETED && (() => {
              // Collect all recordings: regular recordings + screen recordings
              const regularRecordings = Array.isArray(consultation.recordings) 
                ? consultation.recordings // Show all recordings, even if recordingUrl is null
                : [];
              
              // Check for screen recording URLs from different sources
              const screenRecordings = [];
              
              // From consultation.recordingName field (external callback)
              const recordingName = (consultation as any)?.recordingName ?? (consultation as any)?.recordingsName ?? (consultation as any)?.recording?.name;
              if (recordingName && process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL) {
                const callbackUrl = `${process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL}?name=${encodeURIComponent(recordingName)}`;
                screenRecordings.push({
                  id: `screen-${consultation.id}`,
                  recordingUrl: normalizePlaybackUrl(callbackUrl) || callbackUrl,
                  createdAt: consultation.updatedAt,
                  type: 'screen'
                });
              }
              
              // From consultation.recordingUrl field (direct)
              if ((consultation as any)?.recordingUrl) {
                screenRecordings.push({
                  id: `screen-direct-${consultation.id}`,
                  recordingUrl: normalizePlaybackUrl((consultation as any).recordingUrl) || (consultation as any).recordingUrl,
                  createdAt: consultation.updatedAt,
                  type: 'screen'
                });
              }
              
              const allRecordings = [...regularRecordings, ...screenRecordings];
              
              // 🐛 DEBUG: Console log recordings data
         
              
              const isExpanded = expandedRecordings.has(consultation.id);
              
              // Create playlist data for "Play All" feature
              const playlist = allRecordings
                .filter(rec => !!rec.recordingUrl)
                .map((recording, index) => {
                  const timestamp = recording.createdAt 
                    ? format(new Date(recording.createdAt), 'MMM dd, HH:mm')
                    : `Part ${index + 1}`;
                  const fileName = (recording as any).fileName || (recording as any).name || '';
                  const mimeType = (recording as any).mimeType || '';
                  const isScreenRecording = fileName.includes('.webm') || 
                                          mimeType?.includes('video/webm') || 
                                          fileName.includes('consultation-') ||
                                          fileName.includes('session-');
                  const recordingType = isScreenRecording ? '🖥️ Screen' : '🎥 Video';
                  
                  return {
                    url: normalizePlaybackUrl(recording.recordingUrl) || recording.recordingUrl,
                    title: `${recordingType} Recording ${index + 1} - ${timestamp}`
                  };
                });
              
              return allRecordings.length > 0 && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleRecordings(consultation.id)}
                      className="flex-1 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 rounded-lg transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-indigo-800">
                          🎥 Recordings
                        </div>
                        <div className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
                          {allRecordings.length}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-600">
                        <span className="text-xs font-medium">
                          {isExpanded ? 'Hide' : 'Show'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        ) : (
                          <ChevronDown className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                    </button>
                    {playlist.length > 1 && (
                      <button
                        onClick={() => {
                          console.log('🎬 Playing all recordings as playlist:', playlist);
                          setSelectedRecording({
                            url: playlist[0].url,
                            title: `All Recordings (1/${playlist.length})`,
                            playlist: playlist,
                            currentIndex: 0
                          });
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                        title="Play all recordings in sequence"
                      >
                        <PlayCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Play All</span>
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-top-2 duration-200">
                    {allRecordings.map((recording, index) => {
                      const timestamp = recording.createdAt 
                        ? format(new Date(recording.createdAt), 'MMM dd, HH:mm')
                        : `Part ${index + 1}`;
                      
                      // Get recording info directly from the recording object
                      const fileName = (recording as any).fileName || (recording as any).name || '';
                      const mimeType = (recording as any).mimeType || '';
                      const status = (recording as any).status || 'unknown';
                      
                      // Detect screen recording by filename pattern or mimeType
                      const isScreenRecording = fileName.includes('.webm') || 
                                              mimeType?.includes('video/webm') || 
                                              fileName.includes('consultation-') ||
                                              fileName.includes('session-');
                      const recordingType = isScreenRecording ? '🖥️ Screen' : '🎥 Video';
                      const hasUrl = !!recording.recordingUrl;
                      
                      // If no URL, show as disabled item instead of link
                      if (!hasUrl) {
                        return (
                          <div
                            key={recording.id || `recording-${index}`}
                            className="flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm bg-gray-50 border-gray-200 text-gray-500"
                          >
                            <span className="flex items-center gap-2">
                              <PlayCircle className="h-5 w-5 opacity-50" />
                              <div className="flex flex-col">
                                <span className="font-medium">{recordingType} Recording {index + 1}</span>
                                <span className="text-xs opacity-75">{timestamp}</span>
                              </div>
                            </span>
                            <span className="text-xs font-medium">Processing...</span>
                          </div>
                        );
                      }
                      
                      return (
                        <button
                          key={recording.id || `recording-${index}`}
                          onClick={() => {
                            const rawUrl = recording.recordingUrl;
                            const normalizedUrl = normalizePlaybackUrl(rawUrl);
                            console.log('🎬 Opening recording:', {
                              rawUrl,
                              normalizedUrl,
                              fileName,
                              mimeType,
                              recording
                            });
                            setSelectedRecording({
                              url: normalizedUrl || rawUrl,
                              title: `${recordingType} Recording ${index + 1} - ${timestamp}`
                            });
                          }}
                          className={`flex items-center justify-between px-3 py-2.5 border-2 rounded-lg transition-all duration-200 text-sm w-full group hover:scale-[1.02] ${
                            isScreenRecording 
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-300 text-blue-800 shadow-sm hover:shadow-md'
                              : 'bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-emerald-300 text-emerald-800 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">{recordingType} Recording {index + 1}</span>
                              <span className="text-xs opacity-75">{timestamp}</span>
                            </div>
                          </span>
                          <PlayCircle className="h-4 w-4 group-hover:scale-125 transition-transform" />
                        </button>
                      );
                    })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardBodyWrapper>
      {/* Recording test UI removed */}
      <style>{`
        @keyframes blink-card-border { 0%{ box-shadow: 0 0 0 0 rgba(59,130,246,.6);} 50%{ box-shadow: 0 0 0 4px rgba(59,130,246,.25);} 100%{ box-shadow: 0 0 0 0 rgba(59,130,246,.0);} }
        .blink-card { animation: blink-card-border 1s ease-in-out 0s 6; }
        
        /* Stronger, continuous blink for PENDING consultations */
        @keyframes blink-pending-border { 0%{ box-shadow: 0 0 0 0 rgba(202,138,4,.75);} 50%{ box-shadow: 0 0 0 8px rgba(202,138,4,.35);} 100%{ box-shadow: 0 0 0 0 rgba(202,138,4,0);} }
        .pending-blink { animation: blink-pending-border 1.2s ease-in-out 0s infinite; border-radius: 0.75rem; }
      `}</style>
      <div className="w-full mb-8 ">
        <div className="rounded-2xl bg-gradient-to-r from-primary-100 to-blue-100 dark:from-primary-900 dark:to-blue-900 p-6 flex items-center justify-between gap-4 shadow-md border border-primary-200 dark:border-primary-800">
          <div className="flex  gap-4">
            <span className="text-3xl">💬🩺🏥</span>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-semibold text-primary-800 dark:text-primary-100">
                You will see all the{" "}
                <span className="text-primary-600 dark:text-primary-300 font-bold">
                  Active Consultation Rooms
                </span>{" "}
                and requests here
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Stay tuned for your next patient! 🚀
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl">{isSocketConnected ? "💡" : "⚪"}</span>
            <span
              className={`text-xs ${isSocketConnected ? "text-green-500" : "text-gray-400"}`}
            >
              {isSocketConnected
                ? "You are connected"
                : "You are not connected"}
            </span>
          </div>
        </div>
      </div>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {allConsulations?.map((consultation) => {
          const Card = renderConsultationCard(consultation);
          const shouldBlinkPending = (!consultation.audiologist) && consultation.status === SessionStatus.PENDING;
          return (
            <div key={consultation.id} className={`${blinkingIds.includes(consultation.id) ? 'blink-card' : ''} ${shouldBlinkPending ? 'pending-blink' : ''}`}>
              {Card}
            </div>
          );
        })}
      </div>

      {/* Video Player Dialog - Large Full Screen */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh] p-0">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 border-b bg-gray-900">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg text-white">{selectedRecording?.title}</DialogTitle>
                <div className="flex gap-2">
                  <a
                    href={selectedRecording?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Video className="h-3.5 w-3.5" />
                    Open in new tab
                  </a>
                  <a
                    href={selectedRecording?.url}
                    download
                    className="text-sm px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 bg-black flex items-center justify-center p-4">
              {selectedRecording && (
                <div className="w-full h-full">
                  <VideoPlayer 
                    url={selectedRecording.url}
                    playlist={selectedRecording.playlist}
                    currentIndex={selectedRecording.currentIndex}
                    onPlaylistNext={() => {
                      if (selectedRecording.playlist && selectedRecording.currentIndex !== undefined) {
                        const nextIndex = selectedRecording.currentIndex + 1;
                        if (nextIndex < selectedRecording.playlist.length) {
                          const nextVideo = selectedRecording.playlist[nextIndex];
                          console.log(`⏭️ Playing next video: ${nextIndex + 1}/${selectedRecording.playlist.length}`);
                          setSelectedRecording({
                            url: nextVideo.url,
                            title: `All Recordings (${nextIndex + 1}/${selectedRecording.playlist.length})`,
                            playlist: selectedRecording.playlist,
                            currentIndex: nextIndex
                          });
                        }
                      }
                    }}
                    onError={(error) => {
                      console.error('Video playback error:', error);
                      toast.error('Video playback failed. Try downloading the file instead.', {
                        action: {
                          label: 'Download',
                          onClick: () => {
                            const a = document.createElement('a');
                            a.href = selectedRecording.url;
                            a.download = 'recording.webm';
                            a.click();
                          }
                        }
                      });
                    }}
                  />
                </div>
              )}
            </div>
            <div className="px-4 py-2 bg-gray-900 border-t border-gray-800">
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-300">💡 Tip:</span>
                  <span>
                    {selectedRecording?.playlist && selectedRecording?.playlist.length > 1
                      ? `Videos will play automatically in sequence (${selectedRecording.currentIndex! + 1}/${selectedRecording.playlist.length})`
                      : 'Use playback controls to adjust speed, volume, and quality'}
                  </span>
                </div>
                {selectedRecording?.playlist && selectedRecording?.playlist.length > 1 && (
                  <div className="flex items-center gap-1 text-gray-300 font-medium">
                    <span>{selectedRecording.currentIndex! + 1}</span>
                    <span>/</span>
                    <span>{selectedRecording.playlist.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardBodyWrapper>
  );
}