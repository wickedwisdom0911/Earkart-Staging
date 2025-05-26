import { z } from "zod";
import { StatusEnum } from "./enums";

export const LanguageModelDataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  code: z.string(),
  status: z.nativeEnum(StatusEnum),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateLanguageModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: LanguageModelDataSchema.optional().nullable(),
});

export const LanguageModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(LanguageModelDataSchema),
});

export type LanguageModel = z.infer<typeof LanguageModelSchema>;
export type CreateLanguageModel = z.infer<typeof CreateLanguageModelSchema>;
export type LanguageModelData = z.infer<typeof LanguageModelDataSchema>;
