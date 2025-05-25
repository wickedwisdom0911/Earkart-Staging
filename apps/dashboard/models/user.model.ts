import { StatusEnum, Role, Gender } from "@/models/enums";
import { z } from "zod";

export const userModelDataSchema = z.object({
  id: z.string().optional(),
  email: z.string(),
  name: z.string(),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(StatusEnum),
  gender: z.nativeEnum(Gender),
  dob: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  token: z.string().optional().nullable(),
});
export const userModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: userModelDataSchema.nullable(),
});
export type UserModel = z.infer<typeof userModelSchema>;
export type UserModelData = z.infer<typeof userModelDataSchema>;
