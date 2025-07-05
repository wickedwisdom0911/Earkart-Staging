"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

import { CreateQuestionModelSchema , CreateQuestionModel,QuestionModelData} from "@/models/questionnaire.model";

export default async function createQuestion(
  question: QuestionModelData
): Promise<CreateQuestionModel> {
  const { text, type, order, options } = question;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}questionnaire/create`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");

  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({ text, type, order, options }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateQuestionModelSchema
  );

  return response;
}
