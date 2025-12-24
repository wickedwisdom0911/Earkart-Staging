"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { CreateCentreModel } from "@/models/centre.model";

export default async function deleteCentre(
  id: string
): Promise<CreateCentreModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}centre/delete/${id}`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = "Failed to delete centre";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Try to parse the response, but handle cases where it might not match expected format
    let result: CreateCentreModel;
    try {
      const jsonData = await response.json();
      // If response has the expected structure, use it
      if (jsonData.success !== undefined && jsonData.message !== undefined) {
        result = {
          success: jsonData.success,
          message: jsonData.message,
          data: jsonData.data || null,
        };
      } else {
        // If response structure is different, create a success response
        result = {
          success: true,
          message: jsonData.message || "Centre deleted successfully",
          data: null,
        };
      }
    } catch (parseError) {
      // If JSON parsing fails or response is empty, assume success if HTTP status was OK
      result = {
        success: true,
        message: "Centre deleted successfully",
        data: null,
      };
    }

    return result;
  } catch (error: any) {
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap in Error
    throw new Error(error?.message || "Failed to delete centre");
  }
}
