// actions/analytics/get-audiologist-anayltics.ts
"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { 
  AudiologistMetricsRequest, 
  AudiologistMetricsResponse, 
  ApiAudiologistMetricsResponse,
  ApiAudiologistMetricsResponseSchema 
} from "@/models/audiologist-analytics.model";

export default async function getAudiologistMetrics(
  requestBody: AudiologistMetricsRequest
): Promise<AudiologistMetricsResponse> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}analytics/audiologists`;
  const user = await verifySession();

  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  // Server-side role-based access control
  let filteredRequestBody = { ...requestBody };
  
  // If user is a normal audiologist (not head audiologist), enforce they can only see their own data
  if (user.role === "AUDIOLOGIST" && user.id) {
    filteredRequestBody = {
      ...requestBody,
      filters: {
        ...requestBody.filters,
        // Force normal audiologists to only see their own data
        audiologistIds: [user.id],
      },
    };
  }
  
  // Head audiologists and admins can see all data as requested
  const response = await apiRequest<ApiAudiologistMetricsResponse>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(filteredRequestBody),
    },
    ApiAudiologistMetricsResponseSchema
  );

  // Extract the actual data from the API response wrapper
  return response.data;
} 