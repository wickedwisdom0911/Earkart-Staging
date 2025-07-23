"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { CentreModel, CentreModelSchema } from "@/models/centre.model";

export default async function getAllCentres(): Promise<CentreModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}centre/get-all`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CentreModelSchema
  );
  // Fix pricing for each centre in the array
  if (response.data) {
    response.data.forEach(centre => {
      if (centre.pricing === undefined) {
        centre.pricing = [];
      }
    });
  }
  return response as unknown as CentreModel;
}
