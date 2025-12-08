import { z } from "zod";
import { TestStatus, Ear, TympType } from "./enums";

// Match backend schema exactly - core fields first
export const TympanometryReadingModelDataSchema = z.object({
  ear: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]),
  peakPressure: z.number(),
  staticCompliance: z.number(),
  earCanalVolume: z.number(),
  tympType: z.union([
    z.nativeEnum(TympType),
    z.enum(["TYPE_A", "TYPE_B", "TYPE_C", "TYPE_AS", "TYPE_AD", "A", "B", "C", "As", "Ad"]),
    z.string()
  ]),
  pressureData: z.array(z.number()).optional(),
  complianceData: z.array(z.number()).optional(),
  peakCompliance: z.number().optional(),
  peakCompensatedWithECV: z.number().optional(),
  gradient: z.number().optional(),
  gradientPressure: z.number().optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  tympanometryId: z.string().optional(),
}).passthrough();

// Match backend schema exactly - only core fields
export const TympanometryTestModelDataSchema = z.object({
  status: z.union([
    z.nativeEnum(TestStatus),
    z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PENDING", "CANCELLED"]),
    z.string()
  ]).optional(),
  notes: z.string().optional(),
  readings: z.array(TympanometryReadingModelDataSchema).optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  sessionId: z.string().optional(),
  consultationId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type TympanometryReadingModelData = z.infer<
  typeof TympanometryReadingModelDataSchema
>;
export type TympanometryTestModelData = z.infer<
  typeof TympanometryTestModelDataSchema
>;
