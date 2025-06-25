"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { DistrictModel, DistrictModelSchema } from "@/models/district.model";

export default async function getDistrictsByCity(
  cityId: string
): Promise<DistrictModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}district/get-districts-by-city-id`;
  const response = await apiRequest<DistrictModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ cityId }),
      headers: {
        "Content-Type": "application/json",
      },
    },
    DistrictModelSchema
  );
  return response;
}
