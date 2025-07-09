import { z } from "zod";
import { StatusEnum, Role, Gender } from "./enums";

export const userModelDataSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string(),
  password: z.string().optional(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(StatusEnum),
  gender: z.nativeEnum(Gender),
  dob: z.string(), 
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  token: z.string().nullable().optional(),
});

export type UserModelData = z.infer<typeof userModelDataSchema>;

export const userModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: userModelDataSchema.nullable(),
});

export type UserModel = z.infer<typeof userModelSchema>;

export const usersModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(userModelDataSchema),
});

export type UsersModel = z.infer<typeof usersModelSchema>;
