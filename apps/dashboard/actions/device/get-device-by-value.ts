"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateDeviceModel,
  CreateDeviceModelSchema,
} from "@/models/device.model";
export default async function getDeviceByValue(
  value: string
): Promise<CreateDeviceModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}device/find-by-value`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ value }),
    },
    CreateDeviceModelSchema
  );
  return response;
}
