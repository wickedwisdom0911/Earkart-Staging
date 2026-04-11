"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateTrialAppointmentRequest,
  DeleteTrialAppointmentResponseSchema,
  GetAllTrialAppointmentsResponseSchema,
  GetTrialAppointmentsParams,
  PaginatedTrialAppointments,
  TrialAppointmentSingleResponseSchema,
  UpdateTrialAppointmentRequest,
} from "@/models/trial-appointment.model";
import { revalidatePath } from "next/cache";

const API = "trial-appointment";

async function authHeaders() {
  const session = await verifySession();
  if (!session?.token) throw new Error("Unauthorized");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.token}`,
  } as const;
}

function buildQuery(params: GetTrialAppointmentsParams = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => q.append(key, String(v)));
    } else if (typeof value === "boolean") {
      q.append(key, String(value));
    } else {
      q.append(key, String(value));
    }
  });
  return q.toString();
}

export async function getAllTrialAppointments(
  params: GetTrialAppointmentsParams = {}
): Promise<PaginatedTrialAppointments> {
  const baseUrl = await getBaseUrl();
  const query = buildQuery(params);
  const url = `${baseUrl}${API}/get-all${query ? `?${query}` : ""}`;
  const headers = await authHeaders();

  const response = await apiRequest(
    url,
    { method: "GET", headers },
    GetAllTrialAppointmentsResponseSchema
  );

  return response.data;
}

export async function getTrialAppointmentById(id: string) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${API}/get-by-id/${id}`;
  const headers = await authHeaders();

  const response = await apiRequest(
    url,
    { method: "GET", headers },
    TrialAppointmentSingleResponseSchema
  );

  return response.data;
}

export async function createTrialAppointment(body: CreateTrialAppointmentRequest) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${API}/create`;
  const headers = await authHeaders();

  const response = await apiRequest(
    url,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
    TrialAppointmentSingleResponseSchema
  );

  revalidatePath("/dashboard/trial-appointments");
  return response.data;
}

export async function updateTrialAppointment(body: UpdateTrialAppointmentRequest) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${API}/update`;
  const headers = await authHeaders();

  const response = await apiRequest(
    url,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    },
    TrialAppointmentSingleResponseSchema
  );

  revalidatePath("/dashboard/trial-appointments");
  return response.data;
}

export async function deleteTrialAppointment(id: string) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${API}/delete`;
  const headers = await authHeaders();

  const response = await apiRequest(
    url,
    {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    },
    // z.infer output marks `data` optional; api envelope always includes `data`
    DeleteTrialAppointmentResponseSchema as import("zod").ZodType<{
      success: boolean;
      message: string;
      data: unknown;
    }>
  );

  revalidatePath("/dashboard/trial-appointments");
  return response;
}
