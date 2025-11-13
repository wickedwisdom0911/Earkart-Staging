"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { CreateUserDto, User, UserApiResponseSchema } from "@/models/user.model";

export default async function registerUser(
  registerDto: CreateUserDto
): Promise<User> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}auth/register`;

  const response = await apiRequest(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerDto),
    },
    UserApiResponseSchema
  );

  if (!response.data) {
    throw new Error("API returned success but did not provide user data.");
  }

  return response.data;
}
