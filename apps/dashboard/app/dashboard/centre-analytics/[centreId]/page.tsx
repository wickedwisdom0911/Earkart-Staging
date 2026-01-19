"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isSameDay, isToday, subDays } from "date-fns";
import { SessionStatus, Role } from "@/models/enums";
import { useParams, useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import useGetCentre from "@/hooks/centre/use-get-centre";
import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { XCircle } from "lucide-react";

export default function CentreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: user } = useGetUser();
  const centreId = params.centreId as string;

  const {
    data: consultations,
    isLoading: consultationsLoading,
  } = useGetAllConsultations();
  
  const {
    data: centre,
    isLoading: centreLoading,
  } = useGetCentre(centreId);

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

  // Get centre data
  const centreData = useMemo(() => {
    if (!centre?.data) return null;
    return centre.data;
  }, [centre]);

  // Filter consultations for this centre
  const centreConsultations = useMemo(() => {
    if (!consultations?.data) return [];

    const consultationsArray = extractConsultations(consultations.data);
    return consultationsArray.filter(
      (c) => c.centre?.id === centreId
    );
  }, [consultations, centreId]);

  // Filter by date if selected
  const filteredConsultations = useMemo(() => {
    if (!selectedDate) return centreConsultations;

    return centreConsultations.filter((c) => {
      if (!c.createdAt) return false;
      const consultationDate = new Date(c.createdAt);
      return isSameDay(consultationDate, selectedDate);
    });
  }, [centreConsultations, selectedDate]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredConsultations.length;
    const completed = filteredConsultations.filter(
      (c) => c.status === SessionStatus.COMPLETED
    ).length;
    const inProgress = filteredConsultations.filter(
      (c) => c.status === SessionStatus.IN_PROGRESS
    ).length;
    const pending = filteredConsultations.filter(
      (c) => c.status === SessionStatus.PENDING
    ).length;
    const cancelled = filteredConsultations.filter(
      (c) => c.status === SessionStatus.CANCELLED
    ).length;

    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
    };
  }, [filteredConsultations]);

  // Get status badge
  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.COMPLETED:
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case SessionStatus.IN_PROGRESS:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
            <PlayCircle className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case SessionStatus.PENDING:
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case SessionStatus.CANCELLED:
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  // Format the date for display
  const getDateDisplayText = () => {
    if (!selectedDate) return "All Time";
    if (isToday(selectedDate)) return "Today";
    if (isSameDay(selectedDate, yesterday)) return "Yesterday";
    return format(selectedDate, "dd/MM/yy");
  };

  if (consultationsLoading || centreLoading) {
    return (
      <DashboardBodyWrapper>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  return (
    <DashboardBodyWrapper>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/centre-analytics")}
            className="mb-4 text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Centre Analytics
          </Button>

          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">
                    {centreData?.user?.name || centreData?.entName || "Unknown Centre"}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-primary-100">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {centreData?.code || "N/A"}
                    </span>
                    {centreData?.city?.name && (
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {centreData.city.name}
                      </span>
                    )}
                    {centreData?.contactNumber && (
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {centreData.contactNumber}
                      </span>
                    )}
                    {centreData?.assistantName && (
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {centreData.assistantName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className={`${
                    !selectedDate
                      ? "bg-white text-primary-700"
                      : "bg-primary-500 text-white hover:bg-white hover:text-primary-700"
                  }`}
                >
                  All Time
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(today)}
                  className={`${
                    selectedDate && isToday(selectedDate)
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
                {selectedDate && (
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <PlayCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <PlayCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Consultations - {getDateDisplayText()}</span>
              <span className="text-sm font-normal text-gray-600">
                {filteredConsultations.length} consultation(s)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredConsultations.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No consultations found</p>
                <p className="text-gray-500 text-sm mt-2">
                  {selectedDate
                    ? "Try selecting a different date"
                    : "Consultations will appear here once they are created"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/all-consultations`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {consultation.patient?.name || "Unknown Patient"}
                          </h3>
                          {getStatusBadge(consultation.status as SessionStatus)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-500">Code:</span>{" "}
                            <span className="font-medium">{consultation.code || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Patient Contact:</span>{" "}
                            <span className="font-medium">
                              {consultation.patient?.contactNumber || "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Audiologist:</span>{" "}
                            <span className="font-medium">
                              {consultation.audiologist?.user?.name || "Not Assigned"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Date:</span>{" "}
                            <span className="font-medium">
                              {consultation.createdAt
                                ? format(new Date(consultation.createdAt), "dd/MM/yy HH:mm")
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardBodyWrapper>
  );
}

