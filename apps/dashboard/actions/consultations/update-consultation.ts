"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  ConsultationModel,
  ConsultationModelData,
  ConsultationModelSchema,
} from "@/models/consultation.model";

export async function updateConsultation(
  data: ConsultationModelData
): Promise<ConsultationModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}consultation/update`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<ConsultationModel>(
    url,
    {
      method: "PUT",
      body: JSON.stringify({
        data,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    ConsultationModelSchema
  );
  return response;
}
