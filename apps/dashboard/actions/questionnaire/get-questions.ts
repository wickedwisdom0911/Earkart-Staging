"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { QuestionModelSchema, QuestionModel } from "@/models/questionnaire.model";


export async function getAllQuestions(): Promise<QuestionModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}questionnaire/find-all`;
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
    QuestionModelSchema
  );

  return response;
}
