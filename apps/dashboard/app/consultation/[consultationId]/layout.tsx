"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { VideoCall } from "./_components/video-call";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { use } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useEffect } from "react";
import { useDevice } from "@/providers/device-provider";

export default function ConsultationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ consultationId: string }>;
}) {
  const resolvedParams = use(params);
  const socket = useSocket();

  const {
    data: consultation,
    isLoading,
    error,
  } = useGetConsultation(resolvedParams.consultationId);
  const { deviceState } = useDevice();
  const { r15c, revo2 } = deviceState;

  // Add socket connection handling
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log("Socket connected, joining consultation...");
      // Emit join_consultation event when socket connects
      socket.emit("join_consultation", {
        consultationId: resolvedParams.consultationId,
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
  }, [socket, resolvedParams.consultationId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!consultation?.data) return <div>No data</div>;

  const consultationData = consultation.data as ConsultationModelData;
  console.log(consultationData);

  return (
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
        </div>
      }
    >
      <div className="flex gap-2  overflow-hidden h-full w-full">
        <VideoCall
          channel={resolvedParams.consultationId}
          patientName={consultationData.patient?.name || "Patient"}
        />
        <main className="flex-1 w-full overflow-y-scroll">{children}</main>
      </div>
    </DashboardBodyWrapper>
  );
}
