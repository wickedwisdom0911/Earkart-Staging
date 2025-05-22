"use server";
import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateDeviceModel,
  CreateDeviceModelSchema,
  DeviceModelData,
} from "@/models/device.model";

export async function updateDevice(
  data: DeviceModelData
): Promise<CreateDeviceModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}device/update`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateDeviceModelSchema
  );
  return response;
}
