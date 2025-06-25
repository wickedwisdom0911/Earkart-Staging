"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateLanguageModel,
  CreateLanguageModelSchema,
  LanguageModelData,
} from "@/models/language.model";

export default async function createLanguage(
  language: LanguageModelData
): Promise<CreateLanguageModel> {
  const { name, code, status } = language;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}languages/create`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({ name, code, status }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateLanguageModelSchema
  );

  return response;
}
