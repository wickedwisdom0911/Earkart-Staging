"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { toApiStartDate, toApiEndDate } from "@/lib/utils";
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
  hearingLoss?: boolean;
  hearingLossSeverity?: string;
}

export default async function getAllConsultations(
  params?: GetAllConsultationsParams
): Promise<ConsultationModel> {
  try {
    const baseUrl = await getBaseUrl();
    const user = await verifySession();
    if (!user?.token) throw new Error("Unauthorized");

    const limit = params?.limit ?? 100;
    let offset = params?.offset ?? 0;
    const maxRecords = params?.maxRecords;
    const MAX_PAGES = 50; // Hard cap: never fetch more than 5000 records in one call
    let pagesFetched = 0;
    let hasMore = true;
    const allConsultations: ConsultationModelData[] = [];

    // Build base URL with optional date filters
    const urlParams = new URLSearchParams({
      limit: String(limit),
      offset: "0", // will override per iteration
    });
    if (params?.startDate) urlParams.set("startDate", toApiStartDate(params.startDate));
    if (params?.endDate) urlParams.set("endDate", toApiEndDate(params.endDate));
    if (typeof params?.hearingLoss === "boolean") {
      urlParams.set("hearingLoss", params.hearingLoss ? "true" : "false");
    }
    if (params?.hearingLossSeverity?.trim()) {
      urlParams.set(
        "hearingLossSeverity",
        params.hearingLossSeverity.trim().toUpperCase()
      );
    }

    while (hasMore && pagesFetched < MAX_PAGES && (!maxRecords || allConsultations.length < maxRecords)) {
      pagesFetched++;
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
          hasMore = false;
          }
        } else if (response.data === null) {
          hasMore = false;
        } else {
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
