"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

/**
 * End consultation by updating ONLY the status to COMPLETED
 * This is called when an audiologist ends the consultation
 * Backend will emit the end:consultation socket event to notify all participants
 */
export async function endConsultation(
  consultationId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}consultation/update`;
    const user = await verifySession();
    
    if (!user?.token) {
      return { success: false, message: "Unauthorized", error: "No authentication token" };
    }

    // Only update the status fields - nothing else
    const updateData = {
      id: consultationId,
      status: "COMPLETED",
      audiologistStatus: "COMPLETED",
    };

    console.log("🔴 [END API] Updating consultation status:", updateData);

    const response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify(updateData),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [END API] Failed to end consultation:", errorText);
      return { 
        success: false, 
        message: "Failed to end consultation", 
        error: errorText 
      };
    }

    const data = await response.json();
    console.log("✅ [END API] Consultation status updated, backend will emit socket event");
    return { 
      success: true, 
      message: "Consultation ended successfully" 
    };
  } catch (error) {
    console.error("❌ [END API] Error ending consultation:", error);
    return { 
      success: false, 
      message: "Error ending consultation", 
      error: String(error) 
    };
  }
}

