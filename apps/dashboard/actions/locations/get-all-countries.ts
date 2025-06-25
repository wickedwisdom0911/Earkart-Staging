"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { CountryModel, CountryModelSchema } from "@/models/country.model";

export default async function getAllCountries(): Promise<CountryModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}country/get-all-countries`;
  const user = await verifySession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    CountryModelSchema
  );
  return response;
}
