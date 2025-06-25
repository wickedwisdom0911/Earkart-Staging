"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CountryModelData,
  CreateCountryModel,
  CreateCountryModelSchema,
} from "@/models/country.model";

export default async function updateCountry(
  country: CountryModelData
): Promise<CreateCountryModel> {
  const { id, name, code, status } = country;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}country/update-country`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify({ id, name, code, status }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCountryModelSchema
  );

  return response;
}
