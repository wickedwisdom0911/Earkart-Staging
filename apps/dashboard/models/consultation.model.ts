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
import { AudiologistModelDataSchema } from "./audiologist.model";
import { CentreModelDataSchema } from "./centre.model";
import { patientModeldataSchema } from "./patient.model";
import { RecordingModelDataSchema } from "./recording.model";

// Back-compat: Older API shape for recordings array
export const ConsultationRecordingModelDataSchema = z.object({
  id: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  recordingUrl: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
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
  patient: patientModeldataSchema.optional().nullable(),
  audiologist: AudiologistModelDataSchema.optional().nullable(),
  centre: CentreModelDataSchema.optional().nullable(),
  questionnaire : z.any(),
  // New schema options:
  // - recordings: array of objects
  // - recordingName (string) or recordingsName (string)
  // - recording (single object)
  recordings: z
    .array(ConsultationRecordingModelDataSchema)
    .optional()
    .nullable(),
  recordingName: z.string().optional().nullable(),
  recordingsName: z.string().optional().nullable(),
  recording: RecordingModelDataSchema.optional().nullable(),
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
