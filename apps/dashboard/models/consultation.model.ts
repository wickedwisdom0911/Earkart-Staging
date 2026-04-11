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

/**
 * Map SNHL fields into nested `patient` (canonical). Also snake_case → camelCase on patient.
 * Legacy top-level `hearingLoss` / `hearingLossSeverity` on consultation are folded into `patient` then removed.
 */
function mapConsultationHearingFields(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input !== "object" || Array.isArray(input)) return input;
  const o = input as Record<string, unknown>;
  const out = { ...o } as Record<string, unknown>;

  let patient: Record<string, unknown> | undefined;
  if (out.patient && typeof out.patient === "object" && !Array.isArray(out.patient)) {
    patient = { ...(out.patient as Record<string, unknown>) };
    const p = patient;
    if (p.hearingLoss === undefined && p.hearing_loss !== undefined) {
      p.hearingLoss = p.hearing_loss;
    }
    if (p.hearingLossSeverity === undefined && p.hearing_loss_severity !== undefined) {
      p.hearingLossSeverity = p.hearing_loss_severity;
    }
  }

  const tlHl = o.hearingLoss ?? o.hearing_loss;
  const tlSev = o.hearingLossSeverity ?? o.hearing_loss_severity;
  if (tlHl !== undefined || tlSev !== undefined) {
    const base = patient ?? {};
    if (base.hearingLoss === undefined && tlHl !== undefined) {
      base.hearingLoss = tlHl;
    }
    if (base.hearingLossSeverity === undefined && tlSev !== undefined) {
      base.hearingLossSeverity = tlSev;
    }
    out.patient = base;
  } else if (patient) {
    out.patient = patient;
  }

  delete out.hearingLoss;
  delete out.hearing_loss;
  delete out.hearingLossSeverity;
  delete out.hearing_loss_severity;

  return out;
}

// Make consultation schema very lenient - match backend structure exactly
const ConsultationModelDataSchemaInner = z.object({
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
  // SNHL lives on nested `patient` — see patient.model.ts (hearingLoss, hearingLossSeverity)
}).passthrough(); // Allow any extra fields

export const ConsultationModelDataSchema = z.preprocess(
  mapConsultationHearingFields,
  ConsultationModelDataSchemaInner
);

export const ConsultationModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.union([
    // Format 1: Paginated response with nested data
    z.object({
      data: z.array(ConsultationModelDataSchema).nullable(),
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
      page: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrevious: z.boolean(),
    }).nullable(),
    // Format 2: Direct array response (backward compatibility)
    z.array(ConsultationModelDataSchema),
    // Format 3: Single consultation object
    ConsultationModelDataSchema,
    // Format 4: Null
    z.null(),
  ]),
});

export type ConsultationRecordingModelData = z.infer<
  typeof ConsultationRecordingModelDataSchema
>;
export type ConsultationModelData = z.infer<typeof ConsultationModelDataSchema>;
export type ConsultationModel = z.infer<typeof ConsultationModelSchema>;

