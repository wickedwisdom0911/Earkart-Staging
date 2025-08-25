import { z } from "zod";

// Generic recording model usable across features
export const RecordingModelDataSchema = z.object({
  id: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  recordingUrl: z.string().optional().nullable(),
  playbackUrl: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export type RecordingModelData = z.infer<typeof RecordingModelDataSchema>;


