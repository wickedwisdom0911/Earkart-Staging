import { z } from "zod";
import { TestStatus, Ear, TympType } from "./enums";

export const TympanometryReadingModelDataSchema = z.object({
  id: z.string().optional(),
  tympanometryId: z.string(),
  ear: z.nativeEnum(Ear),
  peakPressure: z.number(),
  staticCompliance: z.number(),
  earCanalVolume: z.number(),
  tympType: z.nativeEnum(TympType),
  // New fields from backend (optional for backward compatibility)
  peakCompliance: z.number().optional(),
  peakCompensatedWithECV: z.number().optional(),
  gradient: z.number().optional(),
  gradientPressure: z.number().optional(),
  pressureData: z.array(z.number()).optional(),
  complianceData: z.array(z.number()).optional(),
}).passthrough(); // Allow extra fields for backward compatibility

export const TympanometryTestModelDataSchema = z.object({
  id: z.string().optional(),
  sessionId: z.string(),
  status: z.nativeEnum(TestStatus),
  readings: z.array(TympanometryReadingModelDataSchema).optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).passthrough(); // Allow extra fields for backward compatibility

export type TympanometryReadingModelData = z.infer<
  typeof TympanometryReadingModelDataSchema
>;
export type TympanometryTestModelData = z.infer<
  typeof TympanometryTestModelDataSchema
>;
