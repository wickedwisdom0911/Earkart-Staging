import { z } from "zod";
import { ReportType } from "./enums";

// Initiate Report Upload - Request
export const InitiateReportUploadRequestSchema = z.object({
  consultationId: z.string(),
  reportType: z.nativeEnum(ReportType),
  fileName: z.string(),
  contentType: z.string(),
});

// Initiate Report Upload - Response (matching actual backend response)
export const InitiateReportUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    presignedUrl: z.string(), // Note: lowercase 'p' to match backend
    s3Key: z.string(),
    uploadId: z.string(),
    expiresAt: z.string(),
    message: z.string(),
  }).nullable(),
});

// Complete Report Upload - Request
export const CompleteReportUploadRequestSchema = z.object({
  uploadId: z.string(),
  consultationId: z.string(),
  reportType: z.nativeEnum(ReportType),
});

// Complete Report Upload - Response
export const CompleteReportUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    consultationId: z.string(),
    reportType: z.string(),
    fileUrl: z.string(), // Backend returns 'fileUrl' not 'reportUrl'
    s3Key: z.string(),
    message: z.string(),
    reportId: z.string().optional(),
  }).nullable(),
});

// Type exports
export type InitiateReportUploadRequest = z.infer<typeof InitiateReportUploadRequestSchema>;
export type InitiateReportUploadResponse = z.infer<typeof InitiateReportUploadResponseSchema>;
export type CompleteReportUploadRequest = z.infer<typeof CompleteReportUploadRequestSchema>;
export type CompleteReportUploadResponse = z.infer<typeof CompleteReportUploadResponseSchema>;