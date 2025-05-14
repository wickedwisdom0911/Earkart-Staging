"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateDistrictModel,
  CreateDistrictModelSchema,
} from "@/models/district.model";

export default async function deleteDistrict(id: string) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}district/delete-district`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateDistrictModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateDistrictModelSchema
  );
  return response;
}
