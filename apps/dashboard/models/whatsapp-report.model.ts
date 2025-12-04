import { z } from "zod";

// Request schema for sending WhatsApp report
export const SendWhatsAppReportRequestSchema = z.object({
  to: z.string().min(1, "Phone number is required"),
  patientName: z.string().min(1, "Patient name is required"),
  reportUrl: z.string().url("Valid report URL is required"),
  reportType: z.string().min(1, "Report type is required"),
});

export type SendWhatsAppReportRequest = z.infer<typeof SendWhatsAppReportRequestSchema>;

// Response schema for sending WhatsApp report
export const SendWhatsAppReportResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type SendWhatsAppReportResponse = z.infer<typeof SendWhatsAppReportResponseSchema>;

// Batch send request schema
export const SendWhatsAppReportBatchRequestSchema = z.object({
  recipients: z.array(z.string()).min(1, "At least one recipient is required"),
  patientName: z.string().min(1, "Patient name is required"),
  reportUrl: z.string().url("Valid report URL is required"),
  reportType: z.string().min(1, "Report type is required"),
});

export type SendWhatsAppReportBatchRequest = z.infer<typeof SendWhatsAppReportBatchRequestSchema>;

// Batch send response schema
export const SendWhatsAppReportBatchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  results: z.array(z.object({
    to: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  })),
  totalSent: z.number(),
  totalFailed: z.number(),
});

export type SendWhatsAppReportBatchResponse = z.infer<typeof SendWhatsAppReportBatchResponseSchema>;

