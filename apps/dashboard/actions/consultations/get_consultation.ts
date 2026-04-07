"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  ConsultationModel,
  ConsultationModelSchema,
} from "@/models/consultation.model";

export default async function getConsultation(
  consultationId: string
): Promise<ConsultationModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}consultation/get-by-id/${consultationId}`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<ConsultationModel>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    ConsultationModelSchema
  );
  if (consultationId === "04f0b1de-fa12-4a80-a565-4818288aa6b6") {
    console.log("[DEBUG consultation]", JSON.stringify(response, null, 2));
  }
  return response;
}
