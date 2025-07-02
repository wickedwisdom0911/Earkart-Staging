"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

import {
    AudiologistActivityResponse,
    AudiologistActivityResponseSchema,
  } from "@/models/audiologist.model";
  
export async function getAudiologistActivity(
    id: string
): Promise<AudiologistActivityResponse> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}audiologist/get-current-audiologist-activity/${id}`;
  const user = await verifySession();
  
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest<AudiologistActivityResponse>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    AudiologistActivityResponseSchema
  );


  
  return response;
}