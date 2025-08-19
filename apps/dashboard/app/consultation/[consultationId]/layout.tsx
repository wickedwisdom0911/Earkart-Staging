"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { useMemo, useEffect } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useDevice } from "@/providers/device-provider";
import { OtoscopyProvider } from "@/providers/otoscopy-provider";
import { AgoraOtoscopyProvider } from "@/providers/agora-otoscopy-provider";
import { ConsultationContent } from "./_components/consultation-content";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useParams } from "next/navigation";
import { useScreenRecordingUpload } from "@/hooks/recording/use-screen-recording-upload";
import { SessionStatus } from "@/models/enums";

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { consultationId } = useParams() as { consultationId: string };
  const socket = useSocket();

  const {
    data: consultation,
    isLoading,
    error,
  } = useGetConsultation(consultationId);
  const { deviceState } = useDevice();
  const { r15c, revo2, tablet } = deviceState;

  // Screen recording uploader – expose manual controls
  const { state: recordingState, start: startRecording, stop: stopRecording, complete: completeRecording, abort: abortRecording } = useScreenRecordingUpload(consultationId);

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

  // Start recording on mount (disabled in development to allow manual testing), stop on unmount
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    startRecording({ filename: `consultation-${consultationId}-${Date.now()}.webm`, timesliceMs: 5000, maxConcurrentUploads: 3 });
    return () => {
      stopRecording();
    };
  }, [consultationId, startRecording, stopRecording]);

  // Also stop if the consultation gets completed/cancelled while still on the page
  useEffect(() => {
    const status = (consultation?.data as ConsultationModelData | undefined)?.status;
    if (!status) return;
    if (status === SessionStatus.COMPLETED || status === SessionStatus.CANCELLED || status === SessionStatus.FAILED) {
      stopRecording();
    }
  }, [consultation, stopRecording]);

  // Create a single Agora client instance shared across this layout (must be called every render before conditional returns)
  const agoraClient = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!consultation?.data) return <div>No data</div>;

  const consultationData = consultation.data as ConsultationModelData;

  return (
    <OtoscopyProvider consultationId={consultationId}>
      <AgoraOtoscopyProvider>
        <AgoraRTCProvider client={agoraClient}>
          <DashboardBodyWrapper
            pageTitle={`Consultation with ${consultationData.centre?.user?.name}`}
            className="border-none "
            button={
              <div className="flex items-center gap-4">
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

                {/* Manual recording controls (development only) */}
                {process.env.NODE_ENV === "development" && (
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                      onClick={() => startRecording({ filename: `consultation-${consultationId}-${Date.now()}.webm`, timesliceMs: 5000, maxConcurrentUploads: 3 })}
                    >
                      Start
                    </button>
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded"
                      onClick={completeRecording}
                    >
                      Complete
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded"
                      onClick={abortRecording}
                    >
                      Abort
                    </button>
                  </div>
                )}
              </div>
            }
          >
            <ConsultationContent
              consultationId={consultationId}
              patientName={consultationData.patient?.name || "Patient"}
            >
              {children}
            </ConsultationContent>
          </DashboardBodyWrapper>
        </AgoraRTCProvider>
      </AgoraOtoscopyProvider>
    </OtoscopyProvider>
  );
}
