"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isSameDay, isToday, subDays, startOfDay, endOfDay } from "date-fns";
import { SessionStatus, Role, TestStatus } from "@/models/enums";
import { useParams, useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import useGetCentre from "@/hooks/centre/use-get-centre";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
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
  Filter,
  PhoneOff,
  Stethoscope,
  Eye,
  XCircle,
  Download,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportCentreDetailToExcel } from "@/lib/export-centre-detail-excel";

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

  // Filter states
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectedAudiologistId, setSelectedAudiologistId] = useState<string>("");
  const [showMissedCallsOnly, setShowMissedCallsOnly] = useState<boolean>(false);
  const today = new Date();
  const yesterday = subDays(today, 1);

  const { data: audiologists } = useGetAllAudiologists();

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

  // Get unique audiologists from consultations
  const availableAudiologists = useMemo(() => {
    const audiologistMap = new Map<string, { id: string; name: string }>();
    centreConsultations.forEach(c => {
      const audiologistId = c.audiologist?.userId;
      const audiologistName = c.audiologist?.user?.name || "Unassigned";
      if (audiologistId && !audiologistMap.has(audiologistId)) {
        audiologistMap.set(audiologistId, { id: audiologistId, name: audiologistName });
      }
    });
    return Array.from(audiologistMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [centreConsultations]);

  // Filter consultations by date range, audiologist, and missed calls
  const filteredConsultations = useMemo(() => {
    let filtered = [...centreConsultations];

    // Filter by date range
    if (fromDate || toDate) {
      filtered = filtered.filter((c) => {
        if (!c.createdAt) return false;
        const consultationDate = new Date(c.createdAt);
        
        if (fromDate && !toDate) {
          return consultationDate >= startOfDay(fromDate);
        }
        if (!fromDate && toDate) {
          return consultationDate <= endOfDay(toDate);
        }
        if (fromDate && toDate) {
          return consultationDate >= startOfDay(fromDate) && consultationDate <= endOfDay(toDate);
        }
        return true;
      });
    }

    // Filter by audiologist
    if (selectedAudiologistId) {
      filtered = filtered.filter((c) => c.audiologist?.userId === selectedAudiologistId);
    }

    // Filter by missed calls (consultations without audiologist assigned)
    if (showMissedCallsOnly) {
      filtered = filtered.filter((c) => !c.audiologist?.user?.name);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [centreConsultations, fromDate, toDate, selectedAudiologistId, showMissedCallsOnly]);

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
    const missedCalls = filteredConsultations.filter(
      (c) => !c.audiologist?.user?.name
    ).length;

    // Test counts - consultations that have each test done (completed or in progress)
    const hasTestDone = (t: unknown) => {
      const s = (t as { status?: string })?.status;
      return s === TestStatus.COMPLETED || s === TestStatus.IN_PROGRESS;
    };
    const ptaCount = filteredConsultations.filter((c) => c.audiometry && hasTestDone(c.audiometry)).length;
    const tympanometryCount = filteredConsultations.filter((c) => c.tympanometry && hasTestDone(c.tympanometry)).length;
    const oaeCount = filteredConsultations.filter((c) => c.oae && hasTestDone(c.oae)).length;
    const otoscopyCount = filteredConsultations.filter((c) => c.otoscopy && hasTestDone(c.otoscopy)).length;
    const etfCount = filteredConsultations.filter((c) => c.etfIntact != null).length;
    const toneDecayCount = filteredConsultations.filter((c) => c.toneDecay && hasTestDone(c.toneDecay)).length;
    const reflexometryCount = filteredConsultations.filter((c) => c.reflexometry != null).length;

    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      missedCalls,
      ptaCount,
      tympanometryCount,
      oaeCount,
      otoscopyCount,
      etfCount,
      toneDecayCount,
      reflexometryCount,
    };
  }, [filteredConsultations]);

  // Clear all filters
  const clearAllFilters = () => {
    setFromDate(null);
    setToDate(null);
    setSelectedAudiologistId("");
    setShowMissedCallsOnly(false);
  };

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

  // Format the date range for display
  const getDateDisplayText = () => {
    if (!fromDate && !toDate) return "All Time";
    if (fromDate && !toDate) return `From ${format(fromDate, "dd MMM yyyy")}`;
    if (!fromDate && toDate) return `Until ${format(toDate, "dd MMM yyyy")}`;
    if (fromDate && toDate) {
      if (isSameDay(fromDate, toDate)) {
        return format(fromDate, "dd MMM yyyy");
      }
      return `${format(fromDate, "dd MMM yyyy")} - ${format(toDate, "dd MMM yyyy")}`;
    }
    return "All Time";
  };

  // Build export data for a given date range (for this centre only)
  // When useFilteredConsultations is true, uses filteredConsultations (respects all filters)
  const buildExportData = (
    exportFrom: Date | null,
    exportTo: Date | null,
    useFilteredConsultations = false
  ) => {
    let consults = useFilteredConsultations
      ? [...filteredConsultations]
      : [...centreConsultations];
    if (!useFilteredConsultations && (exportFrom || exportTo)) {
      consults = consults.filter((c) => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        if (!exportFrom && !exportTo) return true;
        if (exportFrom && !exportTo) return d >= startOfDay(exportFrom);
        if (!exportFrom && exportTo) return d <= endOfDay(exportTo);
        return d >= startOfDay(exportFrom!) && d <= endOfDay(exportTo!);
      });
    }
    const hasTestDone = (t: unknown) => {
      const s = (t as { status?: string })?.status;
      return s === TestStatus.COMPLETED || s === TestStatus.IN_PROGRESS;
    };
    const getTests = (c: ConsultationModelData) => {
      const tests: string[] = [];
      if (c.audiometry && hasTestDone(c.audiometry)) tests.push("PTA");
      if (c.tympanometry && hasTestDone(c.tympanometry)) tests.push("Tympanometry");
      if (c.oae && hasTestDone(c.oae)) tests.push("OAE");
      if (c.etfIntact != null) tests.push("ETF");
      if (c.otoscopy && hasTestDone(c.otoscopy)) tests.push("Otoscopy");
      if (c.toneDecay && hasTestDone(c.toneDecay)) tests.push("Tone Decay");
      if (c.reflexometry != null) tests.push("Reflexometry");
      return tests.join("; ");
    };
    return {
      centreInfo: {
        name: centreData?.user?.name || centreData?.entName || "Unknown Centre",
        code: centreData?.code || "N/A",
        deviceCode: centreData?.device?.code || "N/A",
        location: centreData?.city?.name || "Unknown",
        contact: centreData?.contactNumber || "N/A",
        entName: centreData?.entName || "N/A",
        assistant: centreData?.assistantName || "N/A",
      },
      stats: {
        total: consults.length,
        completed: consults.filter((c) => c.status === SessionStatus.COMPLETED).length,
        inProgress: consults.filter((c) => c.status === SessionStatus.IN_PROGRESS).length,
        pending: consults.filter((c) => c.status === SessionStatus.PENDING).length,
        cancelled: consults.filter((c) => c.status === SessionStatus.CANCELLED).length,
        missedCalls: consults.filter((c) => !c.audiologist?.user?.name).length,
        pta: consults.filter((c) => c.audiometry && hasTestDone(c.audiometry)).length,
        tympanometry: consults.filter((c) => c.tympanometry && hasTestDone(c.tympanometry)).length,
        oae: consults.filter((c) => c.oae && hasTestDone(c.oae)).length,
        otoscopy: consults.filter((c) => c.otoscopy && hasTestDone(c.otoscopy)).length,
        etf: consults.filter((c) => c.etfIntact != null).length,
        toneDecay: consults.filter((c) => c.toneDecay && hasTestDone(c.toneDecay)).length,
        reflexometry: consults.filter((c) => c.reflexometry != null).length,
      },
      consultations: consults.map((c) => ({
        patient: c.patient?.name || "Unknown",
        contact: c.patient?.contactNumber || "N/A",
        audiologist: c.audiologist?.user?.name || "Not Assigned",
        status: c.status || "N/A",
        dateTime: c.createdAt ? format(new Date(c.createdAt), "dd MMM yyyy, HH:mm") : "N/A",
        tests: getTests(c),
      })),
    };
  };

  const handleExportExcel = (
    exportFrom: Date | null,
    exportTo: Date | null,
    label: string,
    useFilteredConsultations = false
  ) => {
    const data = buildExportData(
      exportFrom,
      exportTo,
      useFilteredConsultations
    );
    const centreName = centreData?.user?.name || centreId;
    exportCentreDetailToExcel(data, centreName, label);
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportExcel(fromDate, toDate, "current-filters", true)}>
                    Current filters
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportExcel(today, today, "today")}>
                    Today
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportExcel(yesterday, yesterday, "yesterday")}>
                    Yesterday
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportExcel(subDays(today, 7), today, "last-7-days")}>
                    Last 7 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportExcel(subDays(today, 30), today, "last-30-days")}>
                    Last 30 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportExcel(null, null, "all-time")}>
                    All Time
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="mb-6 border-2 border-primary-200 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              {(fromDate || toDate || selectedAudiologistId || showMissedCallsOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="ml-auto text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range - From */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {fromDate ? format(fromDate, "dd MMM yyyy") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate || undefined}
                      onSelect={(date) => {
                        setFromDate(date || null);
                        if (date && toDate && date > toDate) {
                          setToDate(date);
                        }
                      }}
                      initialFocus
                      disabled={(date) => toDate ? date > toDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range - To */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {toDate ? format(toDate, "dd MMM yyyy") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate || undefined}
                      onSelect={(date) => {
                        setToDate(date || null);
                        if (date && fromDate && date < fromDate) {
                          setFromDate(date);
                        }
                      }}
                      initialFocus
                      disabled={(date) => fromDate ? date < fromDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quick Date Buttons */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quick Select
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFromDate(today);
                      setToDate(today);
                    }}
                    className={`${
                      fromDate && toDate && isSameDay(fromDate, today) && isSameDay(toDate, today)
                        ? "bg-primary-600 text-white"
                        : ""
                    }`}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const weekAgo = subDays(today, 7);
                      setFromDate(weekAgo);
                      setToDate(today);
                    }}
                  >
                    7 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const monthAgo = subDays(today, 30);
                      setFromDate(monthAgo);
                      setToDate(today);
                    }}
                  >
                    30 Days
                  </Button>
                </div>
              </div>

              {/* Audiologist Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filter by Audiologist
                </label>
                <div className="flex gap-2">
                  <Select
                    value={selectedAudiologistId || undefined}
                    onValueChange={(value) => setSelectedAudiologistId(value || "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Audiologists" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAudiologists.map((audiologist) => (
                        <SelectItem key={audiologist.id} value={audiologist.id}>
                          {audiologist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAudiologistId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAudiologistId("")}
                      className="px-3"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Missed Calls Filter */}
            <div className="mt-4 pt-4 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMissedCallsOnly}
                  onChange={(e) => setShowMissedCallsOnly(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <PhoneOff className="w-4 h-4 text-red-600" />
                  Show only missed calls (no audiologist assigned)
                </span>
              </label>
            </div>

            {/* Active Filters Display */}
            {(fromDate || toDate || selectedAudiologistId || showMissedCallsOnly) && (
              <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-900">
                  <span className="font-semibold">Active filters:</span>{" "}
                  {getDateDisplayText()}
                  {selectedAudiologistId && ` • Audiologist: ${availableAudiologists.find(a => a.id === selectedAudiologistId)?.name || "Selected"}`}
                  {showMissedCallsOnly && " • Missed Calls Only"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <PhoneOff className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missed Calls</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.missedCalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests Done */}
        <Card className="mb-6 border-2 border-primary-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary-700">
              <Stethoscope className="w-5 h-5" />
              Tests Done
            </CardTitle>
            <p className="text-sm text-gray-500 font-normal mt-1">
              Number of consultations for this centre that have each test type
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="p-5 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">PTA</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{stats.ptaCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Pure Tone Audiometry</p>
              </div>
              <div className="p-5 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Tympanometry</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.tympanometryCount}</p>
              </div>
              <div className="p-5 rounded-lg bg-violet-50 border border-violet-200">
                <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">OAE</p>
                <p className="text-2xl font-bold text-violet-700 mt-1">{stats.oaeCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Otoacoustic Emissions</p>
              </div>
              <div className="p-5 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Otoscopy</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{stats.otoscopyCount}</p>
              </div>
              <div className="p-5 rounded-lg bg-cyan-50 border border-cyan-200">
                <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide">ETF</p>
                <p className="text-2xl font-bold text-cyan-700 mt-1">{stats.etfCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">ETF Intact</p>
              </div>
              <div className="p-5 rounded-lg bg-rose-50 border border-rose-200">
                <p className="text-xs font-medium text-rose-600 uppercase tracking-wide">Tone Decay</p>
                <p className="text-2xl font-bold text-rose-700 mt-1">{stats.toneDecayCount}</p>
              </div>
              <div className="p-5 rounded-lg bg-teal-50 border border-teal-200">
                <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Reflexometry</p>
                <p className="text-2xl font-bold text-teal-700 mt-1">{stats.reflexometryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consultations Table */}
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
                  {(fromDate || toDate || selectedAudiologistId || showMissedCallsOnly)
                    ? "Try adjusting your filters"
                    : "Consultations will appear here once they are created"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold">Patient</TableHead>
                      <TableHead className="font-bold">Contact</TableHead>
                      <TableHead className="font-bold">Audiologist</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Date & Time</TableHead>
                      <TableHead className="font-bold">Tests</TableHead>
                      <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConsultations.map((consultation) => (
                      <TableRow
                        key={consultation.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/consultation-details/${consultation.id}`)}
                      >
                        <TableCell className="font-semibold">
                          {consultation.patient?.name || "Unknown Patient"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {consultation.patient?.contactNumber || "N/A"}
                        </TableCell>
                        <TableCell>
                          {consultation.audiologist?.user?.name ? (
                            <span className="text-sm text-gray-700">
                              {consultation.audiologist.user.name}
                            </span>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-300">
                              <PhoneOff className="w-3 h-3 mr-1" />
                              Not Assigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(consultation.status as SessionStatus)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {consultation.createdAt
                            ? format(new Date(consultation.createdAt), "dd MMM yyyy, HH:mm")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {consultation.audiometry && (
                              <Badge variant="outline" className="text-xs">PTA</Badge>
                            )}
                            {consultation.tympanometry && (
                              <Badge variant="outline" className="text-xs">Tympano</Badge>
                            )}
                            {consultation.oae && (
                              <Badge variant="outline" className="text-xs">OAE</Badge>
                            )}
                            {consultation.etfIntact && (
                              <Badge variant="outline" className="text-xs">ETF</Badge>
                            )}
                            {consultation.otoscopy && (
                              <Badge variant="outline" className="text-xs">Otoscopy</Badge>
                            )}
                            {!consultation.audiometry && !consultation.tympanometry && 
                             !consultation.oae && !consultation.etfIntact && !consultation.otoscopy && (
                              <span className="text-xs text-gray-400">No tests</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/consultation-details/${consultation.id}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardBodyWrapper>
  );
}

