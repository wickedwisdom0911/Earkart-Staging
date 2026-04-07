import { z } from "zod";

/** Centre item from analytics/centre-dashboard API */
export const CentreDashboardCentreSchema = z
  .object({
    centreId: z.string(),
    centreName: z.string().optional(),
    location: z.string().optional(),
    doctorContact: z.string().optional(),
    assistantContact: z.string().optional(),
    entName: z.string().optional(),
    assistantName: z.string().optional(),
    totalConsultations: z.number().optional(),
    completedConsultations: z.number().optional(),
    ptaCount: z.number().optional(),
    tympanometryCount: z.number().optional(),
    oaeCount: z.number().optional(),
    etfCount: z.number().optional(),
    toneDecayCount: z.number().optional(),
    reflexometryCount: z.number().optional(),
    // Full centre schema may be present
    centre: z.any().optional(),
    isOurAssistant: z.boolean().optional(),
  })
  .passthrough();

export const CentreDashboardResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z
    .object({
      totalCompletedConsultations: z.number().optional(),
      aggregatedTestCounts: z
        .object({
          pta: z.number().optional(),
          tympano: z.number().optional(),
          oae: z.number().optional(),
          etf: z.number().optional(),
          toneDecay: z.number().optional(),
          reflexometry: z.number().optional(),
        })
        .passthrough()
        .optional(),
      centres: z.array(CentreDashboardCentreSchema).optional(),
      timeRange: z.any().optional(),
    })
    .passthrough(),
});

/** Query params for analytics/centre-dashboard API */
export interface CentreDashboardParams {
  timeRange?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  startDate?: Date | string;
  endDate?: Date | string;
  centreIds?: string[];
  audiologistIds?: string[];
  cityIds?: string[];
  stateIds?: string[];
  removeDummy?: boolean;
  consultationStatuses?: string[];
  testStatuses?: string[];
  leadStatuses?: string[];
  genders?: string[];
  minAge?: number;
  maxAge?: number;
}

export type CentreDashboardCentre = z.infer<typeof CentreDashboardCentreSchema>;
export type CentreDashboardResponse = z.infer<typeof CentreDashboardResponseSchema>;
export type CentreDashboardData = CentreDashboardResponse["data"];
