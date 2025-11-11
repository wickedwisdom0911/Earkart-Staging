import { z } from "zod";


export enum CouponTypeEnum {
    PERCENTAGE = "PERCENTAGE",
    FLAT = "FLAT",
  }
  
  export enum CouponStatusEnum {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    EXPIRED = "EXPIRED",
  }
  
  // New enums for filtering and sorting
  export enum CouponSortByEnum {
    CREATED_AT = "createdAt",
    UPDATED_AT = "updatedAt",
    ID = "id",
    CODE = "code",
    STATUS = "status",
  }
  
  export enum SortOrderEnum {
    ASC = "ASC",
    DESC = "DESC",
  }
  
  // Query parameters interface
  export interface GetCouponsParams {
    // Pagination
    limit?: number;
    offset?: number;
    
    // Sorting
    sortBy?: CouponSortByEnum;
    sortOrder?: SortOrderEnum;
    
    // Search and filters
    search?: string;
    id?: string;
    ids?: string[];
    
    // Date filters
    startDate?: string;
    endDate?: string;
    updatedFrom?: string;
    updatedTo?: string;
    
    // Status filters
    isActive?: boolean;
    status?: string;
    statuses?: string[];
    
    // Coupon-specific filters
    code?: string;
    type?: CouponTypeEnum;
    minValue?: number;
    maxValue?: number;
    minOrderAmount?: number;
    maxOrderAmount?: number;
    
    // Relation filters
    applicableCentreId?: string;
    applicablePricingId?: string;
    
    // Usage filters
    usageLimitPerUser?: number;
    usageLimitTotal?: number;
    minUsedCount?: number;
    maxUsedCount?: number;
    
    // Date range filters for start/end
    startAtFrom?: string;
    startAtTo?: string;
    endAtFrom?: string;
    endAtTo?: string;
    
    // Audit filters
    createdBy?: string;
    updatedBy?: string;
  }
  
  // Keep existing schemas...

export const CouponDataSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  description: z.string(),
  type: z.nativeEnum(CouponTypeEnum),
  value: z.number().nullish(),
  maxDiscount: z.number().nullish(),
  minOrderAmount: z.number().nullish(),
  startAt: z.string(),
  endAt: z.string(),
  usageLimitPerUser: z.number().optional(),
  usageLimitTotal: z.number().optional(),
  usedCount: z.number().optional(),
  applicableCentreId: z.string().nullish(),
  applicablePricingId: z.string().nullish(),
  status: z.nativeEnum(CouponStatusEnum).optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  
});

export const CouponListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
      data: z.array(CouponDataSchema).nullable().default([]),
      total: z.number().nullable().default(0),
      limit: z.number().nullable().default(0),
      offset: z.number().nullable().default(0),
      page: z.number().nullable().default(0),
      totalPages: z.number().nullable().default(0),
      hasNext: z.boolean().optional().default(false),
      hasPrevious: z.boolean().optional().default(false),
    }).nullable().optional(),
  });

// Flexible schema to accept backends that wrap arrays inside an object (e.g., { data: { items: [...] } })
export const CouponListFlexibleSchema = z.object({
  data: z.union([
    z.array(CouponDataSchema),
    z
      .object({
        items: z.array(CouponDataSchema).optional(),
        results: z.array(CouponDataSchema).optional(),
        total: z.number().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        page: z.number().optional(),
        totalPages: z.number().optional(),
        hasNext: z.boolean().optional(),
        hasPrevious: z.boolean().optional(),
      })
      .passthrough(),
  ]),
  total: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  page: z.number().optional(),
  totalPages: z.number().optional(),
  hasNext: z.boolean().optional(),
  hasPrevious: z.boolean().optional(),
});

export const CreateCouponModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CouponDataSchema.nullable().optional(),
});

export const CouponModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(CouponDataSchema),
});

export const DeleteCouponModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({}).nullish(),
});

export type CouponDataModel = z.infer<typeof CouponDataSchema>;
export type CreateCouponModel = z.infer<typeof CreateCouponModelSchema>;
export type CouponListResponse = z.infer<typeof CouponListResponseSchema>;
export type CouponModel = z.infer<typeof CouponModelSchema>;
export type DeleteCouponModel = z.infer<typeof DeleteCouponModelSchema>;