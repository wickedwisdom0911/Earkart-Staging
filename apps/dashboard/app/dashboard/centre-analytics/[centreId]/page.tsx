"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { SessionStatus, Role, TestStatus } from "@/models/enums";
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
  PhoneOff,
  Stethoscope,
  Search,
  ChevronRight,
  Download,
  ChevronLeft,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportCentreDetailToExcel } from "@/lib/export-centre-detail-excel";

const PAGE_SIZE = 10;

type DateFilter = "all" | "today" | "7days" | "30days" | "custom";

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

  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  if (!isAdmin && user) {
    router.push("/dashboard");
    return null;
  }

  // Filter states
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilter>("30days");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAudiologistId, setSelectedAudiologistId] = useState<string>("");
  const [showMissedCallsOnly, setShowMissedCallsOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const today = new Date();
  const yesterday = subDays(today, 1);

  const centreData = useMemo(() => {
    if (!centre?.data) return null;
    return centre.data;
  }, [centre]);

  const centreConsultations = useMemo(() => {
    if (!consultations?.data) return [];
    const consultationsArray = extractConsultations(consultations.data);
    return consultationsArray.filter((c) => c.centre?.id === centreId);
  }, [consultations, centreId]);

  const availableAudiologists = useMemo(() => {
    const audiologistMap = new Map<string, { id: string; name: string }>();
    centreConsultations.forEach((c) => {
      const audiologistId = c.audiologist?.userId;
      const audiologistName = c.audiologist?.user?.name || "Unassigned";
      if (audiologistId && !audiologistMap.has(audiologistId)) {
        audiologistMap.set(audiologistId, { id: audiologistId, name: audiologistName });
      }
    });
    return Array.from(audiologistMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [centreConsultations]);

  const getDateRangeForFilter = (filter: DateFilter): { from: Date | null; to: Date | null } => {
    switch (filter) {
      case "today":
        return { from: today, to: today };
      case "7days":
        return { from: subDays(today, 7), to: today };
      case "30days":
        return { from: subDays(today, 30), to: today };
      case "custom":
        return { from: fromDate, to: toDate };
      default:
        return { from: null, to: null };
    }
  };

  const filteredConsultations = useMemo(() => {
    let filtered = [...centreConsultations];

    const { from, to } = getDateRangeForFilter(activeDateFilter);

    if (from || to) {
      filtered = filtered.filter((c) => {
        if (!c.createdAt) return false;
        const consultationDate = new Date(c.createdAt);
        if (from && !to) return consultationDate >= startOfDay(from);
        if (!from && to) return consultationDate <= endOfDay(to);
        if (from && to) return consultationDate >= startOfDay(from) && consultationDate <= endOfDay(to);
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.patient?.name?.toLowerCase().includes(q) ||
          c.patient?.contactNumber?.includes(q)
      );
    }

    if (selectedAudiologistId) {
      filtered = filtered.filter((c) => c.audiologist?.userId === selectedAudiologistId);
    }

    if (showMissedCallsOnly) {
      filtered = filtered.filter((c) => !c.audiologist?.user?.name);
    }

    return filtered.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [centreConsultations, activeDateFilter, fromDate, toDate, searchQuery, selectedAudiologistId, showMissedCallsOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredConsultations.length / PAGE_SIZE) || 1;
  const paginatedConsultations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredConsultations.slice(start, start + PAGE_SIZE);
  }, [filteredConsultations, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeDateFilter, selectedAudiologistId, showMissedCallsOnly]);

  const stats = useMemo(() => {
    const total = filteredConsultations.length;
    const completed = filteredConsultations.filter((c) => c.status === SessionStatus.COMPLETED).length;
    const inProgress = filteredConsultations.filter((c) => c.status === SessionStatus.IN_PROGRESS).length;
    const pending = filteredConsultations.filter((c) => c.status === SessionStatus.PENDING).length;
    const cancelled = filteredConsultations.filter((c) => c.status === SessionStatus.CANCELLED).length;
    const missedCalls = filteredConsultations.filter((c) => !c.audiologist?.user?.name).length;

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

    return { total, completed, inProgress, pending, cancelled, missedCalls, ptaCount, tympanometryCount, oaeCount, otoscopyCount, etfCount, toneDecayCount, reflexometryCount };
  }, [filteredConsultations]);

  const clearAllFilters = () => {
    setFromDate(null);
    setToDate(null);
    setActiveDateFilter("all");
    setSearchQuery("");
    setSelectedAudiologistId("");
    setShowMissedCallsOnly(false);
    setCurrentPage(1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-purple-100 text-purple-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-cyan-100 text-cyan-700",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.COMPLETED:
        return (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "#2BAB6F1A", color: "#2BAB6F" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case SessionStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
            <PlayCircle className="w-3.5 h-3.5" />
            In Progress
          </span>
        );
      case SessionStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case SessionStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const buildExportData = (
    exportFrom: Date | null,
    exportTo: Date | null,
    useFilteredConsultations = false
  ) => {
    let consults = useFilteredConsultations ? [...filteredConsultations] : [...centreConsultations];
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
    const data = buildExportData(exportFrom, exportTo, useFilteredConsultations);
    const centreName = centreData?.user?.name || centreId;
    exportCentreDetailToExcel(data, centreName, label);
  };

  const { from: activeFrom, to: activeTo } = getDateRangeForFilter(activeDateFilter);

  if (consultationsLoading || centreLoading) {
    return (
      <DashboardBodyWrapper className="!bg-[#EEF4F9] !gap-0 !p-0 !border-0 !rounded-none">
        <div className="flex items-center justify-center h-screen w-full bg-[#EEF4F9]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#40A3DB]"></div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  return (
    <DashboardBodyWrapper className="!bg-[#EEF4F9] !gap-0 !p-0 !border-0 !rounded-none">
      <div className="min-h-screen w-full h-full bg-[#EEF4F9] p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
          <button
            onClick={() => router.push("/dashboard")}
            className="hover:text-gray-700 transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => router.push("/dashboard/centre-analytics")}
            className="hover:text-gray-700 transition-colors"
          >
            Centres
          </button>
        </div>

        {/* Back link */}
        <button
          onClick={() => router.push("/dashboard/centre-analytics")}
          className="flex items-center gap-1.5 text-sm text-[#40A3DB] hover:text-[#3592c7] mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Centres
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-[#E1E6EA] p-5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#EBF6FD] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-[#40A3DB]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {centreData?.user?.name || centreData?.entName || "Unknown Centre"}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                {centreData?.city?.name && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {centreData.city.name}
                  </span>
                )}
                {centreData?.contactNumber && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    {centreData.contactNumber}
                  </span>
                )}
                {centreData?.assistantName && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <User className="w-3.5 h-3.5" />
                    {centreData.assistantName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#40A3DB] hover:bg-[#3592c7] text-white text-sm font-medium rounded-xl transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleExportExcel(activeFrom, activeTo, "current-filters", true)}>
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

        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {[
            { icon: <PlayCircle className="w-4 h-4 text-gray-400" />, count: stats.total, label: "TOTAL" },
            { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, count: stats.completed, label: "COMPLETED" },
            { icon: <PlayCircle className="w-4 h-4 text-blue-400" />, count: stats.inProgress, label: "IN PROGRESS" },
            { icon: <Clock className="w-4 h-4 text-amber-400" />, count: stats.pending, label: "PENDING" },
            { icon: <AlertCircle className="w-4 h-4 text-red-400" />, count: stats.cancelled, label: "CANCELLED" },
            { icon: <PhoneOff className="w-4 h-4 text-orange-400" />, count: stats.missedCalls, label: "MISSED" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 bg-white rounded-xl border border-[#E1E6EA] px-4 py-3">
              {stat.icon}
              <span className="text-xl font-bold text-gray-900">{stat.count}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Tests Performed */}
        <div className="bg-white rounded-2xl border border-[#E1E6EA] px-5 py-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Tests Performed</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "PTA", count: stats.ptaCount, color: "bg-[#EBF6FD] text-[#40A3DB]" },
              { label: "Tympanometry", count: stats.tympanometryCount, color: "bg-emerald-50 text-emerald-600" },
              { label: "OAE", count: stats.oaeCount, color: "bg-violet-50 text-violet-600" },
              { label: "Otoscopy", count: stats.otoscopyCount, color: "bg-amber-50 text-amber-600" },
              { label: "ETF", count: stats.etfCount, color: "bg-cyan-50 text-cyan-600" },
              { label: "Tone Decay", count: stats.toneDecayCount, color: "bg-rose-50 text-rose-600" },
              { label: "Reflexometry", count: stats.reflexometryCount, color: "bg-teal-50 text-teal-600" },
            ].map((test) => (
              <div
                key={test.label}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${test.color}`}
              >
                <span className="font-bold">{test.count}</span>
                <span>{test.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Consultations Card */}
        <div className="bg-white rounded-2xl border border-[#E1E6EA] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E1E6EA]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-gray-900">Consultations</span>
              <span className="text-sm text-gray-500">{filteredConsultations.length} records</span>
            </div>

            {/* Search + Date Filters Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-[#E1E6EA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#40A3DB]/20 focus:border-[#40A3DB] transition-all"
                />
              </div>

              {/* Date filter tabs */}
              <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-[#E1E6EA]">
                {(["all", "today", "7days", "30days"] as DateFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveDateFilter(filter)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      activeDateFilter === filter
                        ? "bg-[#40A3DB] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {filter === "all" ? "All" : filter === "today" ? "Today" : filter === "7days" ? "7 Days" : "30 Days"}
                  </button>
                ))}

                {/* Custom Range */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      onClick={() => setActiveDateFilter("custom")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        activeDateFilter === "custom"
                          ? "bg-[#40A3DB] text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Custom Range
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">From</p>
                        <Calendar
                          mode="single"
                          selected={fromDate || undefined}
                          onSelect={(date) => {
                            setFromDate(date || null);
                            if (date && toDate && date > toDate) setToDate(date);
                          }}
                          initialFocus
                          disabled={(date) => (toDate ? date > toDate : false)}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">To</p>
                        <Calendar
                          mode="single"
                          selected={toDate || undefined}
                          onSelect={(date) => {
                            setToDate(date || null);
                            if (date && fromDate && date < fromDate) setFromDate(date);
                          }}
                          initialFocus
                          disabled={(date) => (fromDate ? date < fromDate : false)}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Audiologist Filter */}
              <Select
                value={selectedAudiologistId || "all"}
                onValueChange={(v) => setSelectedAudiologistId(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[180px] border-[#E1E6EA] rounded-xl">
                  <SelectValue placeholder="All Audiologists" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiologists</SelectItem>
                  {availableAudiologists.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Missed Calls Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showMissedCallsOnly}
                  onChange={(e) => setShowMissedCallsOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E1E6EA] text-[#40A3DB] focus:ring-[#40A3DB]"
                />
                <span>Missed calls only</span>
              </label>

              {/* Clear filters */}
              {(searchQuery || activeDateFilter !== "all" || selectedAudiologistId || showMissedCallsOnly) && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Consultation List */}
          <div>
            {filteredConsultations.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No consultations found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchQuery || activeDateFilter !== "all" || selectedAudiologistId || showMissedCallsOnly
                    ? "Try adjusting your filters"
                    : "Consultations will appear here once they are created"}
                </p>
              </div>
            ) : (
              <>
                {paginatedConsultations.map((consultation, index) => {
                  const patientName = consultation.patient?.name || "Unknown Patient";
                  const initials = getInitials(patientName);
                  const avatarColor = getAvatarColor(patientName);
                  const hasAudiologist = !!consultation.audiologist?.user?.name;

                  const hasTestDone = (t: unknown) => {
                    const s = (t as { status?: string })?.status;
                    return s === TestStatus.COMPLETED || s === TestStatus.IN_PROGRESS;
                  };
                  const tests: string[] = [];
                  if (consultation.audiometry && hasTestDone(consultation.audiometry)) tests.push("PTA");
                  if (consultation.tympanometry && hasTestDone(consultation.tympanometry)) tests.push("Tympano");
                  if (consultation.oae && hasTestDone(consultation.oae)) tests.push("OAE");
                  if (consultation.etfIntact != null) tests.push("ETF");
                  if (consultation.otoscopy && hasTestDone(consultation.otoscopy)) tests.push("Otoscopy");

                  return (
                    <div
                      key={consultation.id}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50/70 cursor-pointer transition-colors ${
                        index < paginatedConsultations.length - 1 ? "border-b border-[#E1E6EA]" : ""
                      }`}
                      onClick={() => router.push(`/dashboard/consultation-details/${consultation.id}`)}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarColor}`}
                      >
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900">{patientName}</span>
                          {getStatusBadge(consultation.status as SessionStatus)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{consultation.patient?.contactNumber || "N/A"}</span>
                          {consultation.createdAt && (
                            <>
                              <span>·</span>
                              <span>{format(new Date(consultation.createdAt), "dd MMM yyyy, HH:mm")}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {hasAudiologist ? (
                            <span>Audiologist: {consultation.audiologist!.user!.name}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                              <PhoneOff className="w-3 h-3" />
                              Not Assigned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Test Badges */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {tests.length > 0 ? (
                          tests.map((test) => (
                            <span
                              key={test}
                              className="px-2.5 py-1 text-xs font-medium bg-[#EBF6FD] text-[#40A3DB] rounded-lg border border-[#D0EAF8]"
                            >
                              {test}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No tests</span>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-[#E1E6EA] bg-gray-50/50">
                    <p className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                      {Math.min(currentPage * PAGE_SIZE, filteredConsultations.length)} of{" "}
                      {filteredConsultations.length} consultations
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E1E6EA] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <span className="text-sm text-gray-600 px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E1E6EA] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}
