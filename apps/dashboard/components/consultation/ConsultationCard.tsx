"use client";

import React from "react";
import { ConsultationModelData } from "@/models/consultation.model";
import { format } from "date-fns";
import { SessionStatus } from "@/models/enums";
import {
  User,
  Building2,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  XCircle,
  FileText,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
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
  [SessionStatus.ACTIVE]: {
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <PlayCircle className="w-5 h-5" />,
    label: "Active",
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

interface ConsultationCardProps {
  consultation: ConsultationModelData;
  onViewDetails: (consultationId: string) => void;
  isNavigating?: boolean;
  onHover?: (consultationId: string) => void;
}

export const ConsultationCard = React.memo(function ConsultationCard({
  consultation,
  onViewDetails,
  isNavigating = false,
  onHover,
}: ConsultationCardProps) {
  const dateStr = consultation.createdAt
    ? format(new Date(consultation.createdAt), "dd MMM yyyy, hh:mm a")
    : "N/A";

  const status =
    STATUS_CONFIG[consultation.status] || STATUS_CONFIG[SessionStatus.PENDING];

  const handleClick = () => {
    if (isNavigating) return;
    onViewDetails(consultation.id);
  };

  return (
    <div
      id={`consultation-${consultation.id}`}
      className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 cursor-pointer"
      onClick={handleClick}
      onMouseEnter={() => onHover?.(consultation.id)}
    >
      <div className={`px-4 py-3 border-b ${status.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.icon}
            <span className="font-medium">{status.label}</span>
          </div>
          <span className="text-sm opacity-75">{dateStr}</span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
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

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400">
              <User className="w-5 h-5" />
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {consultation.audiologist?.user?.name || "No Audiologist Assigned"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isNavigating) onViewDetails(consultation.id);
          }}
          disabled={isNavigating}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-wait"
        >
          {isNavigating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              View Details
            </>
          )}
        </button>
      </div>
    </div>
  );
});
