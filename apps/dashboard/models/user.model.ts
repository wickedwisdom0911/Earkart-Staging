import { z } from "zod";
import { StatusEnum, Role, Gender } from "./enums";

export const userModelDataSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(StatusEnum),
  gender: z.nativeEnum(Gender),
  dob: z.coerce.date().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  token: z.string().optional().nullable(),
});

export type User = z.infer<typeof userModelDataSchema>;

export const CreateUserDtoSchema = userModelDataSchema.pick({
  email: true,
  password: true,
  name: true,
  role: true,
  gender: true,
  status: true,
  dob: true,
}).extend({
  dob: z.string().optional().nullable(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

export type RegisterUserPayload = Omit<CreateUserDto, 'dob'> & {
  dob: Date | null;
};

export const UserApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: userModelDataSchema.nullable(),
});

export const UsersApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(userModelDataSchema),
});

export type UsersModel = z.infer<typeof UsersApiResponseSchema>["data"];
export type UserModel = z.infer<typeof UserApiResponseSchema>["data"];
