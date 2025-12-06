"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
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
  // Ensure pricing is never undefined in the request data
  if (data.centre && data.centre.pricing === undefined) {
    data.centre.pricing = [];
  }
  
  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCentreModelSchema
  );
  
  // Fix pricing in the response if needed
  if (response.data && response.data.pricing === undefined) {
    response.data.pricing = [];
  }
  
  return response as unknown as CreateCentreModel;
}
