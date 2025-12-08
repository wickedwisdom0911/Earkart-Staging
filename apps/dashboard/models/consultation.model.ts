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

// Tone Decay Reading Schema - Match backend exactly
const ToneDecayReadingSchema = z.object({
  ear: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]),
  frequencyHz: z.number(),
  startingDb: z.number(),
  finalDb: z.number().optional(),
  decayTimeSec: z.number().optional(),
  result: z.union([
    z.nativeEnum(ToneDecayResult),
    z.enum(["POSITIVE", "NEGATIVE", "NORMAL", "ABNORMAL", "CANNOT_DETERMINE", "NOT_COMPLETED"]),
    z.string()
  ]),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  toneDecayId: z.string().optional(),
}).passthrough();

// Tone Decay Test Schema - Match backend exactly
const ToneDecayTestModelDataSchema = z.object({
  status: z.union([
    z.nativeEnum(TestStatus),
    z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PENDING", "CANCELLED"]),
    z.string()
  ]).optional(),
  earTests: z.array(ToneDecayReadingSchema).optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  sessionId: z.string().optional(),
  consultationId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// ETF Intact Curve Schema - Match backend exactly
const ETFIntactCurveSchema = z.object({
  ear: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]),
  peakCompliance: z.number(),
  peakCompensatedWithECV: z.number(),
  peakPressure: z.number(),
  gradient: z.number(),
  gradientPressure: z.number(),
  pressureData: z.array(z.number()),
  complianceData: z.array(z.number()),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  etfIntactId: z.string().optional(),
}).passthrough();

// ETFIntact Schema - Match backend exactly, but allow null
const ETFIntactSchema = z.union([
  z.null(),
  z.object({
    ecv: z.number(),
    probeToneFreq: z.number(),
    curves: z.array(ETFIntactCurveSchema).optional(),
    // Allow extra fields for backward compatibility
    id: z.string().optional(),
    consultationId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
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

// Make consultation schema very lenient - match backend structure exactly
export const ConsultationModelDataSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  audiologistId: z.string().optional().nullable(),
  centreId: z.string(),
  requestId: z.string().optional().nullable(),
  // Accept both enum and string values (backend sends strings)
  patientStatus: z.union([
    z.nativeEnum(PatientConsultationStatus),
    z.enum(["REQUESTED", "JOINED", "LEFT", "CANCELLED", "DISCONNECTED"]),
    z.string()
  ]),
  audiologistStatus: z.union([
    z.nativeEnum(AudiologistConsultationStatus),
    z.enum(["PENDING", "JOINED", "LEFT", "COMPLETED", "ACCEPTED", "DISCONNECTED"]),
    z.string()
  ]),
  // Accept both enum and string values
  status: z.union([
    z.nativeEnum(SessionStatus),
    z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"]),
    z.string()
  ]),
  // Make dates optional - backend might not always send them
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Test data - all optional, with fallback to any
  audiometry: z.union([
    AudiometryTestModelDataSchema,
    z.any()
  ]).optional().nullable(),
  tympanometry: z.union([
    TympanometryTestModelDataSchema,
    z.any()
  ]).optional().nullable(),
  oae: z.union([
    OAETestModelDataSchema,
    z.any()
  ]).optional().nullable(),
  otoscopy: z.union([
    OtoscopyTestModelDataSchema,
    z.any()
  ]).optional().nullable(),
  etfIntact: z.union([
    ETFIntactSchema,
    z.any()
  ]).optional().nullable(),
  toneDecay: z.union([
    ToneDecayTestModelDataSchema,
    z.any()
  ]).optional().nullable(),
  reflexometry: z.any().optional().nullable(),
  // Other fields - all optional
  notes: z.string().optional().nullable(),
  // Make nested schemas very lenient - use passthrough
  patient: z.union([
    patientModeldataSchema,
    z.any()
  ]).optional().nullable(),
  audiologist: z.union([
    AudiologistModelDataSchema,
    z.any()
  ]).optional().nullable(),
  centre: z.union([
    CentreModelDataSchema,
    z.any()
  ]).optional().nullable(),
  questionnaire: z.any().optional(),
  // Report URLs - all optional
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
  // Recordings - all optional
  recordings: z.array(ConsultationRecordingModelDataSchema).optional().nullable(),
  recordingName: z.string().optional().nullable(),
  recordingsName: z.string().optional().nullable(),
  recording: RecordingModelDataSchema.optional().nullable(),
  // Backend pricing fields - all optional
  consultationPricing: z.array(z.any()).optional().nullable(),
  pricing: z.array(z.any()).optional().nullable(),
  // Payment fields - all optional
  paymentId: z.string().optional().nullable(),
  selectedServices: z.array(z.any()).optional().nullable(),
}).passthrough(); // Allow any extra fields

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
