import { z } from "zod";

export const InitiateUploadRequestSchema = z.object({
  versionName: z.string().min(1, "Version name is required"),
  versionCode: z.number().positive("Version code must be a positive number"),
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  releaseNotes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type InitiateUploadRequest = z.infer<
  typeof InitiateUploadRequestSchema
>;

// Nested data schema
const InitiateUploadDataSchema = z.object({
  uploadId: z.string(),
  presignedUrl: z.string().url(),
  appProvisioningId: z.string(),
});

// Full response schema with envelope
export const InitiateUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: InitiateUploadDataSchema.nullable(),
});

export type InitiateUploadResponse = z.infer<
  typeof InitiateUploadResponseSchema
>;

export const CompleteUploadRequestSchema = z.object({
  uploadId: z.string(),
  appProvisioningId: z.string(),
});

export type CompleteUploadRequest = z.infer<
  typeof CompleteUploadRequestSchema
>;

export const AppProvisioningSchema = z.object({
  id: z.string(),
  versionName: z.string(),
  versionCode: z.number(),
  releaseNotes: z.string().nullable(),
  apkUrl: z.string().nullable(), // Accept any string or null, validation happens in UI
  status: z.enum(["ACTIVE", "INACTIVE"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AppProvisioning = z.infer<typeof AppProvisioningSchema>;

// Nested data schema for the complete upload response
const CompleteUploadDataSchema = z.object({
  appProvisioning: AppProvisioningSchema,
});

// Full response schema with envelope
export const CompleteUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CompleteUploadDataSchema.nullable(),
});

export type CompleteUploadResponse = z.infer<
  typeof CompleteUploadResponseSchema
>;

export const GetLatestAppProvisioningParamsSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  versionName: z.string().optional(),
  minVersionCode: z.coerce.number().optional(),
});

export type GetLatestAppProvisioningParams = z.infer<
  typeof GetLatestAppProvisioningParamsSchema
>;

// Renaming the main schema for consistency to represent the full API response
export const AppProvisioningResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: AppProvisioningSchema.nullable(),
});

export const CreateAppProvisioningRequestSchema = z.object({
  versionName: z.string(),
  versionCode: z.number(),
  releaseNotes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateAppProvisioningRequest = z.infer<
  typeof CreateAppProvisioningRequestSchema
>;

// Delete response schema (204 No Content returns no body, but we'll handle it in the action)
export const DeleteAppProvisioningResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type DeleteAppProvisioningResponse = z.infer<
  typeof DeleteAppProvisioningResponseSchema
>;
