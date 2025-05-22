"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { DeviceModel, DeviceModelSchema } from "@/models/device.model";

export async function getAllDevices(): Promise<DeviceModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}device/all`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    DeviceModelSchema
  );
  return response;
}
