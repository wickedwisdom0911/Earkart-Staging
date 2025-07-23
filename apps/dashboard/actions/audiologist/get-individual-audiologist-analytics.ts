"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

// Create a simplified request for individual audiologist analytics
interface IndividualAudiologistRequest {
  metricType: "consultations";
  aggregation: "count";
  groupBy: "day" | "week" | "month" | "year";
  filters: {
    timeRange: "daily" | "weekly" | "monthly" | "yearly";
    startDate?: string | null;
    endDate?: string | null;
    audiologistIds: string[];
  };
  limit: number;
  offset: number;
}

// Response interface based on consultation analytics structure
interface IndividualAudiologistResponse {
  success: boolean;
  message: string;
  data: {
    metricType: string;
    summary: {
      total: number;
      average: number;
      growthRate: number;
      trend: string;
    };
    data: Array<{
      label: string;
      value: number;
      percentageChange?: number;
    }>;
    timeRange: string | { start: string; end: string; preset: string };
    totalRecords: number;
    executionTime: number;
    generatedAt: string;
  };
}

export default async function getIndividualAudiologistAnalytics(
  audiologistId: string,
  timeRange: "daily" | "weekly" | "monthly" | "yearly" = "monthly"
) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}analytics/consultations`; // Use consultations endpoint instead
  const user = await verifySession();

  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  // Create request body for individual audiologist consultations
  const requestBody: IndividualAudiologistRequest = {
    metricType: "consultations",
    aggregation: "count",
    groupBy: timeRange === "daily" ? "day" : timeRange === "weekly" ? "week" : timeRange === "monthly" ? "month" : "year",
    filters: {
      timeRange,
      startDate: null,
      endDate: null,
      audiologistIds: [audiologistId], // Filter by specific audiologist
    },
    limit: 1000,
    offset: 0,
  };
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.message || "Failed to fetch analytics data");
  }

  const data = await response.json() as IndividualAudiologistResponse;

  // Debug: Log the response to see its structure
  console.log('API Response:', data);

  // Return the data directly, with fallback structure
  if (data && data.data) {
    return data.data;
  } else {
    // Return a fallback structure if API response is unexpected
    return {
      metricType: "consultations",
      summary: {
        total: 0,
        average: 0,
        growthRate: 0,
        trend: "stable"
      },
      data: [],
      timeRange: timeRange,
      totalRecords: 0,
      executionTime: 0,
      generatedAt: new Date().toISOString()
    };
  }
} 