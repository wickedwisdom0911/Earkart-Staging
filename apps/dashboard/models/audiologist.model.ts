import { z } from "zod";
import { WeekDays } from "./enums";
import { PaymentCycle } from "./enums";
import { userModelDataSchema } from "./user.model";
import { LanguageModelDataSchema } from "./language.model";
export const AudiologistModelDataSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  user: userModelDataSchema.optional().nullable(),
  creator: userModelDataSchema.optional().nullable(),
  updater: userModelDataSchema.optional().nullable(),
  languages: z.array(LanguageModelDataSchema),
  address: z.string(),
  districtId: z.string(),
  pincode: z.string(),
  contactNumber: z.string(),
  rciNumber: z.string(),
  qualifications: z.array(z.string()),
  agreementSignDate: z.string(),
  reportingDate: z.string(),
  grade: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  paymentCycle: z.nativeEnum(PaymentCycle),
  workingDays: z.array(z.nativeEnum(WeekDays)),
  workingTimeStart: z.string(),
  workingTimeEnd: z.string(),
  breakTimeStart: z.string(),
  breakTimeEnd: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createAudiologistModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: AudiologistModelDataSchema.optional().nullable(),
});
export const AudiologistModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(AudiologistModelDataSchema),
});
export const CreateAudiologistProfileSchema = z.object({
  user: userModelDataSchema,
  audiologist: AudiologistModelDataSchema,
});

export type AudiologistModeData = z.infer<typeof AudiologistModelDataSchema>;
export type AudiologistModel = z.infer<typeof AudiologistModelSchema>;
export type CreateAudiologistModel = z.infer<
  typeof createAudiologistModelSchema
>;
export type CreateAudiologistProfile = z.infer<
  typeof CreateAudiologistProfileSchema
>;
