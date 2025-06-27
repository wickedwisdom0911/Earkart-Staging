"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { CityModel, CityModelSchema } from "@/models/city.model";

export default async function getCitiesByDistrict(
  districtId: string
): Promise<CityModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}city/get-cities-by-district-id`;
  const response = await apiRequest<CityModel>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        districtId,
      }),
    },
    CityModelSchema
  );
  return response;
}
