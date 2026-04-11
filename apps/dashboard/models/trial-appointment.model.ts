import { z } from "zod";

export const TrialAppointmentStatusEnum = z.enum([
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
  "CANCELLED_BY_PATIENT",
  "CANCELLED_BY_CENTRE",
  "COMPLETED",
  "NO_SHOW",
]);

export type TrialAppointmentStatus = z.infer<typeof TrialAppointmentStatusEnum>;

/** Backend may return ids as strings or nested objects in OpenAPI examples */
export const TrialAppointmentSchema = z
  .object({
    id: z.string(),
    patientId: z.union([z.string(), z.record(z.unknown())]).optional().nullable(),
    consultationId: z.union([z.string(), z.record(z.unknown())]).optional().nullable(),
    audiologistId: z.string().optional().nullable(),
    scheduledStart: z.string(),
    scheduledEnd: z.string(),
    status: z.string(),
    notes: z.union([z.string(), z.record(z.unknown())]).optional().nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    patient: z.unknown().optional().nullable(),
    consultation: z.unknown().optional().nullable(),
    audiologist: z.unknown().optional().nullable(),
  })
  .passthrough();

export type TrialAppointment = z.infer<typeof TrialAppointmentSchema>;

export const CreateTrialAppointmentRequestSchema = z.object({
  patientId: z.string(),
  consultationId: z.string(),
  audiologistId: z.string(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  status: TrialAppointmentStatusEnum.default("REQUESTED"),
  notes: z.string().optional(),
});

export type CreateTrialAppointmentRequest = z.infer<
  typeof CreateTrialAppointmentRequestSchema
>;

export const UpdateTrialAppointmentRequestSchema = z.object({
  id: z.string(),
  patientId: z.string().optional(),
  consultationId: z.string().optional(),
  audiologistId: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  status: TrialAppointmentStatusEnum.optional(),
  notes: z.string().optional(),
});

export type UpdateTrialAppointmentRequest = z.infer<
  typeof UpdateTrialAppointmentRequestSchema
>;

export const DeleteTrialAppointmentRequestSchema = z.object({
  id: z.string().uuid(),
});

const PaginatedTrialAppointmentsInnerSchema = z.object({
  data: z.array(TrialAppointmentSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  page: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

export const GetAllTrialAppointmentsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: PaginatedTrialAppointmentsInnerSchema,
});

export type PaginatedTrialAppointments = z.infer<typeof PaginatedTrialAppointmentsInnerSchema>;

export const TrialAppointmentSingleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: TrialAppointmentSchema.nullable(),
});

/** Delete endpoint returns success envelope; `data` may be null from API */
export const DeleteTrialAppointmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
});

export type GetTrialAppointmentsParams = {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "id" | "name" | "status" | string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  id?: string;
  ids?: string[];
  startDate?: string;
  endDate?: string;
  updatedFrom?: string;
  updatedTo?: string;
  isActive?: boolean;
  patientId?: string;
  audiologistId?: string;
  consultationId?: string;
  centreId?: string;
  scheduledStartFrom?: string;
  scheduledStartTo?: string;
  status?: TrialAppointmentStatus | string;
};
