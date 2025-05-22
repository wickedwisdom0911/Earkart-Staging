"use server";

import { apiRequest } from "@/lib/api";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateDeviceModel,
  CreateDeviceModelSchema,
} from "@/models/device.model";

export async function deleteDevice(id: string): Promise<CreateDeviceModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}device/delete`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const response = await apiRequest(
    url,
    {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateDeviceModelSchema
  );
  return response;
}
