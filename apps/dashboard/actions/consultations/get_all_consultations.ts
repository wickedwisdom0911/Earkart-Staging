"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  ConsultationModel,
  ConsultationModelSchema,
} from "@/models/consultation.model";

export interface GetAllConsultationsParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export default async function getAllConsultations(
  params?: GetAllConsultationsParams
): Promise<ConsultationModel> {
  try {
    console.log("🔵 [getAllConsultations] Starting...", { params });
    
    const baseUrl = await getBaseUrl();
    let url = `${baseUrl}consultation/get-all`;
    
    // Add pagination query parameters if provided
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params?.offset !== undefined) {
      queryParams.append("offset", params.offset.toString());
    }
    if (params?.page !== undefined) {
      queryParams.append("page", params.page.toString());
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    console.log("🔵 [getAllConsultations] URL:", url);
    
    const user = await verifySession();
    if (!user?.token) {
      console.error("🔴 [getAllConsultations] No token - Unauthorized");
      throw new Error("Unauthorized");
    }
    console.log("🔵 [getAllConsultations] User authenticated:", user.email);

    console.log("🔵 [getAllConsultations] Making API request...");
    const response = await apiRequest<ConsultationModel>(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      },
      ConsultationModelSchema
    );
    
    console.log("🔵 [getAllConsultations] Response received:", {
      success: response.success,
      message: response.message,
      hasData: !!response.data,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    
    return response;
  } catch (error) {
    console.error("🔴 [getAllConsultations] Error caught:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name
    });
    // Re-throw to let React Query handle it properly
    throw error;
  }
}
