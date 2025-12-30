"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { CentreModel, CentreModelSchema } from "@/models/centre.model";

export default async function getAllCentres(params?: {
  cityId?: string;
  districtId?: string;
  stateId?: string;
  countryId?: string;
}): Promise<CentreModel> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  // Fetch all centres using pagination
  let allCentres: any[] = [];
  let offset = 0;
  const limit = 100; // Max per request as per backend documentation
  let hasMore = true;

  console.log("[getAllCentres] Starting pagination fetch...");

  while (hasMore) {
    // Build query string with URLSearchParams
    const searchParams = new URLSearchParams();
    
    // Add pagination parameters as clean numeric strings
    searchParams.append("limit", String(limit));
    searchParams.append("offset", String(offset));

    // Add filter parameters if provided
    if (params?.cityId) searchParams.append("cityId", params.cityId);
    if (params?.districtId) searchParams.append("districtId", params.districtId);
    if (params?.stateId) searchParams.append("stateId", params.stateId);
    if (params?.countryId) searchParams.append("countryId", params.countryId);

    const url = `${baseUrl}centre/get-all?${searchParams.toString()}`;
    
    console.log(`[getAllCentres] Fetching page: limit=${limit}, offset=${offset}`);

    try {
      const response = await apiRequest(
        url,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        },
        CentreModelSchema
      );

      // Handle case where data is a direct array
      if (Array.isArray(response.data)) {
        allCentres = [...allCentres, ...response.data];
        hasMore = false; // No pagination info, assume this is all data
        console.log(`[getAllCentres] Fetched ${response.data.length} centres (direct array)`);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        const fetchedCount = response.data.data.length;
        allCentres = [...allCentres, ...response.data.data];
        hasMore = response.data.hasNext || false;
        
        console.log(`[getAllCentres] Fetched ${fetchedCount} centres, total so far: ${allCentres.length}, hasNext: ${hasMore}`);
        
        // Move to next page
        if (hasMore) {
          offset += limit;
        }
      } else {
        console.warn("[getAllCentres] Unexpected response structure:", response);
        hasMore = false;
      }
    } catch (error) {
      console.error(`[getAllCentres] Error fetching page at offset ${offset}:`, error);
      throw error;
    }
  }

  console.log(`[getAllCentres] Completed! Total centres fetched: ${allCentres.length}`);

  // Fix pricing for each centre
  allCentres.forEach((centre) => {
    if (centre && centre.pricing === undefined) {
      centre.pricing = [];
    }
  });

  // Return in the expected format
  return {
    success: true,
    message: "Centres fetched successfully",
    data: {
      data: allCentres,
      total: allCentres.length,
      limit: allCentres.length,
      offset: 0,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  } as unknown as CentreModel;
}
