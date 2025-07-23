// actions/analytics/get-dashboard-summary.ts
"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { 
  DashboardSummaryData,
  ApiDashboardSummaryResponse,
  ApiDashboardSummaryResponseSchema 
} from "@/models/dashboard.model";

export default async function getDashboardSummary(): Promise<DashboardSummaryData> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}analytics/summary`;
  const user = await verifySession();

  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest<ApiDashboardSummaryResponse>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    ApiDashboardSummaryResponseSchema
  );

  // Extract the actual data from the API response wrapper
  return response.data;
} 