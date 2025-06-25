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
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}patient/update`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<PatientModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({
        data,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    patientModelSchema
  );
  return response;
}
