import { z } from "zod";

// Dashboard metrics schema — passthrough keeps extra keys from analytics/summary API
const DashboardMetricsSchema = z
  .object({
    totalConsultations: z.number(),
    activePatients: z.number(),
    activeAudiologists: z.number(),
    activeCentres: z.number(),
    testsCompletedToday: z.number(),
    revenueThisMonth: z.number(),
    successRate: z.number(),
    avgConsultationDuration: z.number(),
    deviceUtilization: z.number(),
    monthlyGrowthRate: z.number(),
    /** Optional breakdowns when API sends them */
    completedConsultations: z.number().optional(),
    inProgressConsultations: z.number().optional(),
    cancelledConsultations: z.number().optional(),
    pendingConsultations: z.number().optional(),
    inactivePatients: z.number().optional(),
    newPatients: z.number().optional(),
    consultationGrowthPercent: z.number().optional(),
    revenueWeekly: z.array(z.number()).optional(),
  })
  .passthrough();

// Real-time data schema
const RealTimeDataSchema = z
  .object({
    activeConsultations: z.number(),
    onlineAudiologists: z.number(),
    testsInProgress: z.number(),
    systemStatus: z.string(),
    alerts: z.array(z.any()),
    timestamp: z.string(),
  })
  .passthrough();

// Dashboard summary data schema
const DashboardSummaryDataSchema = z.object({
  dashboard: DashboardMetricsSchema,
  realTime: RealTimeDataSchema,
  generatedAt: z.string(),
});

// API response wrapper schema
export const ApiDashboardSummaryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: DashboardSummaryDataSchema,
});

// Health monitoring schemas
const MemoryUsageSchema = z.object({
  used: z.number(),
  total: z.number(),
});

const DatabaseStatusSchema = z.object({
  status: z.string(),
  responseTime: z.number(),
});

const ServiceDetailsSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  service: z.string(),
  uptime: z.number(),
  memory: MemoryUsageSchema,
  database: DatabaseStatusSchema.optional(),
});

const ServiceHealthSchema = z.object({
  status: z.string(),
  responseTime: z.number(),
  details: ServiceDetailsSchema,
});

const HealthSummarySchema = z.object({
  total: z.number(),
  healthy: z.number(),
  unhealthy: z.number(),
});

const HealthDataSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  services: z.object({
    gateway: ServiceHealthSchema,
    user: ServiceHealthSchema,
    communication: ServiceHealthSchema,
    mdm: ServiceHealthSchema,
  }),
  summary: HealthSummarySchema,
});

export const ApiHealthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: HealthDataSchema,
});

// Types
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
export type RealTimeData = z.infer<typeof RealTimeDataSchema>;
export type DashboardSummaryData = z.infer<typeof DashboardSummaryDataSchema>;
export type ApiDashboardSummaryResponse = z.infer<typeof ApiDashboardSummaryResponseSchema>;

export type MemoryUsage = z.infer<typeof MemoryUsageSchema>;
export type DatabaseStatus = z.infer<typeof DatabaseStatusSchema>;
export type ServiceDetails = z.infer<typeof ServiceDetailsSchema>;
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;
export type HealthSummary = z.infer<typeof HealthSummarySchema>;
export type HealthData = z.infer<typeof HealthDataSchema>;
export type ApiHealthResponse = z.infer<typeof ApiHealthResponseSchema>; 