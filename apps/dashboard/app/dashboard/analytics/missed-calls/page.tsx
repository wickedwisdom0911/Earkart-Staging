"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isSameDay, subDays } from "date-fns";
import { SessionStatus } from "@/models/enums";
import { useRouter } from "next/navigation";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import {
  PhoneOff,
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  User,
  Building2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/Badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function MissedCallsPage() {
  const router = useRouter();

  const {
    data: consultations,
    isLoading,
    isError,
    error,
  } = useGetAllConsultations();

  // Date filter state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = new Date();
  const yesterday = subDays(today, 1);

  // Filter consultations that are NOT assigned to any audiologist
  const missedCalls = useMemo(() => {
    if (!consultations?.data) return [];

    const consultationsArray = extractConsultations(consultations.data);
    return consultationsArray.filter((c) => {
      // Only show consultations WITHOUT audiologist assigned
      // Use EXACT same logic as All Consultations page card display:
      // consultation.audiologist?.user?.name || "No Audiologist Assigned"
      // So if audiologist?.user?.name exists (truthy), it's assigned - exclude it
      if (c.audiologist?.user?.name) {
        return false; // Has audiologist - not a missed call
      }
      
      // If we reach here, no audiologist is assigned - this IS a missed call
      // Include all statuses (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
      // because all represent consultations where no audiologist was assigned

      // Filter by date only if a date is selected
      if (selectedDate) {
        if (!c.createdAt) return false;
        const consultationDate = new Date(c.createdAt);
        return isSameDay(consultationDate, selectedDate);
      }

      // No date filter - show all missed calls
      return true;
    });
  }, [consultations, selectedDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = missedCalls.length;
    const pending = missedCalls.filter(
      (c) => c.status === SessionStatus.PENDING
    ).length;
    const inProgress = missedCalls.filter(
      (c) => c.status === SessionStatus.IN_PROGRESS
    ).length;
    const completed = missedCalls.filter(
      (c) => c.status === SessionStatus.COMPLETED
    ).length;
    const cancelled = missedCalls.filter(
      (c) => c.status === SessionStatus.CANCELLED
    ).length;

    return { total, pending, inProgress, completed, cancelled };
  }, [missedCalls]);

  // Debug: Count all consultations without audiologist (ignoring status filter)
  const debugStats = useMemo(() => {
    if (!consultations?.data) return { total: 0, withoutAudiologist: 0 };
    
    const allConsultations = extractConsultations(consultations.data);
    const withoutAudiologist = allConsultations.filter(c => !c.audiologist?.user?.name);
    
    console.log("[MissedCalls Debug]", {
      totalConsultations: allConsultations.length,
      withoutAudiologist: withoutAudiologist.length,
      withoutAudiologistDetails: withoutAudiologist.map(c => ({
        id: c.id,
        status: c.status,
        audiologist: c.audiologist,
        audiologistId: c.audiologistId,
        createdAt: c.createdAt
      }))
    });
    
    return { 
      total: allConsultations.length, 
      withoutAudiologist: withoutAudiologist.length 
    };
  }, [consultations]);

  const statusConfig: Record<string, { color: string; label: string }> = {
    [SessionStatus.PENDING]: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Pending",
    },
    [SessionStatus.IN_PROGRESS]: {
      color: "bg-blue-50 text-blue-700 border-blue-200",
      label: "In Progress",
    },
    [SessionStatus.COMPLETED]: {
      color: "bg-gray-50 text-gray-700 border-gray-200",
      label: "Completed",
    },
    [SessionStatus.CANCELLED]: {
      color: "bg-red-50 text-red-700 border-red-200",
      label: "Cancelled",
    },
  };

  const safeFormatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return format(d, "dd/MM/yy, hh:mm a");
    } catch {
      return "Invalid date";
    }
  };

  return (
    <DashboardBodyWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                  <PhoneOff className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Missed Calls
                  </h1>
                  <p className="text-primary-100 text-sm">
                    Consultations without assigned audiologist
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-primary-100 text-xs font-medium uppercase">Total</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-primary-100 text-xs font-medium uppercase">Pending</p>
                <p className="text-3xl font-bold text-yellow-300">{stats.pending}</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <p className="text-primary-100 text-xs font-medium uppercase">In Progress</p>
                <p className="text-3xl font-bold text-blue-300">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          {/* Calendar Filter */}
          <div className="flex items-center gap-3 pt-4 mt-4 border-t border-white/20">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Select Date:</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 bg-white/10 hover:bg-white/20 text-white border-white/30"
                >
                  <CalendarIcon className="w-3 h-3 mr-2" />
                  {selectedDate ? format(selectedDate, "dd/MM/yy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => setSelectedDate(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(today)}
              className={`h-9 ${selectedDate && isSameDay(selectedDate, today) ? "bg-white/30 border-white/50" : "bg-white/10 border-white/30"} hover:bg-white/20 text-white`}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(yesterday)}
              className={`h-9 ${selectedDate && isSameDay(selectedDate, yesterday) ? "bg-white/30 border-white/50" : "bg-white/10 border-white/30"} hover:bg-white/20 text-white`}
            >
              Yesterday
            </Button>
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="h-9 bg-white/20 hover:bg-white/30 text-white border-white/40"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 font-medium">Loading missed calls...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="shadow-md border-primary-200 bg-primary-50">
            <CardContent className="p-8 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900">
                  Failed to load data
                </h3>
                <p className="text-sm text-primary-700">
                  {error instanceof Error ? error.message : "Please try again later."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missed Calls List */}
        {!isLoading && !isError && (
          <>
            {missedCalls.length === 0 ? (
              <Card className="shadow-md border-gray-200">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PhoneOff className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Missed Calls
                    </h3>
                    <p className="text-gray-600">
                      {selectedDate
                        ? `All consultations on ${format(selectedDate, "dd/MM/yy")} have been assigned.`
                        : "All consultations have been assigned to audiologists."}
                    </p>
                    <p className="text-xs text-gray-400 mt-4">
                      Total consultations: {debugStats.total} | Without audiologist: {debugStats.withoutAudiologist}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {missedCalls.map((consultation) => {
                  const status =
                    (consultation.status &&
                      statusConfig[consultation.status as SessionStatus]) ||
                    statusConfig[SessionStatus.PENDING];

                  return (
                    <Card
                      key={consultation.id}
                      className="group relative overflow-hidden border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 hover:shadow-xl cursor-pointer"
                      onClick={() => router.push(`/consultation/${consultation.id}`)}
                    >
                      {/* Status Indicator Banner */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500" />

                      <CardContent className="p-5 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              Consultation #{consultation.id.substring(0, 8)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {safeFormatDate(consultation.createdAt)}
                            </p>
                          </div>
                          <Badge
                            className={`${status.color} border font-semibold`}
                          >
                            {status.label}
                          </Badge>
                        </div>

                        {/* Patient Info */}
                        <div className="space-y-2 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              Patient:
                            </span>
                            <span className="text-sm text-gray-900">
                              {consultation.patient?.name || "Unknown Patient"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              Centre:
                            </span>
                            <span className="text-sm text-gray-900">
                              {consultation.centre?.user?.name || "Unknown Centre"}
                            </span>
                          </div>
                        </div>

                        {/* Warning Message */}
                        <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          <p className="text-sm text-primary-700 font-medium">
                            No audiologist assigned
                          </p>
                        </div>
                      </CardContent>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}

