"use server";
import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateLanguageModel,
  CreateLanguageModelSchema,
  LanguageModelData,
} from "@/models/language.model";

export default async function updateLanguage(
  language: LanguageModelData
): Promise<CreateLanguageModel> {
  const { id, name, code, status } = language;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}languages/update`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify({ id, name, code, status }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateLanguageModelSchema
  );

  return response;
}
