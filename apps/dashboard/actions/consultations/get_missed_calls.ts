"use server";

import type { ConsultationModelData } from "@/models/consultation.model";
import { getBaseUrl } from "@/lib/environment";
import { toApiStartDate, toApiEndDate } from "@/lib/utils";
import { verifySession } from "@/lib/session";
import { extractConsultations } from "@/models/consultation.model";

/**
 * GET /consultation/missed-calls
 * Retrieves consultations with status CANCELLED_BY_PATIENT (missed calls).
 * Excludes RECONNECTED. Supports centreId, patientId, audiologistId, pagination, sorting.
 */
export interface GetMissedCallsParams {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "id" | "name" | "status";
  sortOrder?: "ASC" | "DESC";
  centreId?: string;
  patientId?: string;
  audiologistId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  /** Only send when true - filter demo calls */
  isDemo?: boolean;
}

export interface GetMissedCallsResult {
  consultations: ConsultationModelData[];
  total: number;
  hasNext: boolean;
}

export default async function getMissedCalls(
  params: GetMissedCallsParams = {}
): Promise<GetMissedCallsResult> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "DESC",
  });
  if (params.centreId) searchParams.set("centreId", params.centreId);
  if (params.patientId) searchParams.set("patientId", params.patientId);
  if (params.audiologistId) searchParams.set("audiologistId", params.audiologistId);
  if (params.startDate) searchParams.set("startDate", toApiStartDate(params.startDate));
  if (params.endDate) searchParams.set("endDate", toApiEndDate(params.endDate));
  if (params.search) searchParams.set("search", params.search);
  if (params.isDemo === true) searchParams.set("isDemo", "true");

  const url = `${baseUrl}consultation/missed-calls?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load missed calls: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const data = json?.data ?? json;

  const consultations: ConsultationModelData[] = extractConsultations(
    Array.isArray(data) ? data : data?.data ?? data ?? []
  );
  const total = typeof data?.total === "number" ? data.total : consultations.length;
  const hasNext = data?.hasNext ?? consultations.length >= limit;

  return {
    consultations,
    total,
    hasNext,
  };
}
