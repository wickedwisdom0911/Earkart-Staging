import { z } from "zod";
import { 
  MetricType, 
  AggregationType, 
  GroupByType, 
  TimeRangeType, 
  ConsultationStatus, 
  TestStatus, 
  PatientSoldStatus, 
  Gender 
} from "./enums";

export const MetricTypeSchema = z.nativeEnum(MetricType);
export const AggregationSchema = z.nativeEnum(AggregationType);
export const GroupBySchema = z.nativeEnum(GroupByType);
export const TimeRangeSchema = z.nativeEnum(TimeRangeType);
export const ConsultationStatusSchema = z.nativeEnum(ConsultationStatus);
export const TestStatusSchema = z.nativeEnum(TestStatus);
export const PatientSoldStatusSchema = z.nativeEnum(PatientSoldStatus);
export const GenderSchema = z.nativeEnum(Gender);
export const TrendSchema = z.enum(["up", "down", "stable"]);

export const MetricsFiltersSchema = z.object({
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

export const MetricsRequestSchema = z.object({
  metricType: MetricTypeSchema,
  aggregation: AggregationSchema,
  groupBy: GroupBySchema,
  filters: MetricsFiltersSchema,
  limit: z.number().optional().default(1000),
  offset: z.number().optional().default(0),
});

export const MetricsSummarySchema = z.object({
  total: z.number(),
  average: z.number(),
  min: z.number(),
  max: z.number(),
  growthRate: z.number(),
  trend: TrendSchema,
});

export const MetricsDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  metadata: z.record(z.any()).optional(),
  percentageChange: z.number().optional(),
  date: z.string().optional(),
});

// Updated timeRange schema to match API response
export const MetricsTimeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
  preset: z.string().optional(),
});

// Core metrics response schema (the actual data structure)
export const MetricsResponseSchema = z.object({
  metricType: MetricTypeSchema,
  summary: MetricsSummarySchema,
  data: z.array(MetricsDataPointSchema),
  timeRange: MetricsTimeRangeSchema,
  filters: MetricsFiltersSchema,
  totalRecords: z.number(),
  executionTime: z.number(),
  generatedAt: z.string(),
});

// API wrapper schema that matches your actual API response
export const ApiMetricsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: MetricsResponseSchema,
});

// Generic API response wrapper for other endpoints
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
  });
};

// Type exports
export type MetricsRequest = z.infer<typeof MetricsRequestSchema>;
export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;
export type ApiMetricsResponse = z.infer<typeof ApiMetricsResponseSchema>;
export type MetricsFilters = z.infer<typeof MetricsFiltersSchema>;
export type MetricsSummary = z.infer<typeof MetricsSummarySchema>;
export type MetricsDataPoint = z.infer<typeof MetricsDataPointSchema>;
export type MetricsTimeRange = z.infer<typeof MetricsTimeRangeSchema>;