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
  return response;
}
