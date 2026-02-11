"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { AudiologistModelData, AudiologistModelDataSchema } from "@/models/audiologist.model";

export interface ToggleAvailabilityRequest {
  audiologistId: string;
  available: boolean;
}

export async function toggleAudiologistAvailability(
  data: ToggleAvailabilityRequest
): Promise<AudiologistModelData> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}audiologist/toggle-availability`;
  const user = await verifySession();
  
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest<AudiologistModelData>(
    url,
    {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    AudiologistModelDataSchema
  );
  
  return response;
}
