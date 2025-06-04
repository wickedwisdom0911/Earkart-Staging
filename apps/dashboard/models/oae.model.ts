import { z } from "zod";
import { TestStatus, Ear } from "./enums";

export const FrequencyResponseModelDataSchema = z.object({
  id: z.string(),
  oaeReadingId: z.string(),
  frequencyHz: z.number(),
  responseDb: z.number(),
});

export const OAEReadingModelDataSchema = z.object({
  id: z.string(),
  oaeTestId: z.string(),
  ear: z.nativeEnum(Ear),
  passed: z.boolean(),
  frequencyResponses: z
    .array(FrequencyResponseModelDataSchema)
    .optional()
    .nullable(),
});

export const OAETestModelDataSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  status: z.nativeEnum(TestStatus),
  earTests: z.array(OAEReadingModelDataSchema).optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FrequencyResponseModelData = z.infer<
  typeof FrequencyResponseModelDataSchema
>;
export type OAEReadingModelData = z.infer<typeof OAEReadingModelDataSchema>;
export type OAETestModelData = z.infer<typeof OAETestModelDataSchema>;
