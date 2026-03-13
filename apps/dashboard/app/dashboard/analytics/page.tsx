"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isSameDay, subDays, startOfDay, endOfDay } from "date-fns";
import { SessionStatus, Role } from "@/models/enums";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import useGetAllAudiologists from "@/hooks/audiologist/use-get-all-audiologists";
import { useAudiologistStatus } from "@/hooks/audiologist/use-audiologist-status";
import HandleAudiologistDialog from "@/app/dashboard/audiologists/_components/handle-audiologist-dialog";
import {
  AlertCircle, Stethoscope, Plus, Search,
  Calendar, Users, PhoneCall, BarChart3, Activity, X,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: user } = useGetUser();
  const { data: consultations, isLoading, isError, error } = useGetAllConsultations();
  const { data: audiologists } = useGetAllAudiologists();
  const { isInCall: checkAudiologistInCall } = useAudiologistStatus();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date();
  const yesterday = subDays(today, 1);

  const activeQuickFilter = useMemo(() => {
    if (!fromDate && !toDate) return null;
    if (fromDate && toDate && isSameDay(fromDate, today) && isSameDay(toDate, today)) return "today";
    if (fromDate && toDate && isSameDay(fromDate, yesterday) && isSameDay(toDate, yesterday)) return "yesterday";
    if (fromDate && toDate && isSameDay(fromDate, subDays(today, 7)) && isSameDay(toDate, today)) return "7days";
    if (fromDate && toDate && isSameDay(fromDate, subDays(today, 30)) && isSameDay(toDate, today)) return "30days";
    return "custom";
  }, [fromDate, toDate]);

  const filteredConsultations = useMemo(() => {
    if (!consultations?.data || !Array.isArray(consultations.data)) return [];
    return consultations.data.filter((c) => {
      if (!c.audiologist?.userId || !c.createdAt) return false;
      const d = new Date(c.createdAt);
      if (!fromDate && !toDate) return true;
      if (fromDate && !toDate) return d >= startOfDay(fromDate);
      if (!fromDate && toDate) return d <= endOfDay(toDate);
      return d >= startOfDay(fromDate!) && d <= endOfDay(toDate!);
    });
  }, [consultations, fromDate, toDate]);

  const consultationsByAudiologist = useMemo(() => {
    if (!consultations?.data) return new Map<string, ConsultationModelData[]>();
    const arr = extractConsultations(consultations.data);
    const map = new Map<string, ConsultationModelData[]>();
    arr.forEach((c) => {
      const id = c.audiologist?.userId;
      if (id) {
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push(c);
      }
    });
    return map;
  }, [consultations]);

  const audiologistCardsData = useMemo(() => {
    if (!audiologists?.data || !Array.isArray(audiologists.data)) return [];
    return audiologists.data.map((audiologist: any) => {
      const audiologistId = audiologist.userId || audiologist.id;
      const filtered = filteredConsultations.filter((c) => c.audiologist?.userId === audiologistId);
      const name = audiologist.user?.name || audiologist.name || "Unknown";
      return {
        audiologist,
        audiologistId,
        name,
        email: audiologist.user?.email || audiologist.email || "",
        initials: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
        total: filtered.length,
        completed: filtered.filter((c) => c.status === SessionStatus.COMPLETED).length,
        missed: filtered.filter((c) => c.status === SessionStatus.MISSED).length,
        pending: filtered.filter((c) => c.status === SessionStatus.PENDING).length,
        isInCall: checkAudiologistInCall(audiologistId),
      };
    });
  }, [audiologists, filteredConsultations, checkAudiologistInCall]);

  const visibleCards = useMemo(() => {
    if (!searchQuery.trim()) return audiologistCardsData;
    const q = searchQuery.toLowerCase();
    return audiologistCardsData.filter(
      (d) => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)
    );
  }, [audiologistCardsData, searchQuery]);

  const summaryStats = useMemo(() => ({
    totalAudiologists: audiologistCardsData.length,
    inHouse: audiologistCardsData.filter((d) => d.audiologist?.type === "IN_HOUSE").length,
    external: audiologistCardsData.filter((d) => d.audiologist?.type === "EXTERNAL").length,
    active: audiologistCardsData.filter((d) => d.isInCall).length,
  }), [audiologistCardsData]);

  const quickFilters = [
    { label: "Today",       key: "today",    onClick: () => { setFromDate(today); setToDate(today); } },
    { label: "Yesterday",   key: "yesterday",onClick: () => { setFromDate(yesterday); setToDate(yesterday); } },
    { label: "Last 7 Days", key: "7days",    onClick: () => { setFromDate(subDays(today, 7)); setToDate(today); } },
    { label: "Last 30 Days",key: "30days",   onClick: () => { setFromDate(subDays(today, 30)); setToDate(today); } },
  ];

  return (
    <DashboardBodyWrapper className="!bg-[#EEF4F9] !gap-0 !p-0 !border-0 !rounded-none">
      <div className="min-h-screen w-full h-full bg-[#EEF4F9] p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-[28px] font-bold text-gray-900 leading-tight">
              Audiologist
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {format(new Date(), "EEEE, MMMM dd, yyyy")}
            </p>
          </div>
          <HandleAudiologistDialog
            trigger={
              <button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap flex-shrink-0">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Audiologist</span>
                <span className="sm:hidden">Add</span>
              </button>
            }
          />
        </div>

        {/* ── Summary Stat Cards ──
            • Mobile  (< sm):  2 columns
            • Tablet  (sm+):   4 columns
        */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          <StatSummaryCard
            label="Total Audiologists" value={summaryStats.totalAudiologists}
            color="text-[#1D7AFC]"
            icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />}
          />
          <StatSummaryCard
            label="In House" value={summaryStats.inHouse}
            color="text-[#22C55E]"
            icon={<PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
          />
          <StatSummaryCard
            label="External" value={summaryStats.external}
            color="text-[#EF4444]"
            icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
          />
          <StatSummaryCard
            label="Active" value={summaryStats.active}
            color="text-[#A855F7]"
            icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />}
          />
        </div>

        {/* ── Search & Filter Bar ──
            • Mobile:  stacked vertically
            • sm+:     wraps in one row
        */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 lg:gap-3">

          {/* Search */}
          <div className="relative w-full sm:w-52 lg:w-64 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search audiologist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#E3E8EF] bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 border border-[#E3E8EF] bg-white rounded-lg px-3 py-2 shadow-sm w-full sm:w-auto">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setFromDate(date);
                if (date && toDate && date > toDate) setToDate(date);
              }}
              max={toDate ? format(toDate, "yyyy-MM-dd") : undefined}
              className="text-xs text-gray-500 bg-transparent border-none outline-none w-24 sm:w-28"
            />
            <span className="text-gray-300 text-xs">–</span>
            <input
              type="date"
              value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setToDate(date);
                if (date && fromDate && date < fromDate) setFromDate(date);
              }}
              min={fromDate ? format(fromDate, "yyyy-MM-dd") : undefined}
              className="text-xs text-gray-500 bg-transparent border-none outline-none w-24 sm:w-28"
            />
          </div>

          {/* Quick Filter Pills — horizontally scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide w-full sm:w-auto">
            {quickFilters.map((f) => (
              <button
                key={f.key}
                onClick={f.onClick}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${
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
                onClick={() => { setFromDate(null); setToDate(null); }}
                className="p-2 rounded-lg border border-[#E3E8EF] bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Result Count ── */}
        {!isLoading && !isError && (
          <p className="text-xs sm:text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">{visibleCards.length}</span>{" "}
            audiologist
          </p>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-400">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-medium text-red-800">Failed to load data</p>
              <p className="text-xs text-red-600">
                {error instanceof Error ? error.message : "Please try again later."}
              </p>
            </div>
          </div>
        )}

        {/* ── Audiologist Cards Grid ──
            • Mobile  (< sm):   1 column
            • Tablet  (sm):     2 columns
            • iPad/MD (md):     3 columns
            • Mac/LG  (lg):     4 columns
            • XL      (xl):     5 columns
        */}
        {!isLoading && !isError && (
          visibleCards.length === 0 ? (
            <div className="bg-white border border-[#E3E8EF] rounded-xl p-16 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Stethoscope className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No Audiologists Found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
              {visibleCards.map((cardData) => (
                <AudiologistCard key={cardData.audiologistId} cardData={cardData} />
              ))}
            </div>
          )
        )}

      </div>
    </DashboardBodyWrapper>
  );
}

