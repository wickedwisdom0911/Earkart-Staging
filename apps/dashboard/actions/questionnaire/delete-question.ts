"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { DeleteQuestionModelSchema, DeleteQuestionModel } from "@/models/questionnaire.model";



export async function deleteQuestion(
  id: string
): Promise<DeleteQuestionModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}questionnaire/delete`;
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
    DeleteQuestionModelSchema
  );

  return response;
}
