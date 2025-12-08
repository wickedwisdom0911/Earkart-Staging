import { z } from "zod";
import { TestStatus, Ear } from "./enums";

// Match backend schema exactly - no id, no foreign keys
export const ACReadingModelDataSchema = z.object({
  ear: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]),
  frequencyHz: z.number(),
  thresholdDb: z.number(),
  response: z.boolean(),
  maskingUsed: z.boolean(),
  maskingEar: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]).optional(),
  maskingThresholdDb: z.number().optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  audiometryId: z.string().optional(),
}).passthrough();

export const BCReadingModelDataSchema = z.object({
  ear: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]),
  frequencyHz: z.number(),
  thresholdDb: z.number(),
  response: z.boolean(),
  maskingUsed: z.boolean(),
  maskingEar: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]).optional(),
  maskingThresholdDb: z.number().optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  audiometryId: z.string().optional(),
}).passthrough();

export const SpeechReadingModelDataSchema = z.object({
  ear: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]),
  srtDb: z.number(),
  sdScore: z.number(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  audiometryId: z.string().optional(),
}).passthrough();

// Match backend schema exactly - only core fields
export const AudiometryTestModelDataSchema = z.object({
  status: z.union([
    z.nativeEnum(TestStatus),
    z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PENDING", "CANCELLED"]),
    z.string()
  ]).optional(),
  audiologicalDiagnosis: z.string().optional(),
  suggestion: z.string().optional(),
  recommendation: z.string().optional(),
  acTests: z.array(ACReadingModelDataSchema).optional(),
  bcTests: z.array(BCReadingModelDataSchema).optional(),
  speechTests: z.array(SpeechReadingModelDataSchema).optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  sessionId: z.string().optional(),
  consultationId: z.string().optional(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type ACReadingModelData = z.infer<typeof ACReadingModelDataSchema>;
export type BCReadingModelData = z.infer<typeof BCReadingModelDataSchema>;
export type SpeechReadingModelData = z.infer<
  typeof SpeechReadingModelDataSchema
>;
export type AudiometryTestModelData = z.infer<
  typeof AudiometryTestModelDataSchema
>;
