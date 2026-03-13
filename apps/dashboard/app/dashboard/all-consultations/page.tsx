"use client";

import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { Role } from "@/models/enums";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { format } from "date-fns";
import { useGetConsultationsInfinite } from "@/hooks/consultation/use-get-consultations-infinite";
import { useGetMissedCallsInfinite } from "@/hooks/consultation/use-get-missed-calls";
import { useGetReconnectedCallsInfinite } from "@/hooks/consultation/use-get-reconnected-calls";
import { useGetFailedCallsInfinite } from "@/hooks/consultation/use-get-failed-calls";
import type { ConsultationModelData } from "@/models/consultation.model";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import {
  User,
  Filter,
  X,
  FileSpreadsheet,
  Search,
  Calendar,
  ChevronRight,
  Clock,
  Building2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportConsultationsToExcel } from "@/lib/export-consultations-excel";
import { Button } from "@/components/ui/button";
import { ConsultationGridSkeleton } from "@/components/ui/consultation-skeleton";
import { ConsultationEmptyState } from "@/components/ui/consultation-empty-state";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import getConsultation from "@/actions/consultations/get_consultation";
import { useDebounce } from "@/utils/hooks/useDebounce";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

function NewUIConsultationCard({
  consultation,
  onViewDetails,
  isNavigating,
  onHover,
}: {
  consultation: ConsultationModelData;
  onViewDetails: (id: string) => void;
  isNavigating: boolean;
  onHover?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const dateStr = consultation.createdAt
    ? format(new Date(consultation.createdAt), "dd MMM yyyy")
    : "N/A";
  const timeStr = consultation.createdAt
    ? format(new Date(consultation.createdAt), "hh:mma")
    : "";
  const isCancelledByPatient =
    consultation.status === "CANCELLED_BY_PATIENT" ||
    (consultation as { patientStatus?: string }).patientStatus === "CANCELLED_BY_PATIENT";
  const statusLabel =
    consultation.status === "COMPLETED"
      ? "Completed"
      : consultation.status === "PENDING"
        ? "Pending"
        : consultation.status === "IN_PROGRESS"
          ? "In Progress"
          : consultation.status === "CANCELLED"
            ? "Cancelled"
            : consultation.status === "FAILED"
              ? "Failed"
              : isCancelledByPatient
                ? "Cancelled by Patient"
                : String(consultation.status ?? "N/A");

  const statusStyle =
    consultation.status === "COMPLETED"
      ? { bg: "rgba(76,202,84,0.1)", color: "#16a34a" }
      : consultation.status === "PENDING"
        ? { bg: "rgba(234,179,8,0.15)", color: "#ca8a04" }
        : consultation.status === "IN_PROGRESS"
          ? { bg: "rgba(59,130,246,0.1)", color: "#2563eb" }
          : consultation.status === "CANCELLED" || consultation.status === "FAILED" || isCancelledByPatient
            ? { bg: "rgba(239,68,68,0.1)", color: "#dc2626" }
            : { bg: "rgba(76,202,84,0.1)", color: "#16a34a" };

  return (
    <div
      id={`consultation-${consultation.id}`}
      onMouseEnter={() => {
        setHovered(true);
        onHover?.(consultation.id);
      }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !isNavigating && onViewDetails(consultation.id)}
      style={{
        width: "100%",
        minWidth: 353,
        minHeight: 236,
        background: "#FFFFFF",
        borderTop: "3px solid #40A3DB",
        borderRight: `1px solid ${hovered ? "#40A3DB" : "#e2e8f0"}`,
        borderBottom: `1px solid ${hovered ? "#40A3DB" : "#e2e8f0"}`,
        borderLeft: `1px solid ${hovered ? "#40A3DB" : "#e2e8f0"}`,
        borderRadius: 10,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered
          ? "0 4px 16px rgba(64,163,219,0.15)"
          : "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Patient name + date/time */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(64,163,219,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User size={18} color="#40A3DB" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
            {consultation.patient?.name || "Unknown Patient"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Clock size={11} color="#40A3DB" />
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              {dateStr}&nbsp;&nbsp;{timeStr}
            </span>
          </div>
        </div>
      </div>

      {/* Centre + Audiologist rows — #F7F9FA pill background matching Figma */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F7F9FA",
            borderRadius: 4,
            padding: "8px 24px",
            minHeight: 36,
          }}
        >
          <Building2 size={13} color="#40A3DB" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
            {consultation.centre?.user?.name || "Centre Name"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F7F9FA",
            borderRadius: 4,
            padding: "8px 24px",
            minHeight: 36,
          }}
        >
          <User size={13} color="#40A3DB" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
            {consultation.audiologist?.user?.name || "No Audiologist Assigned"}
          </span>
        </div>
      </div>

      {/* Status + Details */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: statusStyle.bg,
            borderRadius: 20,
            padding: "4px 10px",
          }}
        >
          <CheckCircle2 size={13} color={statusStyle.color} />
          <span style={{ fontSize: 11, fontWeight: 600, color: statusStyle.color }}>
            {statusLabel}
          </span>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isNavigating) onViewDetails(consultation.id);
          }}
        >
          <FileText size={13} color="#40A3DB" />
          <span style={{ fontSize: 12, fontWeight: 500, color: "#40A3DB" }}>Details</span>
        </div>
      </div>
    </div>
  );
}

function AllConsultationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: user } = useGetUser();
  const [mounted, setMounted] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Avoid hydration mismatch: user/role-dependent UI can differ between server and client
  useEffect(() => setMounted(true), []);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedAudiologistId, setSelectedAudiologistId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [showDemoCalls, setShowDemoCalls] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "missed" | "reconnected" | "failed">("all");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sync type filter with URL (e.g. ?filter=missed-calls, ?filter=reconnected-calls, ?filter=failed-calls)
  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter === "missed-calls") setTypeFilter("missed");
    else if (filter === "reconnected-calls") setTypeFilter("reconnected");
    else if (filter === "failed-calls") setTypeFilter("failed");
  }, [searchParams]);

  // Sync audiologistId from URL (e.g. ?audiologistId=xxx when viewing individual audiologist)
  const urlAudiologistId = searchParams.get("audiologistId") ?? undefined;
  useEffect(() => {
    if (urlAudiologistId && urlAudiologistId !== selectedAudiologistId) {
      setSelectedAudiologistId(urlAudiologistId);
    }
  }, [urlAudiologistId]);

  const isAudiologist =
    user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;
  const isHeadAudiologist = user?.role === Role.HEAD_AUDIOLOGIST;
  const canFilterByAudiologist =
    user?.role === Role.HEAD_AUDIOLOGIST ||
    user?.role === Role.ADMIN ||
    user?.role === Role.SUPER_ADMIN;
  const isSimpleAudiologist = isAudiologist && !isHeadAudiologist;

  // Only fetch audiologists list for admins/heads (dropdown). Simple audiologists get permission denied.
  const { data: audiologistsData } = useGetAllAudiologists({
    enabled: canFilterByAudiologist,
  });
  const audiologists = audiologistsData?.data ?? [];

  const audiologistFilterId = canFilterByAudiologist && selectedAudiologistId
    ? selectedAudiologistId
    : undefined;

  const isMissedFilter = typeFilter === "missed";
  const isReconnectedFilter = typeFilter === "reconnected";
  const isFailedFilter = typeFilter === "failed";
  const isSpecialFilter = isMissedFilter || isReconnectedFilter || isFailedFilter;

  // For simple audiologists: DON'T pass audiologistId. Backend should auto-filter by logged-in user (JWT).
  // get-all-audiologists is permission-denied for them, so we cannot resolve profile id. Calling get-all without
  // audiologistId relies on backend returning only their consultations when they're an audiologist.
  const apiAudiologistId =
    urlAudiologistId ?? audiologistFilterId ?? (isSimpleAudiologist ? undefined : undefined);

  // Simple audiologists: no need to wait for profile id - we call get-all without audiologistId
  const isReadyForSimpleAudiologist = true;

  const isDemoParam = showDemoCalls ? true : undefined;

  // Missed calls: use dedicated /consultation/missed-calls API (CANCELLED_BY_PATIENT, excludes RECONNECTED)
  const missedCallsQuery = useGetMissedCallsInfinite({
    limit: PAGE_SIZE,
    enabled: isMissedFilter && isReadyForSimpleAudiologist,
    audiologistId: isMissedFilter ? apiAudiologistId : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: debouncedSearchQuery || undefined,
    isDemo: isDemoParam,
  });

  // Reconnected calls: use dedicated /consultation/reconnected-calls API
  const reconnectedCallsQuery = useGetReconnectedCallsInfinite({
    limit: PAGE_SIZE,
    enabled: isReconnectedFilter && isReadyForSimpleAudiologist,
    audiologistId: isReconnectedFilter ? apiAudiologistId : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: debouncedSearchQuery || undefined,
    isDemo: isDemoParam,
  });

  // Failed calls: use dedicated /consultation/failed-calls API (status FAILED - technical issues)
  const failedCallsQuery = useGetFailedCallsInfinite({
    limit: PAGE_SIZE,
    enabled: isFailedFilter && isReadyForSimpleAudiologist,
    audiologistId: isFailedFilter ? apiAudiologistId : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: debouncedSearchQuery || undefined,
    isDemo: isDemoParam,
  });

  // All consultations: paginated get-all API (works for no dates, from-only, or full date range)
  const infiniteQuery = useGetConsultationsInfinite({
    limit: PAGE_SIZE,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: debouncedSearchQuery || undefined,
    audiologistId: apiAudiologistId,
    isDemo: isDemoParam,
    enabled: !isSpecialFilter && isReadyForSimpleAudiologist,
  });

  const allConsultationsFromApi = isMissedFilter
    ? missedCallsQuery.consultations
    : isReconnectedFilter
      ? reconnectedCallsQuery.consultations
      : isFailedFilter
        ? failedCallsQuery.consultations
        : infiniteQuery.consultations;

  const totalBeforeFilter = isMissedFilter
    ? missedCallsQuery.total
    : isReconnectedFilter
      ? reconnectedCallsQuery.total
      : isFailedFilter
        ? failedCallsQuery.total
        : infiniteQuery.total ?? 0;

  const isLoading = isMissedFilter
    ? missedCallsQuery.isLoading
    : isReconnectedFilter
      ? reconnectedCallsQuery.isLoading
      : isFailedFilter
        ? failedCallsQuery.isLoading
        : infiniteQuery.isLoading;
  const isError = isMissedFilter
    ? missedCallsQuery.isError
    : isReconnectedFilter
      ? reconnectedCallsQuery.isError
      : isFailedFilter
        ? failedCallsQuery.isError
        : infiniteQuery.isError;
  const error = isMissedFilter
    ? missedCallsQuery.error
    : isReconnectedFilter
      ? reconnectedCallsQuery.error
      : isFailedFilter
        ? failedCallsQuery.error
        : infiniteQuery.error;

  const fetchNextPage = isMissedFilter
    ? missedCallsQuery.fetchNextPage
    : isReconnectedFilter
      ? reconnectedCallsQuery.fetchNextPage
      : isFailedFilter
        ? failedCallsQuery.fetchNextPage
        : infiniteQuery.fetchNextPage;
  const hasNextPage = isMissedFilter
    ? missedCallsQuery.hasNextPage
    : isReconnectedFilter
      ? reconnectedCallsQuery.hasNextPage
      : isFailedFilter
        ? failedCallsQuery.hasNextPage
        : infiniteQuery.hasNextPage ?? false;
  const isFetchingNextPage = isMissedFilter
    ? missedCallsQuery.isFetchingNextPage
    : isReconnectedFilter
      ? reconnectedCallsQuery.isFetchingNextPage
      : isFailedFilter
        ? failedCallsQuery.isFetchingNextPage
        : infiniteQuery.isFetchingNextPage ?? false;

  // Date, search, and audiologist filtering are all done by the API.
  const filteredConsultations = allConsultationsFromApi;

  const handleViewDetails = useCallback(
    (consultationId: string) => {
      setNavigatingTo(consultationId);
      router.push(`/dashboard/consultation-details/${consultationId}`);
    },
    [router]
  );

  const handlePrefetchConsultation = useCallback(
    (consultationId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["consultation", consultationId],
        queryFn: () => getConsultation(consultationId),
        staleTime: 3 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedAudiologistId("");
    setSearchQuery("");
    setShowDemoCalls(false);
    setTypeFilter("all");
  };

  const loadedCount = allConsultationsFromApi.length;

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    // Don't fetch if we've already loaded everything (prevents stuck "Loading more...")
    if (loadedCount >= totalBeforeFilter && totalBeforeFilter > 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, loadedCount, totalBeforeFilter]);

  const consultations = filteredConsultations;
  const total = totalBeforeFilter;

  const scrollToId = searchParams.get("scrollTo");
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (!scrollToId || consultations.length === 0 || hasScrolledRef.current) return;
    const el = document.getElementById(`consultation-${scrollToId}`);
    if (el) {
      hasScrolledRef.current = true;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      router.replace("/dashboard/all-consultations", { scroll: false });
    }
  }, [scrollToId, consultations, router]);

  return (
    <DashboardBodyWrapper className="!bg-[#f0f4f8] !px-0">
      <div
        style={{
          minHeight: "100%",
          background: "#f0f4f8",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          padding: "24px 24px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#6b7280",
            marginBottom: 20,
          }}
        >
          <span style={{ color: "#374151" }}>Dashboard</span>
          <ChevronRight size={14} color="#9ca3af" />
          <span style={{ color: "#40A3DB", fontWeight: 500 }}>All Consultants</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", margin: 0 }}>
              {mounted && isAudiologist ? "My Session History" : "Session History"}
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
              {mounted && isAudiologist
                ? "Browse and filter your past consultation records"
                : "Browse and filter all consultation records"}
            </p>
            {mounted && isAudiologist && !isHeadAudiologist && (
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "rgba(64,163,219,0.1)", borderRadius: 9999, fontSize: 13, color: "#40A3DB" }}>
                <User size={14} />
                <span>Showing only your consultations</span>
              </div>
            )}
          </div>
          {consultations.length > 0 && (
            <Button
              variant="outline"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
              onClick={() => {
                exportConsultationsToExcel(consultations);
                toast.success(
                  `Exported ${consultations.length} consultation${consultations.length !== 1 ? "s" : ""} to Excel`
                );
              }}
            >
              <FileSpreadsheet size={16} />
              Export to Excel
            </Button>
          )}
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Filter size={16} color="#374151" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Filters</span>
          </div>

          {/* All / Missed Calls / Reconnected Calls / Failed Calls filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: typeFilter === "all" ? "#40A3DB" : "#f9fafb",
                color: typeFilter === "all" ? "#fff" : "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("missed")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: typeFilter === "missed" ? "#40A3DB" : "#f9fafb",
                color: typeFilter === "missed" ? "#fff" : "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Missed Calls
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("reconnected")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: typeFilter === "reconnected" ? "#40A3DB" : "#f9fafb",
                color: typeFilter === "reconnected" ? "#fff" : "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reconnected Calls
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("failed")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: typeFilter === "failed" ? "#40A3DB" : "#f9fafb",
                color: typeFilter === "failed" ? "#fff" : "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Failed Calls
            </button>
          </div>

          {/* Show demo calls checkbox - isDemo=true only when checked */}
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              cursor: "pointer",
              fontSize: 13,
              color: "#374151",
              fontWeight: 500,
            }}
          >
            <input
              type="checkbox"
              checked={showDemoCalls}
              onChange={(e) => setShowDemoCalls(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#40A3DB" }}
            />
            Show demo calls
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: (mounted && canFilterByAudiologist) ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 12px",
                background: "#f9fafb",
              }}
            >
              <Search size={14} color="#9ca3af" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  color: "#374151",
                  width: "100%",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 12px",
                background: "#f9fafb",
              }}
            >
              <Calendar size={14} color="#9ca3af" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setStartDate(v);
                  if (endDate && v && v > endDate) setEndDate(v);
                }}
                max={endDate || undefined}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  color: startDate ? "#374151" : "#9ca3af",
                  width: "100%",
                  minWidth: 0,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 12px",
                background: "#f9fafb",
              }}
            >
              <Calendar size={14} color="#9ca3af" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && startDate && val < startDate) {
                    // If "to" is before "from", swap them
                    setEndDate(startDate);
                    setStartDate(val);
                  } else {
                    setEndDate(val);
                  }
                }}
                min={startDate || undefined}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  color: endDate ? "#374151" : "#9ca3af",
                  width: "100%",
                  minWidth: 0,
                }}
              />
            </div>

            {mounted && canFilterByAudiologist && (
              <Select
                value={selectedAudiologistId || "all"}
                onValueChange={(v) => setSelectedAudiologistId(v === "all" ? "" : v)}
              >
                <SelectTrigger className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm h-auto">
                  <SelectValue placeholder="All audiologists" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All audiologists</SelectItem>
                  {audiologists
                    .filter((a): a is NonNullable<typeof a> => a != null)
                    .map((a) => {
                      const profileId = a.id ?? a.userId ?? a.user?.id;
                      const name = a.user?.name ?? a.user?.email ?? "Unknown";
                      if (!profileId) return null;
                      return (
                        <SelectItem key={profileId} value={profileId}>
                          {name}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            )}
          </div>

          {(startDate || endDate || selectedAudiologistId || searchQuery || showDemoCalls) && (
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="outline" size="sm" onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <X size={14} />
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        <p style={{ fontSize: 13, color: "#374151", marginBottom: 16 }}>
          {total > 0
            ? `Loaded ${loadedCount} of ${total} consultation${total !== 1 ? "s" : ""} — scroll for more`
            : loadedCount > 0
              ? `Showing ${consultations.length} consultation${consultations.length !== 1 ? "s" : ""}`
              : "No consultations"}
        </p>

        {isLoading && (
          <div style={{ width: "100%" }}>
            <ConsultationGridSkeleton count={4} />
          </div>
        )}

        {isError && (
          <div
            style={{
              padding: 24,
              background: "#fef2f2",
              border: "2px solid #fecaca",
              borderRadius: 12,
            }}
          >
            <p style={{ fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>
              {error instanceof Error && (error as any).isRateLimit
                ? "Too Many Requests"
                : "Failed to load consultations"}
            </p>
            <p style={{ fontSize: 13, color: "#b91c1c", marginBottom: 12 }}>
              {error instanceof Error && (error as any).isRateLimit
                ? "The server is receiving too many requests. Please wait a moment and try again."
                : error instanceof Error
                  ? error.message
                  : "Please try again later."}
            </p>
            {error instanceof Error && (error as any).isRateLimit && (
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            )}
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {consultations.length === 0 ? (
              <ConsultationEmptyState
                type="all"
                hasFilters={!!(startDate || endDate || selectedAudiologistId || searchQuery || showDemoCalls)}
                onClearFilters={clearFilters}
                noResultsOnPage={
                  total > 0 && !(startDate || endDate) && mounted && isAudiologist
                }
                infiniteScroll
                hasMoreToLoad={hasNextPage ?? false}
              />
            ) : (
              <>
                <div
                  className="grid gap-4 w-full"
                  style={{
                    gridTemplateColumns: "repeat(auto-fill, minmax(353px, 1fr))",
                  }}
                >
                  {consultations.map((consultation) => (
                    <NewUIConsultationCard
                      key={consultation.id}
                      consultation={consultation}
                      onViewDetails={handleViewDetails}
                      isNavigating={navigatingTo === consultation.id}
                      onHover={handlePrefetchConsultation}
                    />
                  ))}
                </div>

                <div
                  ref={loadMoreRef}
                    style={{ minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}
                  >
                    {isFetchingNextPage && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        <p style={{ fontSize: 13, color: "#6b7280" }}>Loading more...</p>
                      </div>
                    )}
                    {!hasNextPage && loadedCount > 0 && (
                      <p style={{ fontSize: 13, color: "#6b7280" }}>You&apos;ve reached the end</p>
                    )}
                  </div>
              </>
            )}
          </>
        )}

        {navigatingTo && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-4 shadow-xl">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Loading consultation details...
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}

export default function AllConsultationsPage() {
  return (
    <Suspense fallback={<ConsultationGridSkeleton count={4} />}>
      <AllConsultationsContent />
    </Suspense>
  );
}
