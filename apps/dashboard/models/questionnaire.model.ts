import { z } from "zod";

export enum AnswerType {
  SHORT_TEXT = "SHORT_TEXT",
  LONG_TEXT = "LONG_TEXT",
  NUMBER = "NUMBER",
  DATE = "DATE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOX = "CHECKBOX",
}

export const OptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const QuestionModelDataSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  type: z.nativeEnum(AnswerType),
  order: z.number(),
  options: z.array(OptionSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateQuestionModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: QuestionModelDataSchema.optional().nullable(),
});

export const QuestionModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(QuestionModelDataSchema),
});

export const DeleteQuestionModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.string().nullable(),
});

export interface ReorderPayload {
  id: string;
  order: number;
}




export const SubmitAnswersModelSchema = z.object({
  consultationId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      value: z.string(),
    })
  ),
});
export type SubmitAnswersModel = z.infer<typeof SubmitAnswersModelSchema>;

export type Option = z.infer<typeof OptionSchema>;
export type QuestionModelData = z.infer<typeof QuestionModelDataSchema>;
export type CreateQuestionModel = z.infer<typeof CreateQuestionModelSchema>;
export type QuestionModel = z.infer<typeof QuestionModelSchema>;
export type DeleteQuestionModel = z.infer<typeof DeleteQuestionModelSchema>;