/* ──────────────────────────────────────────
   Summary Stat Card (top row)
────────────────────────────────────────── */
function StatSummaryCard({
  label, value, color, icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E3E8EF] p-3 sm:p-4 shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
        <span className="text-xs sm:text-sm text-gray-500 font-medium leading-snug">{label}</span>
        <span className="flex-shrink-0 mt-0.5">{icon}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ──────────────────────────────────────────
   Audiologist Card
   Figma: radius 10px, padding 16px, gap 20px
   shadow: 0 2px 8px rgba(0,0,0,0.08)
────────────────────────────────────────── */
function AudiologistCard({ cardData }: { cardData: any }) {
  const avatarColors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-green-100 text-green-600",
    "bg-orange-100 text-orange-600",
    "bg-pink-100 text-pink-600",
  ];
  const colorIndex =
    (cardData.initials.charCodeAt(0) + (cardData.initials.charCodeAt(1) || 0)) %
    avatarColors.length;

  return (
    <div
      className="bg-white rounded-[10px] border border-[#E3E8EF] p-3 sm:p-4 flex flex-col gap-3"
      style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)" }}
    >
      {/* Avatar + Name + Email */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColors[colorIndex]}`}
        >
          {cardData.initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate leading-tight">
            {cardData.name}
          </p>
          <p className="text-[10px] sm:text-[11px] text-gray-400 truncate">{cardData.email}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        {cardData.isInCall ? (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 rounded-full"
            style={{ backgroundColor: "rgba(245,159,11,0.15)", color: "#D97706" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59F0B] flex-shrink-0" />
            In Call
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 rounded-full"
            style={{ backgroundColor: "rgba(76,160,84,0.10)", color: "#4CA054" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CA054] flex-shrink-0" />
            Available
          </span>
        )}
      </div>

      {/* Stats Grid — 4 boxes */}
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-2 sm:pt-3 border-t border-[#F1F4F8]">
        <StatItem value={cardData.total}     label="Total"   color="text-[#1D7AFC]" highlight />
        <StatItem value={cardData.completed} label="Done"    color="text-[#22C55E]" />
        <StatItem value={cardData.missed}    label="Missed"  color="text-[#EF4444]" />
        <StatItem value={cardData.pending}   label="Pending" color="text-[#F59F0B]" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Stat Item (inside audiologist card)
   Figma: grey box, Total has blue border
────────────────────────────────────────── */
function StatItem({
  value, label, color, highlight = false,
}: {
  value: number;
  label: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 sm:gap-1 rounded-lg py-1.5 sm:py-2 px-0.5 border ${
        highlight
          ? "bg-[#EBF4FF] border-[#1D7AFC]/50"
          : "bg-[#F8F9FB] border-transparent"
      }`}
    >
      <span className={`text-xs sm:text-sm font-bold leading-none ${color}`}>{value}</span>
      <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">{label}</span>
    </div>
  );
}