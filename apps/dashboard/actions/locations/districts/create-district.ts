"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateDistrictModel,
  CreateDistrictModelSchema,
  DistrictModelData,
} from "@/models/district.model";

export default async function createDistrict(district: DistrictModelData) {
  const { cityId, name, status } = district;
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}district/create-district`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateDistrictModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ cityId, name, status }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateDistrictModelSchema
  );
  return response;
}
