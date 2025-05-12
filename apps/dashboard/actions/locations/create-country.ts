"use server";
import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CountryModelData,
  CreateCountryModel,
  CreateCountryModelSchema,
} from "@/models/country.model";

export default async function createCountry(
  country: CountryModelData
): Promise<CreateCountryModel> {
  const { name, code, status } = country;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}country/create-country`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({ name, code, status }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCountryModelSchema
  );

  return response;
}
