"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { StateModel, StateModelSchema } from "@/models/state.model";

export default async function getStatesByCountryId(
  countryId: string
): Promise<StateModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}states/get-states-by-country-id/${countryId}`;
  const user = await verifySession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<StateModel>(
    url,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    StateModelSchema
  );
  return response;
}
