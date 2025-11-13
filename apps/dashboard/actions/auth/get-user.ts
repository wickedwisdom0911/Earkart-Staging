"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

import { Role } from "@/models/enums";
import { UsersModel, UsersApiResponseSchema } from "@/models/user.model";

export default async function getUsersByRole(
  role: Role
): Promise<UsersModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}auth/users/${role}`;

  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
      cache: 'no-store',
    },
    UsersApiResponseSchema
  );

  return response.data;
}
