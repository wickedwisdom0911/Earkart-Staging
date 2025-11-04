"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  Appointment,
  CreateAppointmentRequest,
  AppointmentResponseSchema,
  AppointmentStats,
  AppointmentStatsSchema,
  GetAllAppointmentsResponse,
  GetAllAppointmentsResponseSchema,
  CheckAvailabilityRequest,
  GenericAppointmentResponseSchema,
  AppointmentListResponseSchema,
} from "@/models/appointment.model";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const API_BASE_PATH = "appointment";

// Helper to get Authorization headers
async function getAuthHeaders() {
  const session = await verifySession();
  if (!session?.token) {
    throw new Error("Unauthorized");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.token}`,
  };
}

export async function createAppointment(
  body: CreateAppointmentRequest
): Promise<void> {
  const headers = await getAuthHeaders();
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${API_BASE_PATH}/create`;

  const response = await apiRequest(
    url,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    },
    AppointmentResponseSchema
  );

  if (!response.success) {
    throw new Error(response.message || "Failed to create appointment");
  }

  revalidatePath("/appointment");
}

export async function getAppointmentStats(params?: {
  centreId?: string;
  audiologistId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AppointmentStats> {
  const headers = await getAuthHeaders();
  const baseUrl = await getBaseUrl();
  const searchParams = new URLSearchParams();

  if (params?.centreId) searchParams.append("centreId", params.centreId);
  if (params?.audiologistId) searchParams.append("audiologistId", params.audiologistId);
  if (params?.startDate) searchParams.append("startDate", params.startDate);
  if (params?.endDate) searchParams.append("endDate", params.endDate);
  
  const url = `${baseUrl}${API_BASE_PATH}/statistics?${searchParams.toString()}`;

  const response = await apiRequest(url, {
    method: "GET",
    headers,
  }, z.object({ success: z.boolean(), message: z.string(), data: AppointmentStatsSchema }));

  if (!response.data) {
    throw new Error(response.message || "Failed to fetch appointment stats");
  }

  return response.data;
}

export async function getAllAppointments(params?: any): Promise<GetAllAppointmentsResponse> {
  const headers = await getAuthHeaders();
  const baseUrl = await getBaseUrl();
  
  let url = `${baseUrl}${API_BASE_PATH}/get-all`;
  
  // Only add query params if params object has keys
  if (params && Object.keys(params).length > 0) {
    const sanitized: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (key === "limit") {
        const n = Math.floor(Number(value));
        const clamped = Math.min(100, Math.max(1, Number.isFinite(n) ? n : 10));
        sanitized[key] = String(clamped);
        return;
      }
      if (key === "offset") {
        const n = Math.floor(Number(value));
        const clamped = Math.max(0, Number.isFinite(n) ? n : 0);
        sanitized[key] = String(clamped);
        return;
      }
      sanitized[key] = String(value);
    });
    const searchParams = new URLSearchParams(sanitized);
    url = `${url}?${searchParams.toString()}`;
  }

  // Debug: log final URL to verify limit/offset
  try {
    console.log("[getAllAppointments] URL:", url);
  } catch {}

  const response = await apiRequest(url, {
    method: "GET",
    headers,
  }, GetAllAppointmentsResponseSchema);

  return response;
}

export async function checkAvailability(
  data: CheckAvailabilityRequest
): Promise<void> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${API_BASE_PATH}/check-availability`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  await apiRequest(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(data),
    },
    GenericAppointmentResponseSchema
  );
}

export async function getPatientHistory(
  patientId: string,
  params: any
): Promise<any> {
  const baseUrl = await getBaseUrl();
  const url = new URL(`${baseUrl}${API_BASE_PATH}/patient-history/${patientId}`);
  if (params) {
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    );
  }
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  return await apiRequest(
    url.toString(),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    AppointmentListResponseSchema
  );
}

export async function getCentreSchedule(
  centreId: string,
  date: string
): Promise<any> {
  const baseUrl = await getBaseUrl();
  const url = new URL(
    `${baseUrl}${API_BASE_PATH}/centre-schedule/${centreId}`
  );
  url.searchParams.append("date", date);
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  return await apiRequest(
    url.toString(),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    AppointmentListResponseSchema
  );
}

export async function getAudiologistSchedule(
  audiologistId: string,
  date: string
): Promise<any> {
  const baseUrl = await getBaseUrl();
  const url = new URL(
    `${baseUrl}${API_BASE_PATH}/audiologist-schedule/${audiologistId}`
  );
  url.searchParams.append("date", date);
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  return await apiRequest(
    url.toString(),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    AppointmentListResponseSchema
  );
}
