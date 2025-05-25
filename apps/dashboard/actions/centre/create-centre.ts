"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateCentreModel,
  CreateCentreModelSchema,
  CreateCenterProfile,
} from "@/models/centre.model";

export async function createCentre(
  data: CreateCenterProfile
): Promise<CreateCentreModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}centre/create`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateCentreModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({
        data,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCentreModelSchema
  );
  return response;
}
