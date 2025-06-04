import { z } from "zod";
import { TestStatus, Ear } from "./enums";

export const OtoscopyImageModelDataSchema = z.object({
  id: z.string(),
  otoscopyId: z.string(),
  ear: z.nativeEnum(Ear),
  imageUrl: z.string(),
  capturedAt: z.string(),
  notes: z.string().optional().nullable(),
});

export const OtoscopyTestModelDataSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  notes: z.string().optional().nullable(),
  capturedAt: z.string(),
  otoscopyImages: z.array(OtoscopyImageModelDataSchema).optional().nullable(),
  status: z.nativeEnum(TestStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OtoscopyImageModelData = z.infer<
  typeof OtoscopyImageModelDataSchema
>;
export type OtoscopyTestModelData = z.infer<typeof OtoscopyTestModelDataSchema>;
