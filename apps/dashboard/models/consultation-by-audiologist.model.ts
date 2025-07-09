import { z } from "zod";

// Test result schemas
const ACTestSchema = z.object({
  ear: z.enum(["LEFT", "RIGHT"]),
  frequencyHz: z.number(),
  thresholdDb: z.number(),
  response: z.boolean(),
  maskingUsed: z.boolean(),
  maskingEar: z.enum(["LEFT", "RIGHT"]).nullable(),
  maskingThresholdDb: z.number().nullable(),
});

const BCTestSchema = z.object({
  ear: z.enum(["LEFT", "RIGHT"]),
  frequencyHz: z.number(),
  thresholdDb: z.number(),
  response: z.boolean(),
  maskingUsed: z.boolean(),
  maskingEar: z.enum(["LEFT", "RIGHT"]).nullable(),
  maskingThresholdDb: z.number().nullable(),
});

const SpeechTestSchema = z.object({
  ear: z.enum(["LEFT", "RIGHT"]),
  srtDb: z.number(),
  sdScore: z.number(),
});

const TympReadingSchema = z.object({
  ear: z.enum(["LEFT", "RIGHT"]),
  peakPressure: z.number(),
  staticCompliance: z.number(),
  earCanalVolume: z.number(),
  tympType: z.enum(["A", "B", "C"]),
});

const FrequencyResponseSchema = z.object({
  frequencyHz: z.number(),
  responseDb: z.number(),
});

const OAEEarTestSchema = z.object({
  ear: z.enum(["LEFT", "RIGHT"]),
  passed: z.boolean(),
  frequencyResponses: z.array(FrequencyResponseSchema),
});

const OtoscopyImageSchema = z.object({
  ear: z.enum(["LEFT", "RIGHT"]),
  imageUrl: z.string(),
  notes: z.string(),
});

// Main test schemas
const AudiometrySchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: z.string().nullable(),
  acTests: z.array(ACTestSchema),
  bcTests: z.array(BCTestSchema),
  speechTests: z.array(SpeechTestSchema),
});

const TympanometrySchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: z.string(),
  readings: z.array(TympReadingSchema),
});

const OAESchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: z.string(),
  earTests: z.array(OAEEarTestSchema),
});

const OtoscopySchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: z.string(),
  otoscopyImages: z.array(OtoscopyImageSchema),
});

// Main consultation schema
export const ConsultationByAudiologistSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  centreId: z.string(),
  audiologistId: z.string(),
  patientStatus: z.enum(["REQUESTED", "CONFIRMED", "CANCELLED"]),
  audiologistStatus: z.enum(["PENDING", "ACCEPTED", "REJECTED", "JOINED"]),
  notes: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  audiometry: AudiometrySchema.nullable().optional(),
  tympanometry: TympanometrySchema.nullable().optional(),
  oae: OAESchema.nullable().optional(),
  otoscopy: OtoscopySchema.nullable().optional(),
  patient: z.any().optional(),
  centre: z.any().optional(),
  audiologist: z.any().optional(),
  questionnaire: z.any().optional(),
});

export const ConsultationByAudiologistResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(ConsultationByAudiologistSchema),
});

export type ConsultationByAudiologist = z.infer<typeof ConsultationByAudiologistSchema>;
export type ConsultationByAudiologistResponse = z.infer<typeof ConsultationByAudiologistResponseSchema>; 