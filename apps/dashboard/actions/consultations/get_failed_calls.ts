"use server";

import type { ConsultationModelData } from "@/models/consultation.model";
import { getBaseUrl } from "@/lib/environment";
import { toApiStartDate, toApiEndDate } from "@/lib/utils";
import { verifySession } from "@/lib/session";
import { extractConsultations } from "@/models/consultation.model";
import { getConsultationListPayload } from "@/lib/parse-consultation-api-response";

/**
 * GET /consultation/failed-calls
 * Retrieves consultations with status FAILED (technical issues, marked by audiologist).
 * Response: patient(language), centre(user,city), audiologist(user).
 */
export interface GetFailedCallsParams {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "id" | "name" | "status";
  sortOrder?: "ASC" | "DESC";
  search?: string;
  startDate?: string;
  endDate?: string;
  patientId?: string;
  audiologistId?: string;
  centreId?: string;
  /** Only send when true - filter demo calls */
  isDemo?: boolean;
}

export interface GetFailedCallsResult {
  consultations: ConsultationModelData[];
  total: number;
  hasNext: boolean;
}

export default async function getFailedCalls(
  params: GetFailedCallsParams = {}
): Promise<GetFailedCallsResult> {
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
  if (params.search) searchParams.set("search", params.search);
  if (params.startDate) searchParams.set("startDate", toApiStartDate(params.startDate));
  if (params.endDate) searchParams.set("endDate", toApiEndDate(params.endDate));
  if (params.patientId) searchParams.set("patientId", params.patientId);
  if (params.audiologistId) searchParams.set("audiologistId", params.audiologistId);
  if (params.centreId) searchParams.set("centreId", params.centreId);
  if (params.isDemo === true) searchParams.set("isDemoCall", "true");

  const url = `${baseUrl}consultation/failed-calls?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load failed calls: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const { list, total: totalRaw, hasNext: hasNextRaw } = getConsultationListPayload(json);

  const consultations: ConsultationModelData[] = extractConsultations(
    list as Parameters<typeof extractConsultations>[0]
  );
  const total =
    totalRaw > 0 ? totalRaw : consultations.length > 0 ? consultations.length : 0;
  const hasNext =
    typeof hasNextRaw === "boolean" ? hasNextRaw : consultations.length >= limit;

  return {
    consultations,
    total,
    hasNext,
  };
}
