import { z } from "zod";
import { PaymentCycle, StatusEnum, WeekDays, Gender, DeviceStatusEnum } from "./enums";
import { CityModelDataSchema } from "./city.model";
import { userModelDataSchema, CreateUserDtoSchema } from "./user.model";
import { NrvSplitDataSchema } from "./nrv.model";

export const DeviceModelDataSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional().nullable(),
  codeSequence: z.number().optional().nullable(),
  tabletID: z.string().optional().nullable(),
  deviceID: z.string().optional().nullable(),
  otoscopeID: z.string().optional().nullable(),
  tabletAppVersion: z.string().optional().nullable(),
  status: z.nativeEnum(DeviceStatusEnum),
});

export const PricingSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Test name is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().min(1, "Description is required"),
  status: z.nativeEnum(StatusEnum),
});

export const CentreModelDataSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  user: userModelDataSchema.optional(),
  creator: userModelDataSchema.optional(),
  updater: userModelDataSchema.optional(),
  code: z.string().optional(),
  codeSequence: z.number().optional(),
  address: z.string(),
  cityId: z.string(),
  pincode: z.string(),
  contactNumber: z.string(),
  entName: z.string(),
  assistantName: z.string(),
  assistantContactNumber: z.string(),
  isOurAssistant: z.boolean().optional(),
  paymentCycle: z.nativeEnum(PaymentCycle),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  workingDays: z.array(z.nativeEnum(WeekDays)),
  workingTimeStart: z.string(),
  workingTimeEnd: z.string(),
  breakTimeStart: z.string(),
  breakTimeEnd: z.string(),
  pricing: z.array(PricingSchema).default([]),
  centrePricing: z.array(PricingSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  city: CityModelDataSchema.optional(),
  device: DeviceModelDataSchema.optional().nullable(),
  nrvSplitId: z.string().optional().nullable(),
  nrvSplit: NrvSplitDataSchema.optional().nullable(),
  /** ERP team-management employee id (ASM designation) */
  managerId: z.string().optional().nullable(),
});

export const CreateCentreModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CentreModelDataSchema.nullable(),
});
export const CentreModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.union([
    // Format 1: Paginated response with nested data
    z.object({
      data: z.array(CentreModelDataSchema.nullable()).nullable(),
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
      page: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrevious: z.boolean(),
    }).nullable(),
    // Format 2: Direct array response
    z.array(CentreModelDataSchema.nullable()).nullable(),
  ]),
});
// Schema for user data in create/update operations (allows optional id, createdAt, updatedAt, gender)
const CreateCentreUserSchema = CreateUserDtoSchema.extend({
  id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
});

export const CreateCenterProfileSchema = z.object({
  user: CreateCentreUserSchema,
  centre: CentreModelDataSchema,
});
export type CentreModel = z.infer<typeof CentreModelSchema>;
export type CreateCentreModel = z.infer<typeof CreateCentreModelSchema>;
export type CentreModelData = z.infer<typeof CentreModelDataSchema>;
export type CreateCenterProfile = z.infer<typeof CreateCenterProfileSchema>;
export type Pricing = z.infer<typeof PricingSchema>;
