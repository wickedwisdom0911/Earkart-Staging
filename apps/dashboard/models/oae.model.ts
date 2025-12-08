import { z } from "zod";
import { TestStatus, Ear } from "./enums";

// Match backend schema exactly - no id, no foreign keys
export const FrequencyResponseModelDataSchema = z.object({
  frequencyHz: z.number(),
  responseDb: z.number(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  oaeReadingId: z.string().optional(),
}).passthrough();

export const OAEReadingModelDataSchema = z.object({
  ear: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]),
  passed: z.boolean(),
  frequencyResponses: z.array(FrequencyResponseModelDataSchema).optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  oaeTestId: z.string().optional(),
}).passthrough();

// Match backend schema exactly - only core fields
export const OAETestModelDataSchema = z.object({
  status: z.union([
    z.nativeEnum(TestStatus),
    z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PENDING", "CANCELLED"]),
    z.string()
  ]).optional(),
  notes: z.string().optional(),
  earTests: z.array(OAEReadingModelDataSchema).optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  sessionId: z.string().optional(),
  consultationId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type FrequencyResponseModelData = z.infer<
  typeof FrequencyResponseModelDataSchema
>;
export type OAEReadingModelData = z.infer<typeof OAEReadingModelDataSchema>;
export type OAETestModelData = z.infer<typeof OAETestModelDataSchema>;
