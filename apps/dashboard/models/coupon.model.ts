import { z } from "zod";

export const CouponDataSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  description: z.string(),
  type: z.string(),
  value: z.number(),
  maxDiscount: z.number(),
  minOrderAmount: z.number(),
  startAt: z.string(),
  endAt: z.string(),
  usageLimitPerUser: z.number().optional(),
  usageLimitTotal: z.number().optional(),
  usedCount: z.number().optional(),
  applicableCentreId: z.string().optional(),
  applicablePricingId: z.string().optional(),
  status: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CouponListResponseSchema = z.object({
  data: z.array(CouponDataSchema).nullable().default([]),
  total: z.number().nullable().default(0),
  limit: z.number().nullable().default(0),
  offset: z.number().nullable().default(0),
  page: z.number().nullable().default(0),
  totalPages: z.number().nullable().default(0),
  hasNext: z.boolean().optional().default(false),
  hasPrevious: z.boolean().optional().default(false),
});
export const CreateCouponModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CouponDataSchema.nullable().optional(),
});
export type CreateCouponModel = z.infer<typeof CreateCouponModelSchema>;
export type CouponDataModel = z.infer<typeof CouponDataSchema>;
export type CouponListResponse = z.infer<typeof CouponListResponseSchema>;