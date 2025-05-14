"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { CreateCityModel, CreateCityModelSchema } from "@/models/city.model";

export default async function deleteCity(id: string): Promise<CreateCityModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}city/delete-city`;
  const user = await verifySession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateCityModel>(
    url,
    {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCityModelSchema
  );
  return response;
}
