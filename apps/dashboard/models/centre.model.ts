import { z } from "zod";
import { PaymentCycle, WeekDays } from "./enums";
import { DistrictModelDataSchema } from "./district.model";
import { userModelDataSchema } from "./user.model";

export const CentreModelDataSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  user: userModelDataSchema.optional(),
  code: z.string(),
  address: z.string(),
  districtId: z.string(),
  pincode: z.string(),
  contactNumber: z.string(),
  entName: z.string(),
  assistantName: z.string(),
  assistantContactNumber: z.string(),
  paymentCycle: z.nativeEnum(PaymentCycle),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  workingDays: z.array(z.nativeEnum(WeekDays)),
  workingTimeStart: z.string(),
  workingTimeEnd: z.string(),
  breakTimeStart: z.string(),
  breakTimeEnd: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  district: DistrictModelDataSchema.optional(),
});

export const CreateCentreModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CentreModelDataSchema,
});
export const CentreModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(CentreModelDataSchema),
});
export const CreateCenterProfileSchema = z.object({
  user: userModelDataSchema,
  centre: CentreModelDataSchema,
});
export type CentreModel = z.infer<typeof CentreModelSchema>;
export type CreateCentreModel = z.infer<typeof CreateCentreModelSchema>;
export type CentreModelData = z.infer<typeof CentreModelDataSchema>;
export type CreateCenterProfile = z.infer<typeof CreateCenterProfileSchema>;
