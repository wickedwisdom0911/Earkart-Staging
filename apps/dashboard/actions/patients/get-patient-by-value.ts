"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  PatientModel,
  patientModelSchema,
} from "@/models/patient.model";

export async function getPatientByValue(value: string): Promise<PatientModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}patient/get-by-value/${encodeURIComponent(value)}`;

  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  return await apiRequest<PatientModel>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    patientModelSchema
  );
} 