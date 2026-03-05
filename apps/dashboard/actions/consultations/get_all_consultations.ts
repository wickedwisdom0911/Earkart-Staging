"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  ConsultationModel,
  ConsultationModelSchema,
  ConsultationModelData,
} from "@/models/consultation.model";

export interface GetAllConsultationsParams {
  page?: number;
  limit?: number;
  offset?: number;
  /** Optional max records to fetch - stops pagination once reached. Use for faster dashboard load. */
  maxRecords?: number;
  /** Date range filter - passed to backend. If backend doesn't filter, caller should filter client-side. */
  startDate?: string;
  endDate?: string;
}

export default async function getAllConsultations(
  params?: GetAllConsultationsParams
): Promise<ConsultationModel> {
  try {
    const baseUrl = await getBaseUrl();
    const user = await verifySession();
    if (!user?.token) throw new Error("Unauthorized");

    // Pagination parameters
    const limit = params?.limit ?? 100; // Fetch 100 consultations per page
    let offset = params?.offset ?? 0;
    const maxRecords = params?.maxRecords; // When set, stop after reaching this count
    let hasMore = true;
    const allConsultations: ConsultationModelData[] = [];

    // Build base URL with optional date filters
    const urlParams = new URLSearchParams({
      limit: String(limit),
      offset: "0", // will override per iteration
    });
    if (params?.startDate) urlParams.set("startDate", params.startDate);
    if (params?.endDate) urlParams.set("endDate", params.endDate);

    // Fetch pages (stop early if maxRecords reached)
    while (hasMore && (!maxRecords || allConsultations.length < maxRecords)) {
      urlParams.set("offset", String(offset));
      const url = `${baseUrl}consultation/get-all?${urlParams.toString()}`;

      try {
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

        // Handle different response formats
        if (Array.isArray(response.data)) {
          // Direct array response (backward compatibility)
          const toAdd = maxRecords ? response.data.slice(0, maxRecords - allConsultations.length) : response.data;
          allConsultations.push(...toAdd);
          hasMore = false; // No pagination info, assume this is all data
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          // Paginated response with nested data
          const paginatedData = response.data as {
            data: ConsultationModelData[] | null;
            hasNext: boolean;
          };
          
          if (paginatedData.data && Array.isArray(paginatedData.data)) {
            const fetchedCount = paginatedData.data.length;
            const toAdd = maxRecords
              ? paginatedData.data.slice(0, maxRecords - allConsultations.length)
              : paginatedData.data;
            allConsultations.push(...toAdd);
            hasMore = paginatedData.hasNext && (!maxRecords || allConsultations.length < maxRecords) || false;
            
            // Move to next page
            if (hasMore) {
              offset += limit;
            }
          } else {
            console.warn("🔴 [getAllConsultations] Unexpected paginated data structure:", response.data);
            hasMore = false;
          }
        } else if (response.data === null) {
          // Null response
          console.log("🔵 [getAllConsultations] No consultations found");
          hasMore = false;
        } else {
          // Single consultation object (unlikely but handle it)
          console.log("🔵 [getAllConsultations] Single consultation object received");
          allConsultations.push(response.data as ConsultationModelData);
          hasMore = false;
        }
      } catch (error) {
        console.error(`🔴 [getAllConsultations] Error fetching page at offset ${offset}:`, error);
        throw error;
      }
    }


    // Return in the expected format (array for backward compatibility)
    return {
      success: true,
      message: "Consultations fetched successfully",
      data: allConsultations,
    };
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
