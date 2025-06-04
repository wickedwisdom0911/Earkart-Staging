import { z } from "zod";
import { TestStatus, Ear, TympType } from "./enums";

export const TympanometryReadingModelDataSchema = z.object({
  id: z.string(),
  tympanometryId: z.string(),
  ear: z.nativeEnum(Ear),
  peakPressure: z.number(),
  staticCompliance: z.number(),
  earCanalVolume: z.number(),
  tympType: z.nativeEnum(TympType),
});

export const TympanometryTestModelDataSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  status: z.nativeEnum(TestStatus),
  readings: z.array(TympanometryReadingModelDataSchema).optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TympanometryReadingModelData = z.infer<
  typeof TympanometryReadingModelDataSchema
>;
export type TympanometryTestModelData = z.infer<
  typeof TympanometryTestModelDataSchema
>;
