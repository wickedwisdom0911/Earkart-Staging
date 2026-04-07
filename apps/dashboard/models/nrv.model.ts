import { z } from "zod";

// ─── NRV Split Type ───────────────────────────────────────────────────────────

export const NrvSplitTypeDataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const NrvSplitTypeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: NrvSplitTypeDataSchema.nullable().optional(),
});

export const NrvSplitTypeListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(NrvSplitTypeDataSchema),
});

export type NrvSplitTypeData = z.infer<typeof NrvSplitTypeDataSchema>;
export type NrvSplitTypeResponse = z.infer<typeof NrvSplitTypeResponseSchema>;
export type NrvSplitTypeListResponse = z.infer<typeof NrvSplitTypeListResponseSchema>;

// ─── NRV Split ────────────────────────────────────────────────────────────────

export const NrvSplitDataSchema = z.object({
  id: z.string().optional(),
  nrvSplitTypeId: z.string(),
  percentageDoctor: z.number(),
  percentageEarkart: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  nrvSplitType: NrvSplitTypeDataSchema.optional().nullable(),
});

export const NrvSplitResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: NrvSplitDataSchema.nullable().optional(),
});

export const NrvSplitListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(NrvSplitDataSchema),
});

export type NrvSplitData = z.infer<typeof NrvSplitDataSchema>;
export type NrvSplitResponse = z.infer<typeof NrvSplitResponseSchema>;
export type NrvSplitListResponse = z.infer<typeof NrvSplitListResponseSchema>;
