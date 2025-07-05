// app/(dashboard)/questionnaire/actions/reorder-question.ts
"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { QuestionModel, QuestionModelSchema, ReorderPayload } from "@/models/questionnaire.model";



export default async function reorderQuestion(
  { id, order }: ReorderPayload
): Promise<QuestionModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}questionnaire/reorder`;

  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({ id, order }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    QuestionModelSchema
  );

  return response;
}
