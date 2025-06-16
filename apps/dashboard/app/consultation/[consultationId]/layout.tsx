"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { VideoCall } from "./_components/video-call";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import { use } from "react";
import { useSocket } from "@/providers/socket-provider";
import { useEffect } from "react";

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
    >
      <div className="flex gap-2  overflow-hidden h-full w-full">
        <VideoCall
          channel={resolvedParams.consultationId}
          patientName={consultationData.patient?.name || "Patient"}
        />
        <main className="flex-1 overflow-y-scroll">{children}</main>
      </div>
    </DashboardBodyWrapper>
  );
}
