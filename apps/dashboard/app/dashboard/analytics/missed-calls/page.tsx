"use client";

import { useState, useMemo } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { ConsultationModelData } from "@/models/consultation.model";
import { format, isSameDay, subDays, startOfDay, endOfDay } from "date-fns";
import { SessionStatus } from "@/models/enums";
import { useGetAllConsultations } from "@/hooks/consultation/use_get_all_consultations";
import { extractConsultations } from "@/models/consultation.model";
import { AlertCircle, Search, Filter, ChevronDown } from "lucide-react";

export default function MissedCallsPage() {
  const {
    data: consultations,
    isLoading,
    isError,
    error,
  } = useGetAllConsultations();

  const today = new Date();
  const yesterday = subDays(today, 1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "7days" | "30days" | "custom" | "">("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [centreFilter, setCentreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("missed");

  // Compute from/to dates based on selected range
  const { fromDate, toDate } = useMemo(() => {
    if (dateRange === "today") return { fromDate: startOfDay(today), toDate: endOfDay(today) };
    if (dateRange === "yesterday") return { fromDate: startOfDay(yesterday), toDate: endOfDay(yesterday) };
    if (dateRange === "7days") return { fromDate: startOfDay(subDays(today, 7)), toDate: endOfDay(today) };
    if (dateRange === "30days") return { fromDate: startOfDay(subDays(today, 30)), toDate: endOfDay(today) };
    if (dateRange === "custom" && customFrom && customTo) {
      return { fromDate: startOfDay(new Date(customFrom)), toDate: endOfDay(new Date(customTo)) };
    }
    return { fromDate: null, toDate: null };
  }, [dateRange, customFrom, customTo]);

  // All missed calls = consultations without audiologist assigned
  const missedCalls = useMemo(() => {
    if (!consultations?.data) return [];
    const all = extractConsultations(consultations.data);
    return all.filter((c) => {
      if (c.audiologist?.user?.name) return false;
      if (fromDate && toDate && c.createdAt) {
        const d = new Date(c.createdAt);
        return d >= fromDate && d <= toDate;
      }
      return true;
    });
  }, [consultations, fromDate, toDate]);

  // Unique centres for dropdown
  const centres = useMemo(() => {
    const set = new Set<string>();
    missedCalls.forEach((c) => {
      const name = c.centre?.user?.name;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [missedCalls]);

  // Apply search + centre filter
  const filteredCalls = useMemo(() => {
    return missedCalls.filter((c) => {
      const patientName = c.patient?.name?.toLowerCase() || "";
      const matchesSearch = !searchQuery || patientName.includes(searchQuery.toLowerCase());
      const matchesCentre =
        centreFilter === "all" || c.centre?.user?.name === centreFilter;
      return matchesSearch && matchesCentre;
    });
  }, [missedCalls, searchQuery, centreFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: missedCalls.length,
    inProgress: missedCalls.filter((c) => c.status === SessionStatus.IN_PROGRESS).length,
    pending: missedCalls.filter((c) => c.status === SessionStatus.PENDING).length,
  }), [missedCalls]);

  const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try { return format(new Date(dateStr), "dd/MM/yy, hh:mm a"); }
    catch { return "Invalid date"; }
  };

  // Date range display label
  const dateRangeLabel = useMemo(() => {
    if (dateRange === "today") return "Today";
    if (dateRange === "yesterday") return "Yesterday";
    if (dateRange === "7days") return "Last 7 Days";
    if (dateRange === "30days") return "Last 30 Days";
    if (dateRange === "custom" && customFrom && customTo)
      return `${format(new Date(customFrom), "dd/MM/yy")} - ${format(new Date(customTo), "dd/MM/yy")}`;
    return "Today";
  }, [dateRange, customFrom, customTo]);

  return (
    <DashboardBodyWrapper>
      <div className="min-h-screen bg-gray-50/40 p-6 space-y-5">

        {/* ── Page Header ── */}
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight">Missed Calls</h1>
          <p className="text-sm text-gray-400 mt-0.5">Consultations without assigned audiologist</p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Questions" value={stats.total} color="text-[#1D7AFC]" />
          <StatCard label="In Progress" value={stats.inProgress} color="text-[#1D7AFC]" />
          <StatCard label="Pending" value={stats.pending} color="text-[#1D7AFC]" />
        </div>

        {/* ── Filters Card ── */}
        <div className="bg-white rounded-xl border border-[#E3E8EF] p-4 space-y-4"
          style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)" }}>
          
          {/* Filter Header */}
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-semibold">Filters</span>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-4 gap-4">
            {/* Patient Name Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Patients Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients name...."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[#E3E8EF] bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Date Range</label>
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E3E8EF] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                  <option value="">All Time</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              {/* Custom range inputs */}
              {dateRange === "custom" && (
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[#E3E8EF] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-[#E3E8EF] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}
            </div>

            {/* Centre */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Centre</label>
              <div className="relative">
                <select
                  value={centreFilter}
                  onChange={(e) => setCentreFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E3E8EF] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none cursor-pointer"
                >
                  <option value="all">All Centres</option>
                  {centres.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E3E8EF] bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none cursor-pointer"
                >
                  <option value="missed">Missed</option>
                  <option value="all">All</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-400">Loading missed calls...</p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">
              {error instanceof Error ? error.message : "Failed to load data."}
            </p>
          </div>
        )}

        {/* ── Table ── */}
        {!isLoading && !isError && (
          <div className="bg-white rounded-xl border border-[#E3E8EF] overflow-hidden"
            style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)" }}>

            {filteredCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No Missed Calls</p>
                <p className="text-xs text-gray-400 mt-1">All consultations have been assigned to audiologists.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-[#E3E8EF] bg-gray-50/60">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Date &amp; Time
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Patient
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Centre
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Audiologist
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Status
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-[#F1F4F8]">
                  {filteredCalls.map((consultation) => (
                    <tr
                      key={consultation.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="px-6 py-5 text-sm text-gray-500 whitespace-nowrap">
                        {safeFormatDate(consultation.createdAt)}
                      </td>

                      {/* Patient — bold */}
                      <td className="px-6 py-5 text-sm font-semibold text-gray-800">
                        {consultation.patient?.name || "Unknown Patient"}
                      </td>

                      {/* Centre */}
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {consultation.centre?.user?.name || "Unknown Centre"}
                      </td>

                      {/* Audiologist — Not Assigned in blue */}
                      <td className="px-6 py-5 text-sm font-medium text-[#1D7AFC]">
                        Not Assigned
                      </td>

                      {/* Status — Missed red pill */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#EF4444] text-white">
                          Missed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </DashboardBodyWrapper>
  );
}

/* ── Stat Card Component ── */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-[#E3E8EF] p-4"
      style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)" }}
    >
      <p className="text-sm text-gray-500 font-medium mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}