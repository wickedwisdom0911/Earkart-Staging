// actions/analytics/get-consultation-anayltics.ts
"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { 
  MetricsRequest, 
  MetricsResponse, 
  ApiMetricsResponse,
  ApiMetricsResponseSchema 
} from "@/models/analytics.model";

export default async function getMetrics(
  requestBody: MetricsRequest
): Promise<MetricsResponse> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}analytics/consultations`;
  const user = await verifySession();

  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest<ApiMetricsResponse>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(requestBody),
    },
    ApiMetricsResponseSchema
  );

  // Extract the actual data from the API response wrapper
  return response.data;
}