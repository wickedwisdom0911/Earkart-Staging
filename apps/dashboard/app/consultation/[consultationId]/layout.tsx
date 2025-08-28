"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useMemo, useEffect, useState, useCallback } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useDevice } from "@/providers/device-provider";
import { OtoscopyProvider } from "@/providers/otoscopy-provider";
import { AgoraOtoscopyProvider } from "@/providers/agora-otoscopy-provider";
import { ConsultationContent } from "./_components/consultation-content";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useParams, useRouter } from "next/navigation";
import { usePersistentScreenRecording } from "@/hooks/recording/use-persistent-screen-recording";
import { RecordingRecoveryBanner } from "@/components/recording/recording-recovery-banner";

// Import debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import("@/utils/recording-debug");
}
import { SessionStatus } from "@/models/enums";

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { consultationId } = useParams() as { consultationId: string };
  const router = useRouter();
  const socket = useSocket();

  const {
    data: consultation,
    isLoading,
    error,
  } = useGetConsultation(consultationId);
  const { deviceState } = useDevice();
  const { r15c, revo2, tablet } = deviceState;

  // Screen recording uploader – expose manual controls with persistence
  const { 
    state: recordingState, 
    start: startRecording, 
    stop: stopRecording, 
    complete: completeRecording, 
    abort: abortRecording,
    resumeUploads,
    recoverSession 
  } = usePersistentScreenRecording(consultationId);

  // State for managing recovery banner visibility
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(true);

  // Add socket connection handling
  useEffect(() => {
    if (!socket || !consultationId) return;

    const handleConnect = () => {
      console.log("Socket connected, joining consultation...");
      // Emit join_consultation event when socket connects
      socket.emit("join_consultation", {
        consultationId,
      });
    };

    socket.on("connect", handleConnect);

    if (socket.connected) {
      handleConnect();
    }

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, consultationId]);

  // Listen for explicit end event from socket and redirect to dashboard after finalizing recording
  useEffect(() => {
    if (!socket) return;

    const handleEnd = async () => {
      try {
        // Ensure current recording is properly completed before ending
        if (recordingState.isRecording || recordingState.isInitializing) {
          console.log("🔴 [END] Stopping active recording...");
          await stopRecording(); // flush and complete current recording
        } else if (recordingState.isUploading) {
          console.log("🔄 [END] Waiting for upload to complete...");
          // Wait for current upload to finish
          await new Promise((resolve) => {
            const checkUpload = () => {
              if (!recordingState.isUploading) {
                resolve(void 0);
              } else {
                setTimeout(checkUpload, 250);
              }
            };
            checkUpload();
          });
        } else {
          console.log("💾 [END] Completing any pending recordings...");
          await completeRecording(); // finalize if parts exist
        }
      } catch (err) {
        console.error("❌ [END] Error finalizing recording:", err);
      }
      
      // Extra delay to ensure backend processes everything
      console.log("⏳ [END] Waiting for backend finalization...");
      await new Promise((r) => setTimeout(r, 2000));
      
      if (process.env.NODE_ENV === "development") {
        try { window.location.href = "http://localhost:3001/dashboard"; } catch {}
      } else {
        router.push("/dashboard");
      }
    };

    socket.on("end:consultation", handleEnd);
    return () => { socket.off("end:consultation", handleEnd); };
  }, [socket, stopRecording, completeRecording, recordingState.isRecording, recordingState.isInitializing, recordingState.isUploading, router]);

  // Do NOT auto-start: require explicit user click due to browser security.
  // Auto-stop and auto-complete when consultation ends.
  useEffect(() => {
    const status = ((consultation as any)?.data as ConsultationModelData | undefined)?.status;
    if (!status) return;
    if (
      status === SessionStatus.COMPLETED ||
      status === SessionStatus.CANCELLED ||
      status === SessionStatus.FAILED
    ) {
      // finalize upload if needed
      if (recordingState.isRecording || recordingState.isUploading) {
        stopRecording();
      }
    }
  }, [consultation, stopRecording, recordingState.isRecording, recordingState.isUploading]);

  // Prefer playback from consultation's new recording fields via callback
  const [externalPlaybackUrl, setExternalPlaybackUrl] = useState<string | null>(null);
  useEffect(() => {
    const data = ((consultation as any)?.data as any) || {};
    const status = data?.status;
    const recordingName = data?.recordingName ?? data?.recordingsName ?? data?.recording?.name ?? null;
    const callbackBase: string | undefined = (process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL as any) || undefined;
    if (status === SessionStatus.COMPLETED && callbackBase && recordingName) {
      (async () => {
        try {
          const url = `${callbackBase}?name=${encodeURIComponent(recordingName)}`;
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const json = await res.json().catch(() => ({} as any));
            const playback = json?.url ?? json?.playbackUrl ?? json?.playback_url ?? null;
            if (typeof playback === "string") setExternalPlaybackUrl(playback);
          }
        } catch {}
      })();
    }
  }, [consultation]);

  // Create a single Agora client instance shared across this layout (must be called every render before conditional returns)
  const agoraClient = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

  // Expose a finalize helper that child components can await before navigating
  const finalizeBeforeNavigate = useCallback(async () => {
    try {
      if (recordingState.isRecording || recordingState.isInitializing) {
        await stopRecording();
      } else {
        await completeRecording();
      }
    } catch {}
  }, [recordingState.isRecording, recordingState.isInitializing, stopRecording, completeRecording]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!((consultation as any)?.data)) return <div>No data</div>;

  const consultationData = ((consultation as any)?.data || null) as ConsultationModelData;
  const isCompleted = consultationData.status === SessionStatus.COMPLETED;
  const callbackBase: string | undefined = (process.env.NEXT_PUBLIC_RECORDING_CALLBACK_URL as any) || undefined;
  const rawRecordingNames: string[] = [
    ...((Array.isArray((consultationData as any)?.recordingsName) ? (consultationData as any)?.recordingsName : []) as string[]),
    ...(((consultationData as any)?.recordingName ? [(consultationData as any)?.recordingName] : []) as string[]),
    ...((Array.isArray((consultationData as any)?.recordings) ? (consultationData as any)?.recordings.map((r: any) => r?.name).filter(Boolean) : []) as string[]),
    ...(((consultationData as any)?.recording?.name ? [(consultationData as any)?.recording?.name] : []) as string[]),
  ].filter(Boolean);
  const uniqueRecordingNames = Array.from(new Set(rawRecordingNames));
  const allRecordingLinks = (callbackBase ? uniqueRecordingNames.map((name) => ({ name, url: `${callbackBase}?name=${encodeURIComponent(name)}` })) : []) as { name: string; url: string }[];

  return (
    <OtoscopyProvider consultationId={consultationId}>
      <AgoraOtoscopyProvider>
        <AgoraRTCProvider client={agoraClient}>
          {/* Recovery banner for resumed sessions */}
          {showRecoveryBanner && (
            <RecordingRecoveryBanner
              state={recordingState}
              onResumeUploads={resumeUploads}
              onDismiss={() => setShowRecoveryBanner(false)}
            />
          )}
          <DashboardBodyWrapper
            pageTitle={`Consultation with ${consultationData.centre?.user?.name}`}
            className="border-none "
            button={
              <div className="flex items-center justify-center gap-6 mr-2">
                {/* R15C Device Status */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      r15c.isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    R15C:{" "}
                    {r15c.connectionStatus.charAt(0).toUpperCase() +
                      r15c.connectionStatus.slice(1)}
                    {typeof r15c.batteryLevel === 'number' && (
                      <span className="ml-2 text-xs text-gray-600">R15C 🔋 {r15c.batteryLevel}%</span>
                    )}
                    {typeof r15c.isCharging === 'boolean' && (
                      <span className="ml-1 text-xs text-gray-600">{r15c.isCharging ? "(R15C Charging)" : "(R15C On Battery)"}</span>
                    )}
                  </span>
                </div>

                {/* Revo2 Device Status */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      revo2.isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    Revo2:{" "}
                    {revo2.connectionStatus.charAt(0).toUpperCase() +
                      revo2.connectionStatus.slice(1)}
                  </span>
                </div>

                {/* Tablet State */}
                {tablet && (
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tablet.isCharging ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium">
                      Tablet: {typeof tablet.batteryLevel === 'number' ? `${tablet.batteryLevel}%` : '—'} {" "}
                      {typeof tablet.isCharging === 'boolean' ? (tablet.isCharging ? '(Charging)' : '(On Battery)') : ''}
                    </span>
                  </div>
                )}

                {/* Recording Status Indicator */}
                {(recordingState.isRecording || recordingState.isUploading) && (
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${recordingState.isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500"}`} />
                    <span className="text-sm font-medium">
                      {recordingState.isRecording ? (
                        <>Recording... ({recordingState.uploadedParts} chunks uploaded)</>
                      ) : recordingState.isUploading ? (
                        <>Finalizing... ({recordingState.uploadedParts} parts)</>
                      ) : null}
                    </span>
                  </div>
                )}

                {/* View recordings: during active session show latest only; when completed show all */}
                {isCompleted ? (
                  allRecordingLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {allRecordingLinks.map((r) => (
                        <a
                          key={r.name}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          title={r.name}
                        >
                          {r.name}
                        </a>
                      ))}
                    </div>
                  )
                ) : (
                  (externalPlaybackUrl || recordingState.playbackUrl) && (
                    <a
                      href={externalPlaybackUrl || recordingState.playbackUrl!}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      View recording
                    </a>
                  )
                )}

                {/* Testing complete button removed */}
              </div>
            }
          >
            <ConsultationContent
              consultationId={consultationId}
              patientName={consultationData.patient?.name || "Patient"}
              onBeforeLeaveCall={finalizeBeforeNavigate}
            >
              {children}
            </ConsultationContent>
          </DashboardBodyWrapper>
          {/* Blocking overlay to require Start before proceeding (only while session not ended)
              Show even if a previous session is finalizing, but disable the start button while uploading */}
          {!recordingState.isRecording &&
            (consultationData.status !== SessionStatus.COMPLETED &&
              consultationData.status !== SessionStatus.CANCELLED &&
              consultationData.status !== SessionStatus.FAILED) && (
            <div
              className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-200">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Recording Required</h3>
                <p className="text-base text-gray-700 mb-6 leading-relaxed">
                  To continue this consultation, please start recording and select <b className="text-blue-600">Entire Screen</b> in the share picker.
                </p>
                {recordingState.error?.includes("Entire Screen") && (
                  <div className="mb-4 text-sm text-yellow-800 bg-yellow-100 rounded-lg px-4 py-3 border border-yellow-200">
                    Please select "Entire Screen" in the picker and try again.
                  </div>
                )}
                {recordingState.isUploading && (
                  <div className="mb-4 text-sm text-blue-800 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                    Finalizing previous recording… You can start a new one as soon as it completes.
                  </div>
                )}
                <button
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg shadow-lg"
                  onClick={() =>
                    startRecording({
                      filename: `consultation-${consultationId}-${Date.now()}.webm`,
                      timesliceMs: 5000,
                      maxConcurrentUploads: 3,
                      requireEntireScreen: true,
                    })
                  }
                  disabled={recordingState.isInitializing || recordingState.isRecovering || recordingState.isUploading}
                >
                  {recordingState.isRecovering 
                    ? "Recovering session..." 
                    : recordingState.isUploading
                      ? "Finalizing previous recording…" 
                      : recordingState.isInitializing 
                        ? "Starting..." 
                        : "Start Recording"}
                </button>
              </div>
            </div>
          )}
        </AgoraRTCProvider>
      </AgoraOtoscopyProvider>
    </OtoscopyProvider>
  );
}
