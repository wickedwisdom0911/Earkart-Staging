"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { CreateStateModel, CreateStateModelSchema } from "@/models/state.model";

export default async function deleteState(
  id: string
): Promise<CreateStateModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}states/delete-state/${id}`;
  const user = await verifySession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest(
    url,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateStateModelSchema
  );
  return response;
}
