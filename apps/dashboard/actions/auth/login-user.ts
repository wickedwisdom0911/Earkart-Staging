"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { createSession } from "@/lib/session";
import { UserModel, userModelSchema } from "@/models/user.model";

export default async function loginUser(
  formData: FormData
): Promise<UserModel> {
  try {
    const uri = await getBaseUrl();
    const url = `${uri}auth/login`;
    const response = await apiRequest(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      },
      userModelSchema
    );
    if (response.success && response.data) {
      await createSession(response.data);
    }
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
