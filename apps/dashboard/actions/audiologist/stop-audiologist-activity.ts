"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import type { stopAudiologistActivity as StopAudiologistActivityType } from "@/models/audiologist.model";

import {
    AudiologistActivityResponse,
    AudiologistActivityResponseSchema,
  } from "@/models/audiologist.model";
  
export async function stopAudiologistActivity(
  data: StopAudiologistActivityType
): Promise<AudiologistActivityResponse> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}audiologist/stop-audiologist-activity`;
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