"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { CityModel, CityModelSchema } from "@/models/city.model";

export default async function getCitiesByState(
  stateCode: string
): Promise<CityModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}city/get-cities-by-state-id`;
  const response = await apiRequest<CityModel>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stateId: stateCode,
      }),
    },
    CityModelSchema
  );
  return response;
}
