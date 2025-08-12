import { z } from "zod";

export const AgoraModelDataSchema = z.object({
  token: z.string(),
  appId: z.string(),
  userId: z.number(),
  isUVC: z.boolean(),
});
export const AgoraModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: AgoraModelDataSchema,
});

export type AgoraModelData = z.infer<typeof AgoraModelDataSchema>;
export type AgoraModel = z.infer<typeof AgoraModelSchema>;
