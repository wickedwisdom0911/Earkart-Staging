"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateCentreModel,
  CreateCentreModelSchema,
} from "@/models/centre.model";

export default async function deleteCentre(
  id: string
): Promise<CreateCentreModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}centre/delete/${id}`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateCentreModel>(
    url,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCentreModelSchema
  );
  return response;
}
