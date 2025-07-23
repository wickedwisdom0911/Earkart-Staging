"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  PatientListResponse,
  patientListResponseSchema,
} from "@/models/patient.model";

export async function searchPatients(searchValue: string): Promise<PatientListResponse> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}patient/search?q=${encodeURIComponent(searchValue)}`;

  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  return await apiRequest<PatientListResponse>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    patientListResponseSchema
  );
} 