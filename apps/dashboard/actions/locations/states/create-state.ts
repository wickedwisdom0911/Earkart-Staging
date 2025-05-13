"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateStateModel,
  CreateStateModelSchema,
  StateModelData,
} from "@/models/state.model";

export default async function createState(
  state: StateModelData
): Promise<CreateStateModel> {
  const { name, countryId, status } = state;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}states/create-state`;
  const user = await verifySession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({ name, countryId, status }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateStateModelSchema
  );
  return response;
}
