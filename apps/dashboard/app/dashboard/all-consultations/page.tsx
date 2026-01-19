"use client";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useEffect, useState, useRef, useMemo } from "react";
import { ConsultationModelData } from "@/models/consultation.model";
import { format } from "date-fns";
import {
  SessionStatus,
  Role,
} from "@/models/enums";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultationsInfiniteFlat } from "@/hooks/consultation/use_get_all_consultations_infinite";
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
  Loader2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ConsultationGridSkeleton } from "@/components/ui/consultation-skeleton";
import { ConsultationEmptyState } from "@/components/ui/consultation-empty-state";

export default function AllConsultationsPage() {
  const router = useRouter();
  const { data: user } = useGetUser();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const {
    consultations: allConsultations,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage: hasMorePages,
    isFetchingNextPage,
    total,
  } = useGetAllConsultationsInfiniteFlat({ limit: 20 });
  
  // Check if user is an audiologist
  const isAudiologist =
    user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;

  // Filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMorePages || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePages && !isFetchingNextPage) {
          console.log("🔵 [AllConsultationsPage] Loading more consultations...");
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMorePages, isFetchingNextPage, fetchNextPage]);

  // Add logging for errors
  useEffect(() => {
    if (isError) {
      console.error("🔴 [AllConsultationsPage] Error state:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
    }
  }, [isError, error]);

  // Filter consultations using useMemo to prevent infinite loops
  const filteredConsultations = useMemo(() => {
    if (!allConsultations || allConsultations.length === 0) {
      return [];
    }

    let filtered = [...allConsultations];

    // For audiologists (non-admin), automatically filter to show only their consultations
    if (isAudiologist && user?.id) {
      filtered = filtered.filter(
        (c) => c.audiologist?.userId === user.id
      );
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((c) => {
        const consultationDate = new Date(c.createdAt || "");
        const start = new Date(startDate);
        return consultationDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter((c) => {
        const consultationDate = new Date(c.createdAt || "");
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        return consultationDate <= end;
      });
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
    );

    return filtered;
  }, [allConsultations, startDate, endDate, isAudiologist, user?.id]);

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
          <div className="w-full">
            <ConsultationGridSkeleton count={4} />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-5 h-5" />
                <p className="font-semibold">
                  {error instanceof Error && (error as any).isRateLimit
                    ? "Too Many Requests"
                    : "Failed to load consultations"}
                </p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error instanceof Error && (error as any).isRateLimit
                  ? "The server is receiving too many requests. Please wait a moment and try again."
                  : error instanceof Error
                  ? error.message
                  : "Please try again later."}
              </p>
              {error instanceof Error && (error as any).isRateLimit && (
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-2 w-fit"
                  variant="outline"
                >
                  Retry
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Consultations Grid or Empty State */}
        {!isLoading && !isError && (
          <>
            {filteredConsultations.length === 0 ? (
              <ConsultationEmptyState 
                type="all" 
                hasFilters={!!(startDate || endDate)}
                onClearFilters={clearFilters}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredConsultations.map((consultation) =>
                    renderConsultationCard(consultation)
                  )}
                </div>
                
                {/* Infinite scroll trigger and loading indicator */}
                <div ref={observerTarget} className="h-10 flex items-center justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading more consultations...</span>
                    </div>
                  )}
                </div>
                
                {!hasMorePages && filteredConsultations.length > 0 && (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    All consultations loaded ({total} total)
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}

