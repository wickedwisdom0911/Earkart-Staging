"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import {
  CreatePatientRequest,
  Patient,
  PatientResponseSchema,
} from "@/models/patient.model";
import { revalidatePath } from "next/cache";

const API_BASE_PATH = "patient";

export async function createPatient(
  body: CreatePatientRequest,
): Promise<Patient> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${API_BASE_PATH}/create`;

  const response = await apiRequest(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    PatientResponseSchema
  );

  if (!response.data) {
    throw new Error(response.message || "Failed to create patient");
  }

  revalidatePath("/register");
  return response.data;
}
