"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateLanguageModel,
  CreateLanguageModelSchema,
} from "@/models/language.model";
export default async function deleteLanguage(
  id: string
): Promise<CreateLanguageModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}languages/delete`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateLanguageModelSchema
  );
  return response;
}
