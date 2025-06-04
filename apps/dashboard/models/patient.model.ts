import { z } from "zod";
import { userModelDataSchema } from "./user.model";
import { LanguageModelDataSchema } from "./language.model";
import { DistrictModelDataSchema } from "./district.model";

export const patientModeldataSchema = z.object({
  id: z.string(),
  contactNumber: z.string(),
  code: z.string(),
  name: z.string(),
  email: z.string(),
  gender: z.string(),
  dob: z.string(),
  password: z.string().optional().nullable(),
  address: z.string(),
  districtId: z.string(),
  pincode: z.string(),
  createdBy: z.string(),
  updatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  languageId: z.string(),
  status: z.string(),
  creator: userModelDataSchema.optional().nullable(),
  updater: userModelDataSchema.optional().nullable(),
  language: LanguageModelDataSchema.optional().nullable(),
  district: DistrictModelDataSchema.optional().nullable(),
});

export const patientModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: patientModeldataSchema.optional().nullable(),
});

export type PatientModelData = z.infer<typeof patientModeldataSchema>;
export type PatientModel = z.infer<typeof patientModelSchema>;
