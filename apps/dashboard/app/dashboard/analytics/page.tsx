"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isToday, isSameDay, subDays } from "date-fns";
import { SessionStatus, Role } from "@/models/enums";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import { useAudiologistStatus } from "@/hooks/audiologist/use-audiologist-status";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Stethoscope,
  Calendar as CalendarIcon,
  Eye,
  Phone,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, XCircle } from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: user } = useGetUser();

  const {
    data: consultations,
    isLoading,
    isError,
    error,
  } = useGetAllConsultations();
  const { data: audiologists } = useGetAllAudiologists();

  // Role checks
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const isHeadAudiologist = user?.role === Role.HEAD_AUDIOLOGIST;
  const isNormalAudiologist = user?.role === Role.AUDIOLOGIST;
  const canFilterByAudiologist = isAdmin || isHeadAudiologist;
  
  // Real-time audiologist status from WebSocket
  const { isInCall: checkAudiologistInCall } = useAudiologistStatus();

  // Date filter state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = new Date();
  const yesterday = subDays(today, 1);

  // Filter consultations by selected date (today by default, or selected date)
  // Only show consultations that have an audiologist assigned
  const filteredConsultations = useMemo(() => {
    if (!consultations?.data || !Array.isArray(consultations.data))
      return [];

    const targetDate = selectedDate || today;

    return consultations.data.filter((c) => {
      // Only show consultations with audiologist assigned
      if (!c.audiologist || !c.audiologist.userId) return false;
      if (!c.createdAt) return false;
      const consultationDate = new Date(c.createdAt);
      return isSameDay(consultationDate, targetDate);
    });
  }, [consultations, selectedDate, today]);

  // Group all consultations by audiologist for the details modal
  // Only include consultations that have an audiologist assigned
  const consultationsByAudiologist = useMemo(() => {
    if (!consultations?.data || !Array.isArray(consultations.data)) return new Map();
    
    const map = new Map<string, ConsultationModelData[]>();
    
    consultations.data.forEach((c) => {
      // Only include consultations with audiologist assigned
      const audiologistId = c.audiologist?.userId;
      if (audiologistId) {
        if (!map.has(audiologistId)) {
          map.set(audiologistId, []);
        }
        map.get(audiologistId)!.push(c);
      }
    });
    
    return map;
  }, [consultations]);

  // Get audiologist stats for today
  const audiologistCardsData = useMemo(() => {
    if (!audiologists?.data || !Array.isArray(audiologists.data)) return [];

    return audiologists.data.map((audiologist: any) => {
      // Use userId as the primary ID since WebSocket sends userId
      const audiologistId = audiologist.userId || audiologist.id;
      
      // Get filtered consultations for this audiologist
      const filteredConsultationsForAudiologist = filteredConsultations.filter(
        (c) => c.audiologist?.userId === audiologistId
      );

      // Count by status
      const completed = filteredConsultationsForAudiologist.filter(
        (c) => c.status === SessionStatus.COMPLETED
      ).length;
      const inProgress = filteredConsultationsForAudiologist.filter(
        (c) => c.status === SessionStatus.IN_PROGRESS
      ).length;
      const pending = filteredConsultationsForAudiologist.filter(
        (c) => c.status === SessionStatus.PENDING
      ).length;

      return {
        audiologist,
        audiologistId,
        name: audiologist.user?.name || audiologist.name || "Unknown",
        email: audiologist.user?.email || audiologist.email || "",
        todayConsultationsCount: filteredConsultationsForAudiologist.length,
        completed,
        inProgress,
        pending,
        isInCall: checkAudiologistInCall(audiologistId),
        allConsultations: consultationsByAudiologist.get(audiologistId) || [],
      };
    });
  }, [audiologists, filteredConsultations, consultationsByAudiologist, checkAudiologistInCall]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalAudiologists = audiologistCardsData.length;
    const totalInCall = audiologistCardsData.filter((d) => d.isInCall).length;
    const totalAvailable = totalAudiologists - totalInCall;
    const totalFilteredConsultations = filteredConsultations.length;
    const totalCompleted = filteredConsultations.filter(
      (c) => c.status === SessionStatus.COMPLETED
    ).length;
    const totalInProgress = filteredConsultations.filter(
      (c) => c.status === SessionStatus.IN_PROGRESS
    ).length;

    return {
      totalAudiologists,
      totalInCall,
      totalAvailable,
      totalTodayConsultations: totalFilteredConsultations,
      totalCompleted,
      totalInProgress,
    };
  }, [audiologistCardsData, filteredConsultations]);

  return (
    <DashboardBodyWrapper>
      <div className="h-screen flex flex-col pb-2 overflow-hidden">
        {/* Compact Header - Fixed */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 shadow-lg mb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Audiologist Monitoring</h1>
                  <p className="text-primary-100 text-xs">
                    {format(new Date(), "EEEE, dd/MM/yy • hh:mm a")}
                  </p>
                </div>
              </div>

              {/* Compact Live Stats */}
              <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-primary-100 text-[10px] font-medium uppercase">Total</p>
                <p className="text-2xl font-bold text-white">{summaryStats.totalAudiologists}</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-primary-100 text-[10px] font-medium uppercase">In Call</p>
                <p className="text-2xl font-bold text-red-300">{summaryStats.totalInCall}</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-primary-100 text-[10px] font-medium uppercase">Available</p>
                <p className="text-2xl font-bold text-green-300">{summaryStats.totalAvailable}</p>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <p className="text-primary-100 text-[10px] font-medium uppercase">
                  {selectedDate ? format(selectedDate, "dd/MM/yy") : "Today"}
                </p>
                <p className="text-2xl font-bold text-white">{summaryStats.totalTodayConsultations}</p>
              </div>
              </div>
            </div>
            
            {/* Calendar Filter */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/20">
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
                onClick={() => setSelectedDate(yesterday)}
                className="h-9 bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                Yesterday
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(today)}
                className="h-9 bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                Today
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
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 font-medium">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="flex-1 shadow-md border-red-200 bg-red-50">
            <CardContent className="p-8 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">
                  Failed to load data
                </h3>
                <p className="text-sm text-red-700">
                  {error instanceof Error ? error.message : "Please try again later."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Cards Grid - No Scroll */}
        {!isLoading && !isError && (
          <>
            {audiologistCardsData.length === 0 ? (
              <Card className="flex-1 shadow-md border-gray-200">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Stethoscope className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Audiologists Found
                    </h3>
                    <p className="text-gray-600">
                      There are no audiologists in the system.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 overflow-hidden">
                {audiologistCardsData.map((cardData) => (
                  <Card
                    key={cardData.audiologistId}
                    className={`
                      group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl cursor-pointer
                      ${cardData.isInCall 
                        ? 'bg-red-50 border-red-300 hover:border-red-400' 
                        : 'bg-white border-gray-200 hover:border-primary-400'}
                    `}
                    onClick={() => router.push(`/dashboard/analytics/audiologist/${cardData.audiologistId}`)}
                  >
                    {/* Status Indicator Banner */}
                    <div className={`
                      absolute top-0 left-0 right-0 h-1
                      ${cardData.isInCall ? 'bg-red-500 animate-pulse' : 'bg-green-500'}
                    `} />

                    <CardContent className="p-3 space-y-2">
                      {/* Audiologist Info */}
                      <div className="flex items-start gap-2">
                        <div className={`
                          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md
                          ${cardData.isInCall 
                            ? 'bg-gradient-to-br from-red-500 to-red-600' 
                            : 'bg-gradient-to-br from-primary-500 to-primary-600'}
                        `}>
                          <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">
                            {cardData.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 truncate">
                            {cardData.email}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex justify-center py-1">
                        {cardData.isInCall ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-md border border-red-300 font-bold">
                            <Phone className="w-3 h-3 animate-pulse" />
                            <span className="text-[10px]">IN CALL</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-md border border-green-300 font-bold">
                            <PhoneOff className="w-3 h-3" />
                            <span className="text-[10px]">AVAILABLE</span>
                          </div>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-200">
                        {/* Today's Total */}
                        <div className="text-center">
                          <div className="w-full aspect-square flex flex-col items-center justify-center rounded-lg bg-primary-100 border border-primary-300">
                            <span className="text-lg font-bold text-primary-700 leading-none">
                              {cardData.todayConsultationsCount}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-600 mt-0.5 font-medium">Today</p>
                        </div>

                        {/* Completed */}
                        <div className="text-center">
                          <div className="w-full aspect-square flex flex-col items-center justify-center rounded-lg bg-green-100 border border-green-300">
                            <span className="text-lg font-bold text-green-700 leading-none">
                              {cardData.completed}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-600 mt-0.5 font-medium">Done</p>
                        </div>

                        {/* In Progress */}
                        <div className="text-center">
                          <div className="w-full aspect-square flex flex-col items-center justify-center rounded-lg bg-blue-100 border border-blue-300">
                            <span className="text-lg font-bold text-blue-700 leading-none">
                              {cardData.inProgress}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-600 mt-0.5 font-medium">Active</p>
                        </div>

                        {/* Pending */}
                        <div className="text-center">
                          <div className="w-full aspect-square flex flex-col items-center justify-center rounded-lg bg-yellow-100 border border-yellow-300">
                            <span className="text-lg font-bold text-yellow-700 leading-none">
                              {cardData.pending}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-600 mt-0.5 font-medium">Pending</p>
                        </div>
                      </div>
                    </CardContent>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </DashboardBodyWrapper>
  );
}