// Helper type for paginated response data
export interface PaginatedConsultationData {
  data: ConsultationModelData[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Single consultation from GET /consultation/get-by-id (or list item), regardless of whether
 * `data` is a plain object, an array, or a paginated wrapper — so fields like `hearingLoss` are not lost.
 */
export function getConsultationFromQueryResponse(
  response:
    | Pick<ConsultationModel, "success" | "data">
    | null
    | undefined
): ConsultationModelData | null {
  if (!response?.success || response.data == null) return null;
  const list = extractConsultations(response.data as ConsultationModel["data"]);
  return list[0] ?? null;
}

/** Read SNHL flag from nested `patient` (or legacy top-level consultation). */
export function getHearingLossFromConsultationData(
  c: ConsultationModelData | null | undefined
): boolean {
  if (!c) return false;
  const patient = c.patient as Record<string, unknown> | null | undefined;
  let v: unknown =
    patient?.hearingLoss ??
    patient?.hearing_loss;
  if (v === undefined || v === null) {
    const root = c as Record<string, unknown>;
    v = root.hearingLoss ?? root.hearing_loss;
  }
  if (v === true || v === "true" || v === 1) return true;
  if (v === false || v === "false" || v === 0) return false;
  return Boolean(v);
}

/** Read severity from nested `patient` (or legacy top-level). */
export function getHearingLossSeverityFromConsultationData(
  c: ConsultationModelData | null | undefined
): string | null | undefined {
  if (!c) return undefined;
  const patient = c.patient as Record<string, unknown> | null | undefined;
  let s: unknown =
    patient?.hearingLossSeverity ?? patient?.hearing_loss_severity;
  if (s === undefined || s === null) {
    const root = c as Record<string, unknown>;
    s = root.hearingLossSeverity ?? root.hearing_loss_severity;
  }
  if (s === null || s === undefined) return s;
  return String(s);
}

// Helper function to extract consultations array from response data
export function extractConsultations(
  data: ConsultationModel["data"]
): ConsultationModelData[] {
  if (!data) return [];
  
  // Check if it's a paginated response
  if (
    typeof data === "object" &&
    !Array.isArray(data) &&
    "data" in data &&
    Array.isArray(data.data)
  ) {
    return data.data.filter((c): c is ConsultationModelData => c !== null);
  }
  
  // Check if it's a direct array
  if (Array.isArray(data)) {
    return data.filter((c): c is ConsultationModelData => c !== null);
  }
  
  // Check if it's a single consultation object
  if (typeof data === "object" && "id" in data && "patientId" in data) {
    return [data];
  }
  
  return [];
}

/**
 * Merge partial consultation fields into React Query cached `ConsultationModel` (any `data` shape).
 * Call after PUT so SNHL (and similar) stay visible even when a follow-up GET omits those fields.
 */
export function patchConsultationInQueryCache(
  previous: ConsultationModel | undefined,
  consultationId: string,
  patch: Partial<ConsultationModelData>
): ConsultationModel | undefined {
  if (!previous?.success) return previous;
  const data = previous.data;
  if (data == null) return previous;

  const apply = (c: ConsultationModelData): ConsultationModelData =>
    c.id === consultationId ? { ...c, ...patch } : c;

  if (Array.isArray(data)) {
    return { ...previous, data: data.map(apply) };
  }

  if (
    typeof data === "object" &&
    !Array.isArray(data) &&
    "data" in data &&
    Array.isArray((data as PaginatedConsultationData).data)
  ) {
    const p = data as PaginatedConsultationData;
    return {
      ...previous,
      data: {
        ...p,
        data: p.data.map(apply),
      },
    };
  }

  if (
    typeof data === "object" &&
    "id" in data &&
    (data as ConsultationModelData).id === consultationId
  ) {
    return {
      ...previous,
      data: apply(data as ConsultationModelData),
    };
  }

  return previous;
}

/** Merge consultation from PUT response into cached query data when the API returns a body. */
export function mergePutResponseIntoConsultationCache(
  previous: ConsultationModel | undefined,
  putResponse: ConsultationModel,
  consultationId: string
): ConsultationModel | undefined {
  if (!putResponse?.success || !previous?.success) return previous;
  const incoming = extractConsultations(
    putResponse.data as ConsultationModel["data"]
  )[0];
  if (!incoming || incoming.id !== consultationId) return previous;
  return patchConsultationInQueryCache(previous, consultationId, incoming);
}

// Helper function to check if response is paginated
export function isPaginatedResponse(
  data: ConsultationModel["data"]
): data is PaginatedConsultationData {
  return (
    typeof data === "object" &&
    !Array.isArray(data) &&
    data !== null &&
    "data" in data &&
    "total" in data &&
    "hasNext" in data
  );
}

// Helper function to get pagination info
export function getPaginationInfo(
  data: ConsultationModel["data"]
): PaginatedConsultationData | null {
  if (isPaginatedResponse(data)) {
    return data;
  }
  return null;
}

// ETF Intact Types
export type ETFIntactCurve = z.infer<typeof ETFIntactCurveSchema>;
export type ETFIntact = z.infer<typeof ETFIntactSchema>; // null | { ecv: number, probeToneFreq: number, ... }

// Tone Decay Types
export type ToneDecayReading = z.infer<typeof ToneDecayReadingSchema>;
export type ToneDecayTestModelData = z.infer<typeof ToneDecayTestModelDataSchema>;
