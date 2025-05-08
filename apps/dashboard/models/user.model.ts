import { z } from "zod";

export const userModelDataSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.string(),
  gender: z.string(),
  dob: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  token: z.string(),
});
export const userModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: userModelDataSchema.nullable(),
});
export type UserModel = z.infer<typeof userModelSchema>;
export type UserModelData = z.infer<typeof userModelDataSchema>;
