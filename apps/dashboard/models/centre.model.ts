import { z } from "zod";
import { WeekDays } from "./enums";
import { DistrictModelDataSchema } from "./district.model";
import { userModelDataSchema } from "./user.model";

export const CentreModelDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  user: userModelDataSchema.optional(),
  code: z.string(),
  address: z.string(),
  districtId: z.string(),
  pincode: z.string(),
  contactNumber: z.string(),
  entName: z.string(),
  assistantName: z.string(),
  assistantContactNumber: z.string(),
  paymentCycle: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  workingDays: z.array(z.nativeEnum(WeekDays)),
  workingTimeStart: z.string(),
  workingTimeEnd: z.string(),
  breakTimeStart: z.string(),
  breakTimeEnd: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
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

export type CentreModel = z.infer<typeof CentreModelSchema>;
export type CreateCentreModel = z.infer<typeof CreateCentreModelSchema>;
export type CentreModelData = z.infer<typeof CentreModelDataSchema>;
