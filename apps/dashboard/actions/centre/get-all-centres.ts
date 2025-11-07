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
  const searchParams = new URLSearchParams();

  if (params?.cityId) searchParams.append("cityId", params.cityId);
  if (params?.districtId) searchParams.append("districtId", params.districtId);
  if (params?.stateId) searchParams.append("stateId", params.stateId);
  if (params?.countryId) searchParams.append("countryId", params.countryId);

  const url = `${baseUrl}centre/get-all?${searchParams.toString()}`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
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
  
  // Ensure we always have a valid data structure
  if (!response.data) {
    response.data = {
      data: [],
      total: 0,
      limit: 0,
      offset: 0,
      page: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }
  
  // Ensure data.data is always an array
  if (!response.data.data || !Array.isArray(response.data.data)) {
    response.data.data = [];
  }
  
  // Fix pricing for each centre in the array
  response.data.data.forEach((centre) => {
    if (centre && centre.pricing === undefined) {
      centre.pricing = [];
    }
  });

  return response as unknown as CentreModel;
}
