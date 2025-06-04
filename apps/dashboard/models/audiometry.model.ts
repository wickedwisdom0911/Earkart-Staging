import { z } from "zod";
import { TestStatus, Ear } from "./enums";

export const ACReadingModelDataSchema = z.object({
  id: z.string(),
  audiometryId: z.string(),
  ear: z.nativeEnum(Ear),
  frequencyHz: z.number(),
  thresholdDb: z.number(),
  maskingUsed: z.boolean(),
  maskingEar: z.nativeEnum(Ear).optional().nullable(),
});

export const BCReadingModelDataSchema = z.object({
  id: z.string(),
  audiometryId: z.string(),
  ear: z.nativeEnum(Ear),
  frequencyHz: z.number(),
  thresholdDb: z.number(),
  maskingUsed: z.boolean(),
});

export const SpeechReadingModelDataSchema = z.object({
  id: z.string(),
  audiometryId: z.string(),
  ear: z.nativeEnum(Ear),
  srtDb: z.number(),
  sdScore: z.number(),
});

export const AudiometryTestModelDataSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  status: z.nativeEnum(TestStatus),
  acTests: z.array(ACReadingModelDataSchema).optional().nullable(),
  bcTests: z.array(BCReadingModelDataSchema).optional().nullable(),
  speechTests: z.array(SpeechReadingModelDataSchema).optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ACReadingModelData = z.infer<typeof ACReadingModelDataSchema>;
export type BCReadingModelData = z.infer<typeof BCReadingModelDataSchema>;
export type SpeechReadingModelData = z.infer<
  typeof SpeechReadingModelDataSchema
>;
export type AudiometryTestModelData = z.infer<
  typeof AudiometryTestModelDataSchema
>;
