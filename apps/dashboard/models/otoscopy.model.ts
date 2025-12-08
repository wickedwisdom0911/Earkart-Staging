import { z } from "zod";
import { TestStatus, Ear } from "./enums";

// Match backend schema exactly - core fields first
export const OtoscopyImageModelDataSchema = z.object({
  ear: z.union([
    z.nativeEnum(Ear),
    z.enum(["LEFT", "RIGHT", "BOTH"]),
    z.string()
  ]),
  imageUrl: z.string().url(),
  notes: z.string().optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  otoscopyId: z.string().optional(),
  capturedAt: z.string().optional(),
}).passthrough();

// Match backend schema exactly - only core fields
export const OtoscopyTestModelDataSchema = z.object({
  status: z.union([
    z.nativeEnum(TestStatus),
    z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PENDING", "CANCELLED"]),
    z.string()
  ]).optional(),
  notes: z.string().optional(),
  otoscopyImages: z.array(OtoscopyImageModelDataSchema).optional(),
  // Allow extra fields for backward compatibility
  id: z.string().optional(),
  sessionId: z.string().optional(),
  consultationId: z.string().optional(),
  capturedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type OtoscopyImageModelData = z.infer<
  typeof OtoscopyImageModelDataSchema
>;
export type OtoscopyTestModelData = z.infer<typeof OtoscopyTestModelDataSchema>;
