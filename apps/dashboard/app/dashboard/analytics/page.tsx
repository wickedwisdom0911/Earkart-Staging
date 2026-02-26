"use client";

import { useState, useMemo, useCallback } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import {
  format,
  isSameDay,
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import { SessionStatus, Role } from "@/models/enums";
import { useGetUser } from "@/hooks/auth/use-get-user";
import HandleAudiologistDialog from "../audiologists/_components/handle-audiologist-dialog";
import { Button } from "@/components/ui/button";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import { useAudiologistStatus } from "@/hooks/audiologist/use-audiologist-status";
import {
  AlertCircle,
  Stethoscope,
  Plus,
  Search,
  Calendar,
  Users,
  PhoneCall,
  BarChart3,
  Activity,
  X,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: user } = useGetUser();

  const {
    data: consultations,
    isLoading,
    isError,
    error,
  } = useGetAllConsultations();
  const { data: audiologists } = useGetAllAudiologists();

  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const isHeadAudiologist = user?.role === Role.HEAD_AUDIOLOGIST;
  const { isInCall: checkAudiologistInCall } = useAudiologistStatus();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date();
  const yesterday = subDays(today, 1);

  // Active quick filter label
  const activeQuickFilter = useMemo(() => {
    if (!fromDate && !toDate) return null;
    if (fromDate && toDate && isSameDay(fromDate, today) && isSameDay(toDate, today)) return "today";
    if (fromDate && toDate && isSameDay(fromDate, yesterday) && isSameDay(toDate, yesterday)) return "yesterday";
    const weekAgo = subDays(today, 7);
    if (fromDate && toDate && isSameDay(fromDate, weekAgo) && isSameDay(toDate, today)) return "7days";
    const monthAgo = subDays(today, 30);
    if (fromDate && toDate && isSameDay(fromDate, monthAgo) && isSameDay(toDate, today)) return "30days";
    return "custom";
  }, [fromDate, toDate]);

  const filteredConsultations = useMemo(() => {
    if (!consultations?.data || !Array.isArray(consultations.data)) return [];
    return consultations.data.filter((c) => {
      if (!c.audiologist || !c.audiologist.userId) return false;
      if (!c.createdAt) return false;
      const consultationDate = new Date(c.createdAt);
      if (!fromDate && !toDate) return true;
      if (fromDate && !toDate) return consultationDate >= startOfDay(fromDate);
      if (!fromDate && toDate) return consultationDate <= endOfDay(toDate);
      if (fromDate && toDate)
        return consultationDate >= startOfDay(fromDate) && consultationDate <= endOfDay(toDate);
      return true;
    });
  }, [consultations, fromDate, toDate]);

  const consultationsByAudiologist = useMemo(() => {
    if (!consultations?.data) return new Map<string, ConsultationModelData[]>();
    const consultationsArray = extractConsultations(consultations.data);
    const map = new Map<string, ConsultationModelData[]>();
    consultationsArray.forEach((c) => {
      const audiologistId = c.audiologist?.userId;
      if (audiologistId) {
        if (!map.has(audiologistId)) map.set(audiologistId, []);
        map.get(audiologistId)!.push(c);
      }
    });
    return map;
  }, [consultations]);

  const audiologistCardsData = useMemo(() => {
    if (!audiologists?.data || !Array.isArray(audiologists.data)) return [];
    return audiologists.data.map((audiologist: any) => {
      const audiologistId = audiologist.userId || audiologist.id;
      const filtered = filteredConsultations.filter(
        (c) => c.audiologist?.userId === audiologistId
      );
      const completed = filtered.filter((c) => c.status === SessionStatus.COMPLETED).length;
      const inProgress = filtered.filter((c) => c.status === SessionStatus.IN_PROGRESS).length;
      const pending = filtered.filter((c) => c.status === SessionStatus.PENDING).length;
      const missed = filtered.filter((c) => c.status === SessionStatus.MISSED).length;
      const name = audiologist.user?.name || audiologist.name || "Unknown";
      const grade = audiologist.grade || audiologist.title || "";
      const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

      return {
        audiologist,
        audiologistId,
        name,
        grade,
        email: audiologist.user?.email || audiologist.email || "",
        initials,
        total: filtered.length,
        completed,
        inProgress,
        pending,
        missed,
        isInCall: checkAudiologistInCall(audiologistId),
        allConsultations: consultationsByAudiologist.get(audiologistId) || [],
      };
    });
  }, [audiologists, filteredConsultations, consultationsByAudiologist, checkAudiologistInCall]);

  const visibleCards = useMemo(() => {
    if (!searchQuery.trim()) return audiologistCardsData;
    const q = searchQuery.toLowerCase();
    return audiologistCardsData.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        (d.grade && d.grade.toLowerCase().includes(q))
    );
  }, [audiologistCardsData, searchQuery]);

  const summaryStats = useMemo(() => {
    const totalAudiologists = audiologistCardsData.length;
    const inHouse = audiologistCardsData.filter((d) => d.audiologist?.type === "IN_HOUSE").length;
    const external = audiologistCardsData.filter((d) => d.audiologist?.type === "EXTERNAL").length;
    const active = audiologistCardsData.filter((d) => d.isInCall).length;
    return { totalAudiologists, inHouse, external, active };
  }, [audiologistCardsData]);

  const setTodayRange = useCallback(() => {
    const t = new Date();
    setFromDate(t);
    setToDate(t);
  }, []);
  const setYesterdayRange = useCallback(() => {
    const y = subDays(new Date(), 1);
    setFromDate(y);
    setToDate(y);
  }, []);
  const setLast7Days = useCallback(() => {
    const t = new Date();
    setFromDate(subDays(t, 7));
    setToDate(t);
  }, []);
  const setLast30Days = useCallback(() => {
    const t = new Date();
    setFromDate(subDays(t, 30));
    setToDate(t);
  }, []);
  const clearDateRange = useCallback(() => {
    setFromDate(null);
    setToDate(null);
  }, []);

  const quickFilters = useMemo(() => [
    { label: "Today", key: "today", onClick: setTodayRange },
    { label: "Yesterday", key: "yesterday", onClick: setYesterdayRange },
    { label: "Last 7 Days", key: "7days", onClick: setLast7Days },
    { label: "Last 30 Days", key: "30days", onClick: setLast30Days },
  ], [setTodayRange, setYesterdayRange, setLast7Days, setLast30Days]);

  return (
    <DashboardBodyWrapper>
      <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 leading-tight">Audiologist</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {format(new Date(), "EEEE, MMMM dd, yyyy")}
            </p>
          </div>
          <HandleAudiologistDialog
            trigger={
              <Button
                variant="outline"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Audiologist
              </Button>
            }
          />
        </div>

        {/* ── Summary Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Audiologists */}
          <div className="bg-white rounded-xl border border-[#E3E8EF] p-4 shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">Total Audiologists</span>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-[#1D7AFC]">{summaryStats.totalAudiologists}</p>
          </div>

          {/* In House */}
          <div className="bg-white rounded-xl border border-[#E3E8EF] p-4 shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">In House</span>
              <PhoneCall className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-[#22C55E]">{summaryStats.inHouse}</p>
          </div>

          {/* External */}
          <div className="bg-white rounded-xl border border-[#E3E8EF] p-4 shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">External</span>
              <BarChart3 className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-[#EF4444]">{summaryStats.external}</p>
          </div>

          {/* Active */}
          <div className="bg-white rounded-xl border border-[#E3E8EF] p-4 shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">Active</span>
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-[#A855F7]">{summaryStats.active}</p>
          </div>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search audiologist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-[#E3E8EF] bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-56 shadow-sm"
            />
          </div>

          {/* Calendar Icon (date range trigger visual) */}
          <div className="flex items-center gap-1 text-gray-400 border border-[#E3E8EF] bg-white rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4" />
            <input
              type="date"
              value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const v = e.target.value;
                const date = v ? new Date(v + "T12:00:00") : null;
                setFromDate(date);
                if (date && toDate && date > toDate) setToDate(date);
              }}
              max={toDate ? format(toDate, "yyyy-MM-dd") : undefined}
              className="text-xs text-gray-500 bg-transparent border-none outline-none w-28"
            />
            <span className="text-gray-300 text-xs">–</span>
            <input
              type="date"
              value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const v = e.target.value;
                const date = v ? new Date(v + "T12:00:00") : null;
                setToDate(date);
                if (date && fromDate && date < fromDate) setFromDate(date);
              }}
              min={fromDate ? format(fromDate, "yyyy-MM-dd") : undefined}
              className="text-xs text-gray-500 bg-transparent border-none outline-none w-28"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2">
            {quickFilters.map((f) => (
              <button
                key={f.key}
                onClick={f.onClick}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  activeQuickFilter === f.key
                    ? "bg-blue-50 border-blue-300 text-blue-600"
                    : "bg-white border-[#E3E8EF] text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
            {(fromDate || toDate) && (
              <button
                onClick={clearDateRange}
                className="p-2 rounded-lg border border-[#E3E8EF] bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Result Count ── */}
        {!isLoading && !isError && (
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{visibleCards.length}</span> audiologist
          </p>
        )}

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm font-medium text-red-800">Failed to load data</p>
              <p className="text-xs text-red-600">
                {error instanceof Error ? error.message : "Please try again later."}
              </p>
            </div>
          </div>
        )}

        {/* ── Audiologist Cards Grid ── */}
        {!isLoading && !isError && (
          <>
            {visibleCards.length === 0 ? (
              <div className="bg-white border border-[#E3E8EF] rounded-xl p-16 flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Stethoscope className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">No Audiologists Found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {visibleCards.map((cardData) => (
                  <AudiologistCard key={cardData.audiologistId} cardData={cardData} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardBodyWrapper>
  );
}

/* ─────────────────────────────────────────────
   Audiologist Card — matches Figma exactly
   Width: 256px fill, Border: 1px #E3E8EF
   Radius: 10px, Padding: 16px, Gap: 20px
   Shadow: 0 2 8 0 #00000014
───────────────────────────────────────────── */
function AudiologistCard({ cardData }: { cardData: any }) {
  const avatarColors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-green-100 text-green-600",
    "bg-orange-100 text-orange-600",
    "bg-pink-100 text-pink-600",
  ];
  const initials = cardData.initials || "??";
  const colorIndex =
    initials.length >= 2
      ? (initials.charCodeAt(0) + initials.charCodeAt(1)) % avatarColors.length
      : 0;
  const avatarColor = avatarColors[colorIndex];

  return (
    <div
      className="bg-white rounded-[10px] border border-[#E3E8EF] p-4 flex flex-col gap-4"
      style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)" }}
    >
      {/* ── Top: Avatar + Name + Title + Email ── */}
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-gray-900 break-words leading-tight" title={cardData.name}>
            {cardData.name}
          </p>
          {cardData.grade && (
            <p className="text-[11px] text-gray-500 break-words mt-0.5" title={cardData.grade}>
              {cardData.grade}
            </p>
          )}
          <p className="text-[11px] text-gray-400 truncate mt-0.5" title={cardData.email}>{cardData.email}</p>
        </div>
      </div>

      {/* ── Status Badge ── */}
      {/* Available: #4CA054 10% bg | In Call: #F59F0B 40% bg */}
      {/* Radius: 20px, Padding: 4px 12px, Gap: 10px */}
      <div>
        {cardData.isInCall ? (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full"
            style={{
              backgroundColor: "rgba(245, 159, 11, 0.15)",
              color: "#D97706",
              borderRadius: "20px",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "#F59F0B" }}
            />
            In Call
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full"
            style={{
              backgroundColor: "rgba(76, 160, 84, 0.10)",
              color: "#4CA054",
              borderRadius: "20px",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "#4CA054" }}
            />
            Available
          </span>
        )}
      </div>

      {/* ── Stats Row ── */}
      {/* Width: 224px fill, Height: 42px, Horizontal, space-between */}
      <div className="flex items-center justify-between w-full">
        <StatItem value={cardData.total} label="Total" color="text-[#1D7AFC]" />
        <StatItem value={cardData.completed} label="Done" color="text-[#22C55E]" />
        <StatItem value={cardData.missed} label="Missed" color="text-[#EF4444]" />
        <StatItem value={cardData.pending} label="Pending" color="text-[#F59F0B]" />
      </div>
    </div>
  );
}

function StatItem({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}
