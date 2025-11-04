"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  PatientModel,
  PatientModelData,
  patientModelSchema,
} from "@/models/patient.model";

export async function updatePatient(
  data: PatientModelData
): Promise<PatientModel> {
  try {
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}patient/update`;
    const user = await verifySession();
    
    if (!user?.token) {
      throw new Error("Unauthorized: Please log in again");
    }

    // Validate required fields
    if (!data.name || data.name.trim() === "") {
      throw new Error("Patient name is required");
    }
    if (!data.contactNumber || data.contactNumber.trim() === "") {
      throw new Error("Contact number is required");
    }
    if (!data.languageId || data.languageId.trim() === "") {
      throw new Error("Preferred language is required");
    }

    const response = await apiRequest<PatientModel>(
      url,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      },
      patientModelSchema
    );
    
    return response;
  } catch (error: any) {
    console.error("Update patient error:", error);
    
    // Provide meaningful error messages
    if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error("Failed to update patient. Please check your connection and try again.");
  }
}
