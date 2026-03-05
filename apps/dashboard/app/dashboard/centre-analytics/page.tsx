"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isSameDay, subDays, startOfDay, endOfDay } from "date-fns";
import { SessionStatus, Role, TestStatus } from "@/models/enums";
import { useRouter } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import {
  CheckCircle2,
  Building2,
  Calendar as CalendarIcon,
  Eye,
  Phone,
  Activity,
  FileText,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportCentreAnalyticsToExcel } from "@/lib/export-centre-analytics-excel";

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
}) {
  const colors = {
    blue: { text: "#3b82f6", bg: "#eff6ff", icon: "#3b82f6" },
    green: { text: "#22c55e", bg: "#f0fdf4", icon: "#22c55e" },
    purple: { text: "#8b5cf6", bg: "#f5f3ff", icon: "#8b5cf6" },
    orange: { text: "#f97316", bg: "#fff7ed", icon: "#f97316" },
    red: { text: "#ef4444", bg: "#fef2f2", icon: "#ef4444" },
    cyan: { text: "#06b6d4", bg: "#ecfeff", icon: "#06b6d4" },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm min-w-[120px] flex-1">
      <div className="flex items-center justify-center rounded-lg p-2" style={{ background: c.bg }}>
        <Icon size={16} color={c.icon} />
      </div>
      <div>
        <div className="text-[11px] text-gray-500 mb-0.5">{label}</div>
        <div className="text-xl font-bold" style={{ color: c.text }}>
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// ── Centre Row (expandable) ─────────────────────────────────────────────────────
function CentreRow({
  data,
  onView,
}: {
  data: {
    centreId: string;
    name: string;
    location: string;
    contactNumber: string;
    entName: string;
    assistantName: string;
    isOurAssistant: string;
    filteredConsultations: number;
    completed: number;
    pending: number;
    ptaCount: number;
    tympanometryCount: number;
    oaeCount: number;
    etfCount: number;
    toneDecayCount: number;
  };
  onView: (centreId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const s = {
    total: data.filteredConsultations,
    completed: data.completed,
    pending: data.pending,
    pta: data.ptaCount,
    tympano: data.tympanometryCount,
    oae: data.oaeCount,
    etf: data.etfCount,
    toneDecay: data.toneDecayCount,
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div
        className="grid items-center gap-2 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
        style={{
          gridTemplateColumns: "32px 1fr 1fr 1fr 1fr 1fr 80px 36px",
          background: expanded ? "#fafafa" : "#fff",
          borderBottom: expanded ? "1px solid #f3f4f6" : "none",
        }}
        onClick={() => onView(data.centreId)}
      >
        <div
          className="text-gray-400 hover:text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Centre Name</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{data.name}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Location</div>
          <div className="text-sm text-gray-700 truncate">{data.location}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Contact</div>
          <div className="text-sm text-gray-700">{data.contactNumber}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">ENT Name</div>
          <div className="text-sm text-gray-700 truncate">{data.entName}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Assistant</div>
          <div className="text-sm text-gray-700 truncate">{data.assistantName}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">Our Assistant</div>
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${
              data.isOurAssistant === "Yes" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {data.isOurAssistant}
          </span>
        </div>
        <button
          type="button"
          className="flex items-center justify-center p-1.5 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onView(data.centreId);
          }}
        >
          <Eye size={14} className="text-gray-500" />
        </button>
      </div>
      {expanded && (
        <div
          className="grid items-center gap-2 px-4 py-2.5 bg-white"
          style={{ gridTemplateColumns: "32px repeat(8, 1fr)" }}
        >
          <div />
          {[
            { label: "Total", value: s.total, color: "#3b82f6" },
            { label: "Completed", value: s.completed, color: "#22c55e" },
            { label: "Pending", value: s.pending, color: "#f97316" },
            { label: "PTA", value: s.pta, color: "#f97316" },
            { label: "Tympano", value: s.tympano, color: "#06b6d4" },
            { label: "OAE", value: s.oae, color: "#ec4899" },
            { label: "ETF", value: s.etf, color: "#6366f1" },
            { label: "Tone Decay", value: s.toneDecay, color: "#a855f7" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-[10px] text-gray-400 mb-1">{label}</div>
              <div className="text-[15px] font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CentreAnalyticsPage() {
  const router = useRouter();
  const { data: user } = useGetUser();

  const {
    data: consultations,
    isLoading: consultationsLoading,
    isError,
    error,
  } = useGetAllConsultations({
    staleTime: 60_000, // Cache for 1 min - avoid refetch on every visit
  });
  const { data: centres, isLoading: centresLoading } = useGetAllCentres();

  // Progressive loading: show UI when centres are ready, don't block on consultations
  const isLoading = centresLoading;

  // Role checks - only admin and super_admin can access
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  // Redirect if not admin
  if (!isAdmin && user) {
    router.push("/dashboard");
    return null;
  }

  // Date range filter state
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const today = new Date();
  const yesterday = subDays(today, 1);

  // Preset filter label
  const [activeFilter, setActiveFilter] = useState<string>("All Time");
  const filters = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days"];

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);


  // Filter consultations by date range (from/to dates)
  // Only show consultations that have a centre assigned
  const filteredConsultations = useMemo(() => {
    if (!consultations?.data) return [];

    return consultations.data.filter((c) => {
      // Only show consultations with centre assigned
      if (!c.centre || !c.centre.id) return false;
      if (!c.createdAt) return false;
      
      const consultationDate = new Date(c.createdAt);
      
      // If no date filters are set, show all consultations
      if (!fromDate && !toDate) {
        return true;
      }
      
      // If only fromDate is set, filter from that date onwards
      if (fromDate && !toDate) {
        return consultationDate >= startOfDay(fromDate);
      }
      
      // If only toDate is set, filter up to that date
      if (!fromDate && toDate) {
        return consultationDate <= endOfDay(toDate);
      }
      
      // If both dates are set, filter within the range
      if (fromDate && toDate) {
        return consultationDate >= startOfDay(fromDate) && consultationDate <= endOfDay(toDate);
      }
      
      return true;
    });
  }, [consultations, fromDate, toDate]);

  // Group all consultations by centre for the details modal
  // Only include consultations that have a centre assigned
  const consultationsByCentre = useMemo(() => {
    if (!consultations?.data) return new Map();
    
    const consultationsArray = extractConsultations(consultations.data);
    const map = new Map<string, ConsultationModelData[]>();
    
    consultationsArray.forEach((c) => {
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

  // Get comprehensive centre stats with test counts
  const allCentreTableData = useMemo(() => {
    if (!centres?.data?.data || !Array.isArray(centres.data.data)) return [];

    return centres.data.data.map((centre: any) => {
      const centreId = centre.id;
      
      // Get ALL consultations for this centre (for total count)
      const allCentreConsultations = consultationsByCentre.get(centreId) || [];
      
      // Get filtered consultations for the selected date range
      const filteredConsultationsForCentre = filteredConsultations.filter(
        (c) => c.centre?.id === centreId
      );

      // Count by status (for date range filtered consultations)
      const completed = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.COMPLETED
      ).length;
      const inProgress = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.IN_PROGRESS
      ).length;
      const pending = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.PENDING
      ).length;
      const failed = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.FAILED
      ).length;
      const cancelled = filteredConsultationsForCentre.filter(
        (c) => c.status === SessionStatus.CANCELLED
      ).length;

      // Count tests - check if test exists and has data (for date range filtered consultations)
      const ptaCount = filteredConsultationsForCentre.filter(
        (c) => c.audiometry && (c.audiometry.status === TestStatus.COMPLETED || c.audiometry.status === TestStatus.IN_PROGRESS)
      ).length;
      
      const tympanometryCount = filteredConsultationsForCentre.filter(
        (c) => c.tympanometry && (c.tympanometry.status === TestStatus.COMPLETED || c.tympanometry.status === TestStatus.IN_PROGRESS)
      ).length;
      
      const oaeCount = filteredConsultationsForCentre.filter(
        (c) => c.oae && (c.oae.status === TestStatus.COMPLETED || c.oae.status === TestStatus.IN_PROGRESS)
      ).length;
      
      const etfCount = filteredConsultationsForCentre.filter(
        (c) => c.etfIntact && c.etfIntact !== null
      ).length;
      
      const toneDecayCount = filteredConsultationsForCentre.filter(
        (c) => c.toneDecay && (c.toneDecay.status === TestStatus.COMPLETED || c.toneDecay.status === TestStatus.IN_PROGRESS)
      ).length;
      
      const reflexometryCount = filteredConsultationsForCentre.filter(
        (c) => c.reflexometry !== null && c.reflexometry !== undefined
      ).length;
      
      const otoscopyCount = filteredConsultationsForCentre.filter(
        (c) => c.otoscopy && (c.otoscopy.status === TestStatus.COMPLETED || c.otoscopy.status === TestStatus.IN_PROGRESS)
      ).length;

      return {
        centre,
        centreId,
        name: centre.user?.name || centre.entName || "Unknown Centre",
        code: centre.code || "N/A",
        location: centre.city?.name || "Unknown",
        address: centre.address || "N/A",
        contactNumber: centre.contactNumber || "N/A",
        entName: centre.entName || "N/A",
        assistantName: centre.assistantName || "N/A",
        assistantContact: centre.assistantContactNumber || "N/A",
        isOurAssistant: centre.isOurAssistant ? "Yes" : "No",
        deviceCode: centre.device?.code || "N/A",
        totalConsultations: allCentreConsultations.length, // All time total
        filteredConsultations: filteredConsultationsForCentre.length, // Date range filtered count
        completed,
        inProgress,
        pending,
        failed,
        cancelled,
        ptaCount,
        tympanometryCount,
        oaeCount,
        etfCount,
        toneDecayCount,
        reflexometryCount,
        otoscopyCount,
        allConsultations: allCentreConsultations,
      };
    });
  }, [centres, filteredConsultations, consultationsByCentre]);
  
  // Search filter for centres
  const searchFilteredData = useMemo(() => {
    if (!searchQuery.trim()) return allCentreTableData;
    const q = searchQuery.toLowerCase().trim();
    return allCentreTableData.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        d.entName.toLowerCase().includes(q) ||
        d.assistantName.toLowerCase().includes(q) ||
        d.contactNumber.includes(q)
    );
  }, [allCentreTableData, searchQuery]);

  // Pagination
  const totalCentres = searchFilteredData.length;
  const totalPages = Math.ceil(totalCentres / limit) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const centreTableData = searchFilteredData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, searchQuery]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  // Calculate summary stats (using ALL filtered data, not just paginated data)
  const summaryStats = useMemo(() => {
    const totalCentres = allCentreTableData.length;
    const activeCentres = allCentreTableData.filter((d) => d.filteredConsultations > 0).length;
    const totalConsultations = allCentreTableData.reduce((sum, d) => sum + d.filteredConsultations, 0);
    const totalCompleted = allCentreTableData.reduce((sum, d) => sum + d.completed, 0);
    const totalPTA = allCentreTableData.reduce((sum, d) => sum + d.ptaCount, 0);
    const totalTympanometry = allCentreTableData.reduce((sum, d) => sum + d.tympanometryCount, 0);
    const totalOAE = allCentreTableData.reduce((sum, d) => sum + d.oaeCount, 0);
    const totalETF = allCentreTableData.reduce((sum, d) => sum + d.etfCount, 0);

    return {
      totalCentres,
      activeCentres,
      totalConsultations,
      totalCompleted,
      totalPTA,
      totalTympanometry,
      totalOAE,
      totalETF,
    };
  }, [allCentreTableData]);

  // Build export data for a given date range
  const buildExportData = (exportFrom: Date | null, exportTo: Date | null) => {
    if (!consultations?.data || !centres?.data?.data) return [];
    const consultationsArray = extractConsultations(consultations.data);
    const filtered = consultationsArray.filter((c) => {
      if (!c.centre?.id) return false;
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      if (!exportFrom && !exportTo) return true;
      if (exportFrom && !exportTo) return d >= startOfDay(exportFrom);
      if (!exportFrom && exportTo) return d <= endOfDay(exportTo);
      return d >= startOfDay(exportFrom!) && d <= endOfDay(exportTo!);
    });
    return centres.data.data.map((centre: any) => {
      const centreId = centre.id;
      const centreFiltered = filtered.filter((c) => c.centre?.id === centreId);
      const allCentreConsultations = consultationsByCentre.get(centreId) || [];
      const hasTestDone = (t: unknown) => {
        const s = (t as { status?: string })?.status;
        return s === TestStatus.COMPLETED || s === TestStatus.IN_PROGRESS;
      };
      return {
        name: centre.user?.name || centre.entName || "Unknown Centre",
        code: centre.code || "N/A",
        location: centre.city?.name || "Unknown",
        contactNumber: centre.contactNumber || "N/A",
        entName: centre.entName || "N/A",
        assistantName: centre.assistantName || "N/A",
        isOurAssistant: centre.isOurAssistant ? "Yes" : "No",
        deviceCode: centre.device?.code || "N/A",
        totalConsultations: allCentreConsultations.length,
        filteredConsultations: centreFiltered.length,
        completed: centreFiltered.filter((c) => c.status === SessionStatus.COMPLETED).length,
        inProgress: centreFiltered.filter((c) => c.status === SessionStatus.IN_PROGRESS).length,
        pending: centreFiltered.filter((c) => c.status === SessionStatus.PENDING).length,
        failed: centreFiltered.filter((c) => c.status === SessionStatus.FAILED).length,
        cancelled: centreFiltered.filter((c) => c.status === SessionStatus.CANCELLED).length,
        ptaCount: centreFiltered.filter((c) => c.audiometry && hasTestDone(c.audiometry)).length,
        tympanometryCount: centreFiltered.filter((c) => c.tympanometry && hasTestDone(c.tympanometry)).length,
        oaeCount: centreFiltered.filter((c) => c.oae && hasTestDone(c.oae)).length,
        etfCount: centreFiltered.filter((c) => c.etfIntact != null).length,
        toneDecayCount: centreFiltered.filter((c) => c.toneDecay && hasTestDone(c.toneDecay)).length,
        reflexometryCount: centreFiltered.filter((c) => c.reflexometry != null).length,
        otoscopyCount: centreFiltered.filter((c) => c.otoscopy && hasTestDone(c.otoscopy)).length,
      };
    });
  };

  const handleExportExcel = (exportFrom: Date | null, exportTo: Date | null, label: string) => {
    const data = buildExportData(exportFrom, exportTo);
    const rows = data.map((d) => ({
      "Centre Name": d.name,
      Code: d.code,
      Location: d.location,
      Contact: d.contactNumber,
      "ENT Name": d.entName,
      Assistant: d.assistantName,
      "Our Assistant": d.isOurAssistant,
      "Device Code": d.deviceCode,
      "Total Consultations": d.totalConsultations,
      Completed: d.completed,
      "In Progress": d.inProgress,
      Pending: d.pending,
      Failed: d.failed,
      Cancelled: d.cancelled,
      PTA: d.ptaCount,
      Tympanometry: d.tympanometryCount,
      OAE: d.oaeCount,
      ETF: d.etfCount,
      "Tone Decay": d.toneDecayCount,
      Reflexometry: d.reflexometryCount,
      Otoscopy: d.otoscopyCount,
    }));
    exportCentreAnalyticsToExcel(rows, label);
  };

  // Handle navigation to centre details
  const handleViewCentre = (centreId: string) => {
    if (!centreId) {
      console.error("No centreId provided");
      return;
    }
    const path = `/dashboard/centre-analytics/${centreId}`;
    console.log("Navigating to:", path);
    router.push(path);
  };

  if (isLoading) {
    return (
      <DashboardBodyWrapper className="!bg-[#EEF4F9] !gap-0 !p-0 !border-0 !rounded-none">
        <div className="flex items-center justify-center h-screen bg-[#EEF4F9]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#40A3DB]"></div>
        </div>
      </DashboardBodyWrapper>
    );
  }

  if (isError) {
    return (
      <DashboardBodyWrapper className="!bg-[#EEF4F9] !gap-0 !p-0 !border-0 !rounded-none">
        <div className="p-6 bg-[#EEF4F9]">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            Error loading data: {error?.message || "Unknown error"}
          </div>
        </div>
      </DashboardBodyWrapper>
    );
  }

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

  const applyDatePreset = (preset: string) => {
    setActiveFilter(preset);
    if (preset === "Today") {
      setFromDate(today);
      setToDate(today);
    } else if (preset === "Yesterday") {
      setFromDate(yesterday);
      setToDate(yesterday);
    } else if (preset === "Last 7 Days") {
      setFromDate(subDays(today, 7));
      setToDate(today);
    } else if (preset === "Last 30 Days") {
      setFromDate(subDays(today, 30));
      setToDate(today);
    }
  };

  return (
    <DashboardBodyWrapper className="!bg-[#EEF4F9] !gap-0 !p-0 !border-0 !rounded-none">
      <div className="min-h-screen w-full h-full bg-[#EEF4F9] p-6 font-['DM_Sans',_'Segoe_UI',_sans-serif]">
        <div className="mb-5">
          <h1 className="text-[26px] font-bold text-gray-900 m-0">Centre Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Performance overview for {getDateDisplayText()}
            {consultationsLoading && (
              <span className="ml-2 text-blue-600 text-xs">(updating stats…)</span>
            )}
          </p>
        </div>

        <div className="flex gap-2.5 mb-5 flex-wrap">
          <StatCard label="Total Centres" value={summaryStats.totalCentres} icon={Building2} color="blue" />
          <StatCard label="Active" value={summaryStats.activeCentres} icon={Phone} color="green" />
          <StatCard label="Total" value={summaryStats.totalConsultations} icon={FileText} color="blue" />
          <StatCard label="Completed" value={summaryStats.totalCompleted} icon={CheckCircle2} color="purple" />
          <StatCard label="PTA" value={summaryStats.totalPTA} icon={Activity} color="red" />
          <StatCard label="Tympano" value={summaryStats.totalTympanometry} icon={Activity} color="red" />
          <StatCard label="OAE" value={summaryStats.totalOAE} icon={Activity} color="red" />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex items-center gap-3 mb-4 shadow-sm flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              placeholder="Search centre or assistant"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none outline-none text-sm text-gray-700 bg-transparent w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarIcon size={15} className="text-gray-500 shrink-0" />
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => applyDatePreset(f)}
                className={`px-3 py-1.5 rounded-md border-none cursor-pointer text-xs font-medium transition-all ${
                  activeFilter === f ? "bg-blue-600 text-white" : "bg-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setActiveFilter("All Time");
                setFromDate(null);
                setToDate(null);
              }}
              className={`px-3 py-1.5 rounded-md border-none cursor-pointer text-xs font-medium transition-all ${
                activeFilter === "All Time" ? "bg-blue-600 text-white" : "bg-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {centreTableData.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No centres found</p>
            </div>
          ) : (
            centreTableData.map((data) => (
              <CentreRow
                key={data.centreId}
                data={{
                  centreId: data.centreId,
                  name: data.name,
                  location: data.location,
                  contactNumber: data.contactNumber,
                  entName: data.entName,
                  assistantName: data.assistantName,
                  isOurAssistant: data.isOurAssistant,
                  filteredConsultations: data.filteredConsultations,
                  completed: data.completed,
                  pending: data.pending,
                  ptaCount: data.ptaCount,
                  tympanometryCount: data.tympanometryCount,
                  oaeCount: data.oaeCount,
                  etfCount: data.etfCount,
                  toneDecayCount: data.toneDecayCount,
                }}
                onView={handleViewCentre}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalCentres > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}–{Math.min(endIndex, totalCentres)} of {totalCentres} centres
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  const next = parseInt(v, 10);
                  const clamped = Number.isNaN(next) ? 10 : Math.min(50, Math.max(5, next));
                  setLimit(clamped);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 30, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <span className="text-sm text-gray-700 min-w-[80px] text-center">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportExcel(fromDate, toDate, "current")}>
                Current filters ({getDateDisplayText()})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel(today, today, "today")}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel(yesterday, yesterday, "yesterday")}>
                Yesterday
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel(subDays(today, 7), today, "last7days")}>
                Last 7 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel(subDays(today, 30), today, "last30days")}>
                Last 30 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel(null, null, "all")}>
                All Time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}