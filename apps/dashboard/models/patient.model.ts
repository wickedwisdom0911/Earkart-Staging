import { z } from "zod";
import { userModelDataSchema } from "./user.model";
import { LanguageModelDataSchema } from "./language.model";
import { CityModelDataSchema } from "./city.model";

export const patientModeldataSchema = z.object({
  id: z.string(),
  contactNumber: z.string(),
  code: z.string().optional(),
  name: z.string(),
  email: z.string(),
  gender: z.string(),
  dob: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  address: z.string(),
  cityId: z.string().optional().nullable(),
  pincode: z.string(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  languageId: z.string(),
  status: z.string().optional(),
  creator: userModelDataSchema.optional().nullable(),
  updater: userModelDataSchema.optional().nullable(),
  language: LanguageModelDataSchema.optional().nullable(),
  city: CityModelDataSchema.optional().nullable(),
});

export const patientModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: patientModeldataSchema.optional().nullable(),
});

export const patientListResponseSchema = z.object({
  success: patientModelSchema.shape.success,
  message: patientModelSchema.shape.message,
  data: z.array(patientModeldataSchema),
});

export type PatientListResponse = z.infer<typeof patientListResponseSchema>;

export type PatientModelData = z.infer<typeof patientModeldataSchema>;
export type PatientModel = z.infer<typeof patientModelSchema>;

