"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { DistrictModel, DistrictModelSchema } from "@/models/district.model";

export default async function getDistrictsByState(
  stateId: string
): Promise<DistrictModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}district/get-districts-by-state-id`;
  const response = await apiRequest<DistrictModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ stateId }),
      headers: {
        "Content-Type": "application/json",
      },
    },
    DistrictModelSchema
  );
  return response;
}
