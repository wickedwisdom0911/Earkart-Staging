"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { 
  ConsultationByAudiologistResponse, 
  ConsultationByAudiologistResponseSchema 
} from "@/models/consultation-by-audiologist.model";

export default async function getConsultationsByAudiologist(
  audiologistId: string
): Promise<ConsultationByAudiologistResponse> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}consultation/get-by-audiologist-id/${audiologistId}`;
  const user = await verifySession();

  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  return await apiRequest<ConsultationByAudiologistResponse>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    ConsultationByAudiologistResponseSchema
  );
} 