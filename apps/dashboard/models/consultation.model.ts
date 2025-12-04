import { z } from "zod";
import {
  PatientConsultationStatus,
  AudiologistConsultationStatus,
  SessionStatus,
  TestStatus,
  Ear,
  ToneDecayResult,
} from "./enums";
import { AudiometryTestModelDataSchema } from "./audiometry.model";
import { TympanometryTestModelDataSchema } from "./tympanometry.model";
import { OAETestModelDataSchema } from "./oae.model";
import { OtoscopyTestModelDataSchema } from "./otoscopy.model";
import { AudiologistModelDataSchema } from "./audiologist.model";
import { CentreModelDataSchema } from "./centre.model";
import { patientModeldataSchema } from "./patient.model";
import { RecordingModelDataSchema } from "./recording.model";

// Tone Decay Reading Schema
const ToneDecayReadingSchema = z.object({
  id: z.string().optional(),
  toneDecayId: z.string().optional(),
  ear: z.nativeEnum(Ear),
  frequencyHz: z.number(),
  startingDb: z.number(),
  finalDb: z.number().nullable().optional(),
  decayTimeSec: z.number().nullable().optional(),
  result: z.nativeEnum(ToneDecayResult),
}).passthrough();

// Tone Decay Test Schema
const ToneDecayTestModelDataSchema = z.object({
  id: z.string().optional(),
  sessionId: z.string().optional(),
  consultationId: z.string().optional(),
  status: z.nativeEnum(TestStatus).optional(),
  earTests: z.array(ToneDecayReadingSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// ETF Intact Curve Schema - all fields are optional
const ETFIntactCurveSchema = z.object({
  // Response-only fields (optional)
  id: z.string().optional(),
  etfIntactId: z.string().optional(),
  
  // All curve fields are optional
  peakCompliance: z.number().optional(),
  peakCompensatedWithECV: z.number().optional(),
  peakPressure: z.number().optional(),
  gradient: z.number().optional(),
  gradientPressure: z.number().optional(),
  pressureData: z.array(z.number()).optional(),
  complianceData: z.array(z.number()).optional(),
}).passthrough();

// ETFIntact can be null OR an object
// When object exists: ecv and probeToneFreq are REQUIRED
// Union type: null | { ecv: number, probeToneFreq: number, ... }
const ETFIntactSchema = z.union([
  z.null(),
  z.object({
    // Response-only fields (optional)
    id: z.string().optional(),
    consultationId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    
    // Required fields (when object exists)
    ecv: z.number(), // REQUIRED
    probeToneFreq: z.number(), // REQUIRED
    
    // Optional fields
    curves: z.array(ETFIntactCurveSchema).optional(),
  }).passthrough(),
]);

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
  etfIntact: ETFIntactSchema.optional(),
  toneDecay: ToneDecayTestModelDataSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(SessionStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
  patient: patientModeldataSchema.optional().nullable(),
  audiologist: AudiologistModelDataSchema.optional().nullable(),
  centre: CentreModelDataSchema.optional().nullable(),
  questionnaire: z.any(),
  audiometryReport: z.string().optional().nullable(),
  tympanometryReport: z.string().optional().nullable(),
  etfReport: z.string().optional().nullable(),
  sisiReport: z.string().optional().nullable(),
  speechReport: z.string().optional().nullable(),
  reflexesReport: z.string().optional().nullable(),
  toneReport: z.string().optional().nullable(),
  toneDecayReport: z.string().optional().nullable(),
  oaeReport: z.string().optional().nullable(),
  otoscopyReport: z.string().optional().nullable(),
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
}).passthrough();

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

// ETF Intact Types
export type ETFIntactCurve = z.infer<typeof ETFIntactCurveSchema>;
export type ETFIntact = z.infer<typeof ETFIntactSchema>; // null | { ecv: number, probeToneFreq: number, ... }

// Tone Decay Types
export type ToneDecayReading = z.infer<typeof ToneDecayReadingSchema>;
export type ToneDecayTestModelData = z.infer<typeof ToneDecayTestModelDataSchema>;
