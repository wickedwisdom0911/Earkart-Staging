// actions/analytics/get-health-status.ts
"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { 
  HealthData,
  ApiHealthResponse,
  ApiHealthResponseSchema 
} from "@/models/dashboard.model";

export default async function getHealthStatus(): Promise<HealthData> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}health`;
  const user = await verifySession();

  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest<ApiHealthResponse>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    ApiHealthResponseSchema
  );

  // Extract the actual data from the API response wrapper
  return response.data;
} 