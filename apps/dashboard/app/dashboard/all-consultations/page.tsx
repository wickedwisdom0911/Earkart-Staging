"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useEffect, useState } from "react";
import { ConsultationModelData } from "@/models/consultation.model";
import { format } from "date-fns";
import {
  SessionStatus,
  Role,
} from "@/models/enums";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import {
  User,
  Building2,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  XCircle,
  FileText,
  Filter,
  X,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function AllConsultationsPage() {
  const router = useRouter();
  const { data: user } = useGetUser();
  const [filteredConsultations, setFilteredConsultations] = useState<
    ConsultationModelData[]
  >([]);
  const { data: consultations, isLoading, isError } = useGetAllConsultations();
  
  // Check if user is an audiologist
  const isAudiologist =
    user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

  // Filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (consultations?.data && Array.isArray(consultations.data)) {
      let filtered = [...consultations.data];

      // For audiologists (non-admin), automatically filter to show only their consultations
      if (isAudiologist && user?.id) {
        filtered = filtered.filter(
          (c) => c.audiologist?.userId === user.id
        );
      }

      // Filter by date range
      if (startDate) {
        filtered = filtered.filter((c) => {
          const consultationDate = new Date(c.createdAt);
          const start = new Date(startDate);
          return consultationDate >= start;
        });
      }

      if (endDate) {
        filtered = filtered.filter((c) => {
          const consultationDate = new Date(c.createdAt);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          return consultationDate <= end;
        });
      }

      // Sort by date (newest first)
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setFilteredConsultations(filtered);
    }
  }, [consultations, startDate, endDate, isAudiologist, user?.id]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const renderConsultationCard = (consultation: ConsultationModelData) => {
    const dateStr = consultation.createdAt
      ? format(new Date(consultation.createdAt), "dd MMM yyyy, hh:mm a")
      : "N/A";

    // Status colors and icons - same as Active Consultations
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

    const status =
      statusConfig[consultation.status] || statusConfig[SessionStatus.PENDING];

    return (
      <div
        key={consultation.id}
        className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700 cursor-pointer"
        onClick={() => {
          router.push(`/dashboard/consultation-details/${consultation.id}`);
        }}
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

        {/* Action Button */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/consultation-details/${consultation.id}`);
            }}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <FileText className="w-5 h-5" />
            View Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardBodyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isAudiologist ? "My Session History" : "Session History"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAudiologist 
                ? "Browse and filter your past consultation records" 
                : "Browse and filter all consultation records"}
            </p>
            {isAudiologist && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                <User className="w-4 h-4" />
                <span>Showing only your consultations</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters Card */}
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(startDate || endDate) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredConsultations.length} consultation
            {filteredConsultations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="w-5 h-5" />
              <p>Failed to load consultations. Please try again.</p>
            </div>
          </Card>
        )}

        {/* Consultations Grid */}
        {!isLoading && !isError && (
          <>
            {filteredConsultations.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-gray-800">
                <div className="flex flex-col items-center gap-4">
                  <AlertCircle className="w-16 h-16 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No consultations found
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your filters or check back later
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredConsultations.map((consultation) =>
                  renderConsultationCard(consultation)
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}

