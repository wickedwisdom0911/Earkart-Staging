import { z } from "zod";
import {
  PatientConsultationStatus,
  AudiologistConsultationStatus,
  SessionStatus,
} from "./enums";
import { AudiometryTestModelDataSchema } from "./audiometry.model";
import { TympanometryTestModelDataSchema } from "./tympanometry.model";
import { OAETestModelDataSchema } from "./oae.model";
import { OtoscopyTestModelDataSchema } from "./otoscopy.model";

export const ConsultationRecordingModelDataSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  recordingUrl: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ConsultationModelDataSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  audiologistId: z.string().optional().nullable(),
  centreId: z.string(),
  patientStatus: z.nativeEnum(PatientConsultationStatus),
  audiologistStatus: z.nativeEnum(AudiologistConsultationStatus),
  audiometry: AudiometryTestModelDataSchema.optional().nullable(),
  tympanometry: TympanometryTestModelDataSchema.optional().nullable(),
  oae: OAETestModelDataSchema.optional().nullable(),
  otoscopy: OtoscopyTestModelDataSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(SessionStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
  patient: z.unknown().optional().nullable(),
  audiologist: z.unknown().optional().nullable(),
  centre: z.unknown().optional().nullable(),
  recordings: z
    .array(ConsultationRecordingModelDataSchema)
    .optional()
    .nullable(),
});

export const ConsultationModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.union([
    ConsultationModelDataSchema,
    z.array(ConsultationModelDataSchema),
    z.null(),
  ]),
});

export type ConsultationRecordingModelData = z.infer<
  typeof ConsultationRecordingModelDataSchema
>;
export type ConsultationModelData = z.infer<typeof ConsultationModelDataSchema>;
export type ConsultationModel = z.infer<typeof ConsultationModelSchema>;
