import { z } from "zod";
import { TestStatus, Ear } from "./enums";

export const ACReadingModelDataSchema = z.object({
  id: z.string().optional(),
  audiometryId: z.string().optional(),
  ear: z.nativeEnum(Ear),
  frequencyHz: z.number(),
  thresholdDb: z.number(), // Always require threshold value, even for no response
  maskingUsed: z.boolean(),
  maskingEar: z.nativeEnum(Ear).optional().nullable(),
  response : z.boolean(),
  maskingThresholdDb: z.number().optional().nullable(),
});

export const BCReadingModelDataSchema = z.object({
  id: z.string().optional(),
  audiometryId: z.string().optional(),
  ear: z.nativeEnum(Ear),
  frequencyHz: z.number(),
  thresholdDb: z.number(), // Always require threshold value, even for no response
  maskingUsed: z.boolean(),
   response : z.boolean(),
  maskingThresholdDb: z.number().optional().nullable(),
});

export const SpeechReadingModelDataSchema = z.object({
  id: z.string().optional(),
  audiometryId: z.string().optional(),
  ear: z.nativeEnum(Ear),
  srtDb: z.number(),
  sdScore: z.number(),
});

export const AudiometryTestModelDataSchema = z.object({
  id: z.string().optional(),
  sessionId: z.string(),
  status: z.nativeEnum(TestStatus),
  acTests: z.array(ACReadingModelDataSchema).optional().nullable(),
  bcTests: z.array(BCReadingModelDataSchema).optional().nullable(),
  speechTests: z.array(SpeechReadingModelDataSchema).optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ACReadingModelData = z.infer<typeof ACReadingModelDataSchema>;
export type BCReadingModelData = z.infer<typeof BCReadingModelDataSchema>;
export type SpeechReadingModelData = z.infer<
  typeof SpeechReadingModelDataSchema
>;
export type AudiometryTestModelData = z.infer<
  typeof AudiometryTestModelDataSchema
>;
