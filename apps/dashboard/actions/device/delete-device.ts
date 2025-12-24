"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { CreateDeviceModel } from "@/models/device.model";

export async function deleteDevice(id: string): Promise<CreateDeviceModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}device/delete`;
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  
  try {
    const response = await fetch(url, {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = "Failed to delete device";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    let result: CreateDeviceModel;
    try {
      const jsonData = await response.json();
      if (jsonData.success !== undefined && jsonData.message !== undefined) {
        result = {
          success: jsonData.success,
          message: jsonData.message,
          data: jsonData.data || null,
        };
      } else {
        result = {
          success: true,
          message: jsonData.message || "Device deleted successfully",
          data: null,
        };
      }
    } catch (parseError) {
      result = {
        success: true,
        message: "Device deleted successfully",
        data: null,
      };
    }

    return result;
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || "Failed to delete device");
  }
}
