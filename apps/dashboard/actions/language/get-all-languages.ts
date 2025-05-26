"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { LanguageModel, LanguageModelSchema } from "@/models/language.model";

export default async function getAllLanguages(): Promise<LanguageModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}languages/get-all`;
  const user = await verifySession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    LanguageModelSchema
  );
  return response;
}
