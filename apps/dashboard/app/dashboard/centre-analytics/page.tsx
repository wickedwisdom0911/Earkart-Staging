"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isToday, isSameDay, subDays } from "date-fns";
import { SessionStatus, Role } from "@/models/enums";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Building2,
  Calendar as CalendarIcon,
  Eye,
  Phone,
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

export default function CentreAnalyticsPage() {
  const router = useRouter();
  const { data: user } = useGetUser();

  const {
    data: consultations,
    isLoading,
    isError,
    error,
  } = useGetAllConsultations();
  const { data: centres } = useGetAllCentres();

  // Role checks - only admin and super_admin can access
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  // Redirect if not admin
  if (!isAdmin && user) {
    router.push("/dashboard");
    return null;
  }

  // Date filter state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = new Date();
  const yesterday = subDays(today, 1);

  // Filter consultations by selected date (today by default, or selected date)
  // Only show consultations that have a centre assigned
  const filteredConsultations = useMemo(() => {
    if (!consultations?.data || !Array.isArray(consultations.data))
      return [];

    const targetDate = selectedDate || today;

    return consultations.data.filter((c) => {
      // Only show consultations with centre assigned
      if (!c.centre || !c.centre.id) return false;
      if (!c.createdAt) return false;
      const consultationDate = new Date(c.createdAt);
      return isSameDay(consultationDate, targetDate);
    });
  }, [consultations, selectedDate, today]);

  // Group all consultations by centre for the details modal
  // Only include consultations that have a centre assigned
  const consultationsByCentre = useMemo(() => {
    if (!consultations?.data || !Array.isArray(consultations.data)) return new Map();
    
    const map = new Map<string, ConsultationModelData[]>();
    
    consultations.data.forEach((c) => {
      // Only include consultations with centre assigned
      const centreId = c.centre?.id;
      if (centreId) {
        if (!map.has(centreId)) {
          map.set(centreId, []);
        }
        map.get(centreId)!.push(c);
      }
    });
    
    return map;
  }, [consultations]);

  // Get centre stats for selected date
  const centreCardsData = useMemo(() => {
    if (!centres?.data?.data || !Array.isArray(centres.data.data)) return [];

    return centres.data.data.map((centre: any) => {
      const centreId = centre.id;
      
      // Get filtered consultations for this centre
      const filteredConsultationsForCentre = filteredConsultations.filter(
        (c) => c.centre?.id === centreId
      );

      // Count by status
      const completed = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.COMPLETED
      ).length;
      const inProgress = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.IN_PROGRESS
      ).length;
      const pending = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.PENDING
      ).length;

      return {
        centre,
        centreId,
        name: centre.user?.name || centre.entName || "Unknown Centre",
        code: centre.code || "",
        location: centre.city?.name || "Unknown Location",
        todayConsultationsCount: filteredConsultationsForCentre.length,
        completed,
        inProgress,
        pending,
        allConsultations: consultationsByCentre.get(centreId) || [],
      };
    });
  }, [centres, filteredConsultations, consultationsByCentre]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalCentres = centreCardsData.length;
    const activeCentres = centreCardsData.filter((d) => d.todayConsultationsCount > 0).length;
    const totalFilteredConsultations = filteredConsultations.length;
    const totalCompleted = filteredConsultations.filter(
      (c) => c.status === SessionStatus.COMPLETED
    ).length;
    const totalInProgress = filteredConsultations.filter(
      (c) => c.status === SessionStatus.IN_PROGRESS
    ).length;

    return {
      totalCentres,
      activeCentres,
      inactiveCentres: totalCentres - activeCentres,
      todayConsultations: totalFilteredConsultations,
      completedConsultations: totalCompleted,
      inProgressConsultations: totalInProgress,
    };
  }, [centreCardsData, filteredConsultations]);

  // Handle navigation to centre details
  const handleViewCentre = (centreId: string) => {
    router.push(`/dashboard/centre-analytics/${centreId}`);
  };

  if (isLoading) {
    return (
      <DashboardBodyWrapper>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  if (isError) {
    return (
      <DashboardBodyWrapper>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Error loading data: {error?.message || "Unknown error"}
          </div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  // Format the date for display
  const getDateDisplayText = () => {
    if (!selectedDate) return "Today";
    if (isToday(selectedDate)) return "Today";
    if (isSameDay(selectedDate, yesterday)) return "Yesterday";
    return format(selectedDate, "dd/MM/yy");
  };

  return (
    <DashboardBodyWrapper>
      <div className="p-6">
        {/* Header with date filter */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Centre Analytics</h1>
                <p className="text-primary-100">
                  Performance overview for {getDateDisplayText()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className={`${
                    !selectedDate || isToday(selectedDate)
                      ? "bg-white text-primary-700"
                      : "bg-primary-500 text-white hover:bg-white hover:text-primary-700"
                  }`}
                >
                  Today
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(yesterday)}
                  className={`${
                    selectedDate && isSameDay(selectedDate, yesterday)
                      ? "bg-white text-primary-700"
                      : "bg-primary-500 text-white hover:bg-white hover:text-primary-700"
                  }`}
                >
                  Yesterday
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-primary-500 text-white hover:bg-white hover:text-primary-700"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {selectedDate && !isToday(selectedDate) && !isSameDay(selectedDate, yesterday)
                        ? format(selectedDate, "dd/MM/yy")
                        : "Pick Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate || today}
                      onSelect={(date) => setSelectedDate(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {selectedDate && !isToday(selectedDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                    className="text-white hover:bg-white hover:text-primary-700"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Centres</p>
                  <p className="text-2xl font-bold text-primary-700">
                    {summaryStats.totalCentres}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Centres</p>
                  <p className="text-2xl font-bold text-green-700">
                    {summaryStats.activeCentres}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <PlayCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Consultations</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {summaryStats.todayConsultations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {summaryStats.completedConsultations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Centre Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {centreCardsData.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No centres found</p>
            </div>
          ) : (
            centreCardsData.map((data) => (
              <Card
                key={data.centreId}
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-primary-200"
                onClick={() => handleViewCentre(data.centreId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {data.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">{data.code}</p>
                      <p className="text-xs text-gray-500">{data.location}</p>
                    </div>
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <PlayCircle className="w-4 h-4 text-blue-500" />
                        Total
                      </span>
                      <span className="font-semibold text-blue-700">
                        {data.todayConsultationsCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Completed
                      </span>
                      <span className="font-semibold text-green-700">
                        {data.completed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-amber-500" />
                        In Progress
                      </span>
                      <span className="font-semibold text-amber-700">
                        {data.inProgress}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        Pending
                      </span>
                      <span className="font-semibold text-orange-700">
                        {data.pending}
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 border-primary-300 text-primary-700 hover:bg-primary-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCentre(data.centreId);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}

