"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useEffect, useState } from "react";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
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
import {
  User,
  Building2,
  Video,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function DashboardPage() {
  const router = useRouter();
  const { data: user } = useGetUser();
  const [allConsulations, setAllConsulations] = useState<
    ConsultationModelData[]
  >([]);
  const { data: consultations, isLoading, isError } = useGetAllConsultations();
  const socket = useSocket();

  // NEW: Track socket connection status
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    if (Array.isArray(consultations?.data)) {
      setAllConsulations(consultations?.data);
    }
  }, [consultations]);

  useEffect(() => {
    if (!socket) return;

    // Handler functions
    socket.onAny((event, ...args) => {
      console.log(`[SOCKET EVENT]: ${event}`, ...args);
    });
    const onNewConsultation = (data: ConsultationModelData) => {
      setAllConsulations((prev) => {
        // Only add if not already present
        if (prev.some((c) => c.id === data.id)) return prev;
        return [data, ...prev];
      });
    };

    // NEW: Listen for connect/disconnect
    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    socket.on("new_consultation", onNewConsultation);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Set initial status
    setIsSocketConnected(socket.connected);

    // Cleanup: remove listeners
    return () => {
      socket.off("new_consultation", onNewConsultation);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const joinRoom = (consultationId: string) => {
    console.log(consultationId);

    socket?.emit("join_consultation", { consultationId });
    socket?.on("joined", (data) => {
      console.log("Joined consultation:", data);
      if (data === consultationId) {
        router.push(ROUTES.CONSULTATION(data));
      }
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
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video className="w-5 h-5" />
                  Join Consultation
                </button>
              )}
            {consultation.audiologist &&
              consultation.audiologist.userId === user?.id &&
              (consultation.status === SessionStatus.IN_PROGRESS ||
                consultation.status === SessionStatus.PENDING) && (
                <button
                  onClick={() => joinRoom(consultation.id)}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video className="w-5 h-5" />
                  Rejoin Consultation
                </button>
              )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardBodyWrapper>
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
        {allConsulations?.map(renderConsultationCard)}
      </div>
    </DashboardBodyWrapper>
  );
}
