"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CityModelData,
  CreateCityModel,
  CreateCityModelSchema,
} from "@/models/city.model";

export default async function createCity(
  city: CityModelData
): Promise<CreateCityModel> {
  const { name, districtId, status } = city;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}city/create-city`;
  const user = await verifySession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateCityModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ name, districtId, status }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCityModelSchema
  );
  return response;
}
