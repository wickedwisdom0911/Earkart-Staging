import { z } from "zod";
import { PaymentCycle, StatusEnum, WeekDays } from "./enums";
import { CityModelDataSchema } from "./city.model";
import { userModelDataSchema } from "./user.model";

export const DeviceModelDataSchema = z.object({
  id: z.string().optional(),
  deviceCode: z.string(),
  tabletID: z.string().optional().nullable(),
  deviceID: z.string().optional().nullable(),
  tabletAppVersion: z.string().optional().nullable(),
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
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  city: CityModelDataSchema.optional(),
  device: DeviceModelDataSchema.optional().nullable(),
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
