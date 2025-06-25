"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateDeviceModel,
  CreateDeviceModelSchema,
} from "@/models/device.model";

export default async function assignDevice(
  deviceId: string,
  centreId: string
): Promise<CreateDeviceModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}device/assign-to-centre`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({ deviceId, centreId }),
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    },
    CreateDeviceModelSchema
  );
  return response;
}
