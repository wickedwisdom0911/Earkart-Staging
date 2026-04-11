import { z } from "zod";
import { userModelDataSchema } from "./user.model";
import { LanguageModelDataSchema } from "./language.model";
import { CityModelDataSchema } from "./city.model";
import { HearingLossSeverity } from "./enums";

/** SNHL flags from API (boolean / string / number). */
const patientHearingLossBooleanSchema = z
  .union([z.boolean(), z.string(), z.number()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === undefined || v === null) return v;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const s = String(v).toLowerCase().trim();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
    return undefined;
  });

export const patientModeldataSchema = z.object({
  id: z.string().optional(),
  contactNumber: z.string(),
  code: z.string().optional(),
  name: z.string(),
  email: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  dob: z.string().optional().nullable(),
  age: z.number().optional().nullable(),
  password: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  districtId: z.string().optional().nullable(),
  stateId: z.string().optional().nullable(),
  countryId: z.string().optional().nullable(),
  handledBy: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  languageId: z.string(),
  leadStatus: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  creator: userModelDataSchema.optional().nullable(),
  updater: userModelDataSchema.optional().nullable(),
  language: LanguageModelDataSchema.optional().nullable(),
  city: CityModelDataSchema.optional().nullable(),
  /** SNHL — nested under patient on consultation (GET/PUT). */
  hearingLoss: patientHearingLossBooleanSchema,
  hearingLossSeverity: z
    .union([
      z.nativeEnum(HearingLossSeverity),
      z.enum(["MILD", "MODERATE", "SEVERE", "PROFOUND"]),
      z.string(),
    ])
    .optional()
    .nullable(),
}).passthrough();

export const CreatePatientRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  languageId: z.string().min(1, "Language is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  password: z.string().optional(),
  countryId: z.string().min(1, "Country is required"),
  stateId: z.string().min(1, "State is required"),
  districtId: z.string().min(1, "District is required"),
  cityId: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  pincode: z.string().min(1, "Pincode is required"),
});

export type CreatePatientRequest = z.infer<typeof CreatePatientRequestSchema>;

export const PatientResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: patientModeldataSchema,
});

export type Patient = z.infer<typeof patientModeldataSchema>;

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

