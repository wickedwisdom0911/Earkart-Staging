"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useEffect, useState } from "react";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { ConsultationModelData } from "@/models/consultation.model";
import { useSocket } from "@/providers/socket-provider";
import Link from "next/link";
import { format } from "date-fns";
import { SessionStatus } from "@/models/enums";

export default function DashboardPage() {
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

  const renderConsultationCard = (consultation: ConsultationModelData) => {
    const dateStr = consultation.createdAt
      ? format(new Date(consultation.createdAt), "dd MMM yyyy, hh:mm a")
      : "N/A";
    const statusColor =
      consultation.status === SessionStatus.COMPLETED
        ? "bg-green-100 text-green-800"
        : consultation.status === SessionStatus.PENDING
          ? "bg-yellow-100 text-yellow-800"
          : "bg-gray-100 text-gray-800";

    return (
      <div
        key={consultation.id}
        className="flex flex-col justify-between h-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-transform hover:scale-105 hover:shadow-2xl"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👤</span>
            <span className="font-semibold text-lg text-primary-700 dark:text-primary-200 truncate">
              {consultation.patient?.name || "Unknown Patient"}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏥</span>
            <span className="text-md text-primary-600 dark:text-primary-300 truncate">
              {consultation.centre?.user?.name || "Centre Name"}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📅</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {dateStr}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔖</span>
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${statusColor}`}
            >
              {consultation.status?.toUpperCase() || "N/A"}
            </span>
          </div>
        </div>
        <Link
          href={`/dashboard/consultation/${consultation.id}`}
          className="mt-4"
        >
          <button className="w-full bg-primary-600 cursor-pointer text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition">
            Join Consultation
          </button>
        </Link>
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
