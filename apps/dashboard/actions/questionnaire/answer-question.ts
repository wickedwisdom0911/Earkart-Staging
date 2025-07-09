"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

import {
  SubmitAnswersModelSchema,
  SubmitAnswersModel,
} from "@/models/questionnaire.model";

export default async function submitAnswers(
  payload: SubmitAnswersModel
): Promise<SubmitAnswersModel> {
  const { consultationId, answers } = payload;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}questionnaire/submit-answers`; 
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");

  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({ consultationId, answers }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    SubmitAnswersModelSchema
  );

  return response;
}
