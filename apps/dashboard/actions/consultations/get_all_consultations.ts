"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  ConsultationModel,
  ConsultationModelSchema,
  ConsultationModelData,
} from "@/models/consultation.model";

export default async function getAllConsultations(): Promise<ConsultationModel> {
  try {
    console.log("🔵 [getAllConsultations] Starting...");
    
    const baseUrl = await getBaseUrl();
    const user = await verifySession();
    if (!user?.token) {
      console.error("🔴 [getAllConsultations] No token - Unauthorized");
      throw new Error("Unauthorized");
    }
    console.log("🔵 [getAllConsultations] User authenticated:", user.email);

    // Pagination parameters
    const limit = 100; // Fetch 100 consultations per page
    let offset = 0;
    let hasMore = true;
    const allConsultations: ConsultationModelData[] = [];

    // Fetch all pages
    while (hasMore) {
      const url = `${baseUrl}consultation/get-all?limit=${limit}&offset=${offset}`;
      console.log(`🔵 [getAllConsultations] Fetching page: limit=${limit}, offset=${offset}`);

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
          allConsultations.push(...response.data);
          hasMore = false; // No pagination info, assume this is all data
          console.log(`🔵 [getAllConsultations] Fetched ${response.data.length} consultations (direct array)`);
        } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          // Paginated response with nested data
          const paginatedData = response.data as {
            data: ConsultationModelData[] | null;
            hasNext: boolean;
          };
          
          if (paginatedData.data && Array.isArray(paginatedData.data)) {
            const fetchedCount = paginatedData.data.length;
            allConsultations.push(...paginatedData.data);
            hasMore = paginatedData.hasNext || false;
            
            console.log(`🔵 [getAllConsultations] Fetched ${fetchedCount} consultations, total so far: ${allConsultations.length}, hasNext: ${hasMore}`);
            
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

    console.log(`🔵 [getAllConsultations] Completed! Total consultations fetched: ${allConsultations.length}`);

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
