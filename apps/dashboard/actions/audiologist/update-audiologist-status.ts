"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  AudiologistActivity,
  AudiologistActivityResponse,
  AudiologistActivityResponseSchema,
} from "@/models/audiologist.model";

export async function updateAudiologistActivity(
  data: AudiologistActivity
): Promise<AudiologistActivityResponse> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}audiologist/start-audiologist-activity`;
  const user = await verifySession();
  
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest<AudiologistActivityResponse>(
    url,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    AudiologistActivityResponseSchema
  );
  
  return response;
}