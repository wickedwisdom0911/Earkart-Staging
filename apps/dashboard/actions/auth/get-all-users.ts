"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

import { UsersModel, usersModelSchema } from "@/models/user.model";

export default async function getAllUsers(): Promise<UsersModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}auth/users`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");

  const response = await apiRequest(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    usersModelSchema
  );

  return response;
}
