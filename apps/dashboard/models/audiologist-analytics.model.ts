import { z } from "zod";

export const AudiologistMetricTypeSchema = z.enum(["consultations", "audiologists"]);
export const AggregationSchema = z.enum(["count", "sum", "avg"]);
export const GroupBySchema = z.enum(["day", "week", "month", "year"]);
export const TimeRangeSchema = z.enum(["daily", "weekly", "monthly", "yearly"]);
export const ConsultationStatusSchema = z.enum(["PENDING", "COMPLETED", "CANCELLED"]);
export const TestStatusSchema = z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const PatientSoldStatusSchema = z.enum(["UNKNOWN", "SOLD", "NOT_SOLD"]);
export const GenderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export const TrendSchema = z.enum(["up", "down", "stable"]);

export const AudiologistMetricsFiltersSchema = z.object({
  timeRange: TimeRangeSchema,
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  centreIds: z.array(z.string()).optional(),
  audiologistIds: z.array(z.string()).optional(),
  cityIds: z.array(z.string()).optional(),
  stateIds: z.array(z.string()).optional(),
  consultationStatuses: z.array(ConsultationStatusSchema).optional(),
  testStatuses: z.array(TestStatusSchema).optional(),
  patientSoldStatuses: z.array(PatientSoldStatusSchema).optional(),
  genders: z.array(GenderSchema).optional(),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
});

export const AudiologistMetricsRequestSchema = z.object({
  metricType: AudiologistMetricTypeSchema,
  aggregation: AggregationSchema,
  groupBy: GroupBySchema,
  filters: AudiologistMetricsFiltersSchema,
  limit: z.number().optional().default(1000),
  offset: z.number().optional().default(0),
});

export const AudiologistMetricsSummarySchema = z.object({
  total: z.number(),
  average: z.number(),
  min: z.number(),
  max: z.number(),
  growthRate: z.number(),
  trend: TrendSchema,
});

export const AudiologistMetricsDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  metadata: z.record(z.any()).optional(),
  percentageChange: z.number().optional(),
  date: z.string().optional(),
});

// Updated timeRange schema to match API response
export const AudiologistMetricsTimeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
  preset: z.string().optional(),
});

// Core metrics response schema (the actual data structure)
export const AudiologistMetricsResponseSchema = z.object({
  metricType: AudiologistMetricTypeSchema,
  summary: AudiologistMetricsSummarySchema,
  data: z.array(AudiologistMetricsDataPointSchema),
  timeRange: AudiologistMetricsTimeRangeSchema,
  filters: AudiologistMetricsFiltersSchema,
  totalRecords: z.number(),
  executionTime: z.number(),
  generatedAt: z.string(),
});

// API wrapper schema that matches your actual API response
export const ApiAudiologistMetricsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: AudiologistMetricsResponseSchema,
});

// Type exports
export type AudiologistMetricsRequest = z.infer<typeof AudiologistMetricsRequestSchema>;
export type AudiologistMetricsResponse = z.infer<typeof AudiologistMetricsResponseSchema>;
export type ApiAudiologistMetricsResponse = z.infer<typeof ApiAudiologistMetricsResponseSchema>;
export type AudiologistMetricsFilters = z.infer<typeof AudiologistMetricsFiltersSchema>;
export type AudiologistMetricsSummary = z.infer<typeof AudiologistMetricsSummarySchema>;
export type AudiologistMetricsDataPoint = z.infer<typeof AudiologistMetricsDataPointSchema>;
export type AudiologistMetricsTimeRange = z.infer<typeof AudiologistMetricsTimeRangeSchema>; 