import { z } from "zod";
import { patientModeldataSchema } from "./patient.model";

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  centreId: z.string().uuid(),
  audiologistId: z.string().uuid().nullable(),
  consultationId: z.string().uuid().optional().nullable(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  status: z.string(),
  notes: z.string().optional().nullable(),
  patient: patientModeldataSchema.optional().nullable(),
});

export const CheckAvailabilityRequestSchema = z.object({
  centreId: z.string(),
  audiologistId: z.string().optional(),
  date: z.string(),
  duration: z.number(),
});

export const GenericAppointmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.string().or(z.array(z.string())).optional().nullable(),
});

export const AppointmentListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(AppointmentSchema).optional().nullable(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentRequestSchema = z.object({
  patientId: z.string().uuid(),
  centreId: z.string().uuid(),
  audiologistId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  status: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export type CreateAppointmentRequest = z.infer<
  typeof CreateAppointmentRequestSchema
>;

export type CheckAvailabilityRequest = z.infer<
  typeof CheckAvailabilityRequestSchema
>;

export const UpdateAppointmentRequestSchema = z.object({
  id: z.string().uuid(),
  audiologistId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  status: z.enum(["REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  notes: z.string().optional(),
  updatedBy: z.string().uuid(),
});

export type UpdateAppointmentRequest = z.infer<
  typeof UpdateAppointmentRequestSchema
>;

export const AppointmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: AppointmentSchema.nullable(),
});

export const AppointmentStatsSchema = z.object({
  total: z.number(),
  byStatus: z.record(z.number()),
  upcoming: z.number(),
  completed: z.number(),
  cancelled: z.number(),
});

export const GetAllAppointmentsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    appointments: z.array(AppointmentSchema),
    total: z.number(),
  }),
});

export type AppointmentStats = z.infer<typeof AppointmentStatsSchema>;
export type GetAllAppointmentsResponse = z.infer<
  typeof GetAllAppointmentsResponseSchema
>;
