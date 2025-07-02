import { z } from "zod";
import { AnswerType } from "./enums";

export const questionnaireModelDataSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.nativeEnum(AnswerType),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type QuestionnaireModelData = z.infer<
  typeof questionnaireModelDataSchema
>;
