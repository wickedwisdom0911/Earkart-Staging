"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import type {
  CentreDashboardParams,
  CentreDashboardData,
} from "@/models/centre-dashboard.model";

export default async function getCentreDashboard(
  params?: CentreDashboardParams
): Promise<CentreDashboardData> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();

  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  const searchParams = new URLSearchParams();

  if (params?.timeRange) {
    searchParams.set("timeRange", params.timeRange);
  }
  if (params?.startDate) {
    searchParams.set(
      "startDate",
      typeof params.startDate === "string"
        ? params.startDate
        : params.startDate.toISOString()
    );
  }
  if (params?.endDate) {
    searchParams.set(
      "endDate",
      typeof params.endDate === "string"
        ? params.endDate
        : params.endDate.toISOString()
    );
  }
  if (params?.centreIds?.length) {
    params.centreIds.forEach((id) => searchParams.append("centreIds", id));
  }
  if (params?.audiologistIds?.length) {
    params.audiologistIds.forEach((id) =>
      searchParams.append("audiologistIds", id)
    );
  }
  if (params?.cityIds?.length) {
    params.cityIds.forEach((id) => searchParams.append("cityIds", id));
  }
  if (params?.stateIds?.length) {
    params.stateIds.forEach((id) => searchParams.append("stateIds", id));
  }
  if (params?.removeDummy !== undefined) {
    searchParams.set("removeDummy", String(params.removeDummy));
  }
  if (params?.consultationStatuses?.length) {
    params.consultationStatuses.forEach((s) =>
      searchParams.append("consultationStatuses", s)
    );
  }
  if (params?.testStatuses?.length) {
    params.testStatuses.forEach((s) =>
      searchParams.append("testStatuses", s)
    );
  }

  const url = `${baseUrl}analytics/centre-dashboard?${searchParams.toString()}`;
  console.log("[CentreAnalytics] Fetching:", url);
  console.log("[CentreAnalytics] Params:", JSON.stringify(params ?? {}));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
    cache: "no-store",
  });

        console.log("[CentreAnalytics] Response status:", response.status);

  if (!response.ok) {
    let errorData: { message?: string };
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    console.error("[CentreAnalytics] Error:", errorData);
    throw new Error(errorData?.message || "Failed to fetch centre dashboard");
  }

  const json = await response.json();

  // API may return { success, message, data: {...} } or direct response
  let data = json?.data ?? json;

  // Support alternate nesting: data.centreDashboard.centres or data.centre_dashboard.centres
  if (data && !data.centres && Array.isArray(data.centreDashboard?.centres)) {
    data = { ...data, centres: data.centreDashboard.centres };
  }
  if (data && !data.centres && Array.isArray(data.centre_dashboard?.centres)) {
    data = { ...data, centres: data.centre_dashboard.centres };
  }

  const centresCount = Array.isArray(data?.centres) ? data.centres.length : 0;
  console.log("[CentreAnalytics] OK - centres:", centresCount, "keys:", data ? Object.keys(data) : []);
  return data as CentreDashboardData;
}
