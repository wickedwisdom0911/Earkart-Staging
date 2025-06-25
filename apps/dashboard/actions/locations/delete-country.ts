"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateCountryModel,
  CreateCountryModelSchema,
} from "@/models/country.model";
export default async function deleteCountry(
  id: string
): Promise<CreateCountryModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}country/delete-country`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCountryModelSchema
  );
  return response;
}
