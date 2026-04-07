"use client";

import { useDashboardSummary, useHealthStatus } from "@/hooks/analytics/use-dashboard-summary";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import {
  RefreshCw,
  AlertCircle,
  Globe,
  Users,
  MessageSquare,
  Smartphone,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSummaryData } from "@/models/dashboard.model";

/** Read numeric fields from API (camelCase or snake_case). */
function pickMetric(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

// ─── Pie Chart – Total Consultation ──────────────────────────────────────────

function TotalConsultationChart({
  completed,
  inProgress,
  cancelled,
  total,
}: {
  completed: number;
  inProgress: number;
  cancelled: number;
  total: number;
}) {
  const r = 60;
  const cx = 80;
  const cy = 80;

  if (total <= 0) {
    return (
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="#e5e7eb" />
        <text x={cx} y={cy} textAnchor="middle" className="text-xs fill-gray-400">
          No data
        </text>
      </svg>
    );
  }

  const completedPct = completed / total;
  const inProgressPct = inProgress / total;
  const cancelledPct = cancelled / total;

  function polarToCartesian(cx0: number, cy0: number, rad: number, angleDeg: number) {
    const rad1 = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx0 + rad * Math.cos(rad1), y: cy0 + rad * Math.sin(rad1) };
  }

  function slicePath(startDeg: number, endDeg: number) {
    const start = polarToCartesian(cx, cy, r, startDeg);
    const end = polarToCartesian(cx, cy, r, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  }

  const completedEnd = completedPct * 360;
  const inProgressEnd = completedEnd + inProgressPct * 360;
  const cancelledEnd = inProgressEnd + cancelledPct * 360;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} fill="#e5e7eb" />
      <path d={slicePath(0, completedEnd)} fill="#22c55e" />
      <path d={slicePath(completedEnd, inProgressEnd)} fill="#3b82f6" />
      <path d={slicePath(inProgressEnd, cancelledEnd)} fill="#ef4444" />
    </svg>
  );
}

// ─── Donut Chart – Patient Status ────────────────────────────────────────────

function PatientStatusDonut({
  active,
  inactive,
  newPatients,
}: {
  active: number;
  inactive: number;
  newPatients: number;
}) {
  const total = active + inactive + newPatients;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const innerR = 32;

  if (total <= 0) {
    return (
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="#e5e7eb" />
      </svg>
    );
  }

  function polarToCartesian(cx0: number, cy0: number, rad: number, angleDeg: number) {
    const rad1 = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx0 + rad * Math.cos(rad1), y: cy0 + rad * Math.sin(rad1) };
  }

  function donutSlicePath(startDeg: number, endDeg: number, outerR: number, innerR0: number) {
    const startOuter = polarToCartesian(cx, cy, outerR, startDeg);
    const endOuter = polarToCartesian(cx, cy, outerR, endDeg);
    const startInner = polarToCartesian(cx, cy, innerR0, endDeg);
    const endInner = polarToCartesian(cx, cy, innerR0, startDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerR0} ${innerR0} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
      "Z",
    ].join(" ");
  }

  const activeDeg = (active / total) * 360;
  const inactiveDeg = (inactive / total) * 360;
  const newDeg = (newPatients / total) * 360;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <path d={donutSlicePath(0, activeDeg, r, innerR)} fill="#3b82f6" />
      <path d={donutSlicePath(activeDeg, activeDeg + inactiveDeg, r, innerR)} fill="#9ca3af" />
      <path
        d={donutSlicePath(activeDeg + inactiveDeg, activeDeg + inactiveDeg + newDeg, r, innerR)}
        fill="#22c55e"
      />
      <path
        d={donutSlicePath(activeDeg + inactiveDeg + newDeg, 360, r, innerR)}
        fill="#e5e7eb"
      />
    </svg>
  );
}

// ─── Bar Chart – Revenue (uses revenueWeekly from API when present) ─────────

function RevenueBarChart({
  monthlyRevenue,
  weeklyRevenue,
}: {
  monthlyRevenue: number;
  weeklyRevenue?: number[];
}) {
  const fromApi =
    Array.isArray(weeklyRevenue) &&
    weeklyRevenue.length === 4 &&
    weeklyRevenue.every((n) => typeof n === "number" && Number.isFinite(n));

  const weeks = fromApi
    ? weeklyRevenue!.map((value, i) => ({ label: `Week ${i + 1}`, value }))
    : [0.22, 0.24, 0.26, 0.28].map((f, i) => ({
        label: `Week ${i + 1}`,
        value: monthlyRevenue * f,
      }));

  const maxVal = Math.max(...weeks.map((w) => w.value), 1);
  const maxH = 80;
  const tick = (k: number) => `$${Math.round((maxVal * k) / 1000)}k`;

  return (
    <div className="flex items-end gap-3 h-24 mt-2">
      <div className="flex flex-col justify-between h-full text-[10px] text-gray-400 pr-1">
        <span>{tick(100)}</span>
        <span>{tick(75)}</span>
        <span>{tick(50)}</span>
        <span>{tick(25)}</span>
        <span>$0k</span>
      </div>
      {weeks.map((w, i) => (
        <div key={w.label} className="flex flex-col items-center gap-1 flex-1">
          <div
            className={cn(
              "w-full rounded-t-sm min-h-[4px]",
              i < 2 ? "bg-blue-200" : "bg-blue-600"
            )}
            style={{
              height: `${Math.max(4, (w.value / maxVal) * maxH)}px`,
            }}
          />
          <span className="text-[10px] text-gray-400">{w.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Circular Gauge – Success Rate ───────────────────────────────────────────

function SuccessRateGauge({ value }: { value: number }) {
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-lg font-bold" fontSize="18" fontWeight="700" fill="#111827">
          {value.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#6b7280">
          Success
        </text>
      </svg>
    </div>
  );
}

// ─── Half Gauge – Device Utilization ─────────────────────────────────────────

function DeviceUtilizationGauge({ value }: { value: number }) {
  const r = 52;
  const cx = 75;
  const cy = 75;
  const halfCirc = Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const dashOffset = halfCirc * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="90" viewBox="0 0 150 90">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={halfCirc}
          strokeDashoffset={dashOffset}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">
          {value.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fill="#6b7280">
          Utilization
        </text>
      </svg>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  name,
  status,
  responseTime,
  uptime,
  icon: Icon,
}: {
  name: string;
  status: string;
  responseTime: number;
  uptime: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const healthy = status?.toLowerCase() === "healthy";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            "p-1.5 rounded-md border",
            healthy ? "bg-teal-50 text-teal-600 border-teal-100" : "bg-red-50 text-red-600 border-red-100"
          )}
        >
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={cn("w-1.5 h-1.5 rounded-full inline-block", healthy ? "bg-green-500" : "bg-red-500")}
            />
            <span
              className={cn(
                "text-xs font-medium",
                healthy ? "text-green-600" : "text-red-600"
              )}
            >
              {status}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Response</span>
          <span className="font-medium text-gray-700">{responseTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Uptime</span>
          <span className="font-medium text-gray-700">{uptime}</span>
        </div>
      </div>
    </div>
  );
}

/** Prefer analytics/summary fields; fall back to success rate + live active count only if needed. */
function getConsultationBreakdown(
  d: DashboardSummaryData["dashboard"],
  realTime: DashboardSummaryData["realTime"]
) {
  const raw = d as Record<string, unknown>;
  const total = Math.max(0, d.totalConsultations);
  if (total === 0) {
    return { completed: 0, inProgress: 0, cancelled: 0, usedApi: false };
  }

  let completed =
    pickMetric(raw, "completedConsultations", "completed_consultations") ??
    Math.min(total, Math.round((d.successRate / 100) * total));

  let inProgress =
    pickMetric(
      raw,
      "inProgressConsultations",
      "in_progress_consultations",
      "pendingConsultations",
      "pending_consultations"
    ) ?? Math.min(realTime.activeConsultations, total);

  let cancelled = pickMetric(raw, "cancelledConsultations", "cancelled_consultations");
  if (cancelled === undefined) {
    cancelled = Math.max(0, total - completed - inProgress);
  }

  const usedApi =
    pickMetric(raw, "completedConsultations", "completed_consultations") !== undefined ||
    pickMetric(raw, "inProgressConsultations", "in_progress_consultations") !== undefined ||
    pickMetric(raw, "cancelledConsultations", "cancelled_consultations") !== undefined;

  const sum = completed + inProgress + cancelled;
  if (total > 0 && sum > 0 && Math.abs(sum - total) > 0.5) {
    const scale = total / sum;
    completed = Math.round(completed * scale);
    inProgress = Math.round(inProgress * scale);
    cancelled = Math.max(0, total - completed - inProgress);
  }

  return { completed, inProgress, cancelled, usedApi };
}

function formatUptimeHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  return `${h.toLocaleString()}h`;
}

export default function DashboardOverviewPage() {
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useDashboardSummary();

  const {
    data: healthData,
    isLoading: isHealthLoading,
    isError: isHealthError,
    refetch: refetchHealth,
  } = useHealthStatus();

  const isLoading = isDashboardLoading || isHealthLoading;
  /** Dashboard summary fetch failed (same as react-query `isError` for that query). */
  const isError = isDashboardError;

  const handleRefresh = () => {
    refetchDashboard();
    refetchHealth();
  };

  const d = dashboardData?.dashboard;
  const rt = dashboardData?.realTime;
  const raw = (d ?? {}) as Record<string, unknown>;

  const totalConsultations = d?.totalConsultations ?? 0;
  const breakdown =
    d && rt
      ? getConsultationBreakdown(d, rt)
      : { completed: 0, inProgress: 0, cancelled: 0, usedApi: false };
  const completedCount = breakdown.completed;
  const inProgressCount = breakdown.inProgress;
  const cancelledCount = breakdown.cancelled;

  const completedPct =
    totalConsultations > 0 ? Math.round((completedCount / totalConsultations) * 100) : 0;

  const activePatients = d?.activePatients ?? 0;
  const inactivePatients =
    pickMetric(raw, "inactivePatients", "inactive_patients") ?? 0;
  const newPatients =
    pickMetric(raw, "newPatients", "new_patients") ?? d?.testsCompletedToday ?? 0;
  const revenue = d?.revenueThisMonth ?? 0;
  const successRate = d?.successRate ?? 0;
  const deviceUtil = d?.deviceUtilization ?? 0;
  const growthPct = d?.monthlyGrowthRate ?? 0;
  const consultationGrowth =
    pickMetric(raw, "consultationGrowthPercent", "consultation_growth_percent") ?? growthPct;
  const revenueGrowth =
    pickMetric(raw, "revenueGrowthPercent", "revenue_growth_percent") ?? growthPct;

  const weeklyFromRaw = raw["revenueWeekly"] ?? raw["revenue_weekly"];
  const weeklyRevenue =
    Array.isArray(weeklyFromRaw) &&
    weeklyFromRaw.length === 4 &&
    weeklyFromRaw.every((x) => typeof x === "number")
      ? (weeklyFromRaw as number[])
      : undefined;

  const healthSummary = healthData?.summary ?? { healthy: 0, total: 0 };
  const services = healthData?.services;

  const serviceList = [
    {
      name: "API Gateway",
      icon: Globe,
      status: services?.gateway?.details?.status ?? "unknown",
      responseTime: services?.gateway?.responseTime ?? 0,
      uptime: formatUptimeHours(services?.gateway?.details?.uptime ?? 0),
    },
    {
      name: "User Service",
      icon: Users,
      status: services?.user?.details?.status ?? "unknown",
      responseTime: services?.user?.responseTime ?? 0,
      uptime: formatUptimeHours(services?.user?.details?.uptime ?? 0),
    },
    {
      name: "Communication",
      icon: MessageSquare,
      status: services?.communication?.details?.status ?? "unknown",
      responseTime: services?.communication?.responseTime ?? 0,
      uptime: formatUptimeHours(services?.communication?.details?.uptime ?? 0),
    },
    {
      name: "MDM Service",
      icon: Smartphone,
      status: services?.mdm?.details?.status ?? "unknown",
      responseTime: services?.mdm?.responseTime ?? 0,
      uptime: formatUptimeHours(services?.mdm?.details?.uptime ?? 0),
    },
  ];

  return (
    <DashboardBodyWrapper
      pageTitle="Dashboard Overview"
      button={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 bg-white rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} strokeWidth={1.5} />
            Refresh
          </button>
          <button
            type="button"
            className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-500 -mt-4 mb-5">
        Monitor your healthcare platform performance at a glance
      </p>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-600">Failed to load dashboard data.</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !isError && dashboardData && d && rt && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">Total Consultation</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {breakdown.usedApi
                  ? "Breakdown by status"
                  : "Breakdown estimated from success rate & live consultations where counts are not provided"}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalConsultations.toLocaleString()}
                  </p>
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                    {consultationGrowth >= 0 ? "+" : ""}
                    {consultationGrowth.toFixed(1)}% MoM
                  </span>
                </div>
                <div className="relative shrink-0">
                  <TotalConsultationChart
                    completed={completedCount}
                    inProgress={inProgressCount}
                    cancelled={cancelledCount}
                    total={totalConsultations}
                  />
                </div>
                <div className="flex flex-col gap-2 text-xs min-w-[140px]">
                  <div className="flex items-center gap-1.5 text-green-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    Completed {completedPct}%
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    In Progress {inProgressCount}
                  </div>
                  <div className="flex items-center gap-1.5 text-red-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    Cancelled {cancelledCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">Patient Status</p>
              <p className="text-xs text-gray-400 mt-0.5">Active vs inactive vs new registrations</p>
              <div className="flex flex-wrap items-center gap-6 mt-3">
                <PatientStatusDonut
                  active={activePatients}
                  inactive={inactivePatients}
                  newPatients={newPatients}
                />
                <div className="flex flex-col gap-3 text-sm flex-1 min-w-[180px]">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-gray-500 text-xs">Active</span>
                    </div>
                    <span className="font-bold text-gray-900">{activePatients.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                      <span className="text-gray-500 text-xs">Inactive</span>
                    </div>
                    <span className="font-bold text-gray-900">{inactivePatients}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                      <span className="text-gray-500 text-xs">New</span>
                    </div>
                    <span className="font-bold text-gray-900">{newPatients}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-800">Revenue This Month</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {weeklyRevenue
                  ? "Weekly revenue from analytics"
                  : "Weekly bars split from monthly total when revenueWeekly is not provided"}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <p className="text-xl font-bold text-gray-900">₹{revenue.toLocaleString()}</p>
                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                  {revenueGrowth >= 0 ? "+" : ""}
                  {revenueGrowth.toFixed(1)}% MoM
                </span>
              </div>
              <RevenueBarChart monthlyRevenue={revenue} weeklyRevenue={weeklyRevenue} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col">
              <p className="text-sm font-semibold text-gray-800">Success Rate</p>
              <p className="text-xs text-gray-400 mt-0.5">Consultation completion rate</p>
              <div className="flex flex-1 items-center justify-center mt-2">
                <SuccessRateGauge value={successRate} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col">
              <p className="text-sm font-semibold text-gray-800">Device Utilization</p>
              <p className="text-xs text-gray-400 mt-0.5">Current device usage rate</p>
              <div className="flex flex-1 items-center justify-center mt-4">
                <DeviceUtilizationGauge value={deviceUtil} />
              </div>
            </div>
          </div>

          {isHealthError && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              System health could not be loaded. Other metrics are up to date.
            </p>
          )}

          {healthData && !isHealthError && (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-sm font-semibold text-gray-800">System Health</p>
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  <span className="font-medium">
                    {healthSummary.healthy}/{healthSummary.total} Services Healthy
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceList.map((svc) => (
                  <ServiceCard
                    key={svc.name}
                    name={svc.name}
                    icon={svc.icon}
                    status={svc.status}
                    responseTime={svc.responseTime}
                    uptime={svc.uptime}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border text-sm text-gray-600">
              Last updated: {new Date(dashboardData.generatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </DashboardBodyWrapper>
  );
}
