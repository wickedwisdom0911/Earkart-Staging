"use server";

import type { ConsultationModelData } from "@/models/consultation.model";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

/**
 * Pagination - matches backend API:
 * GET /consultation/get-all?limit=&offset=&startDate=&endDate=&audiologistId=
 * Response: { data: { data: consultations[], total, hasNext, totalPages } }
 * Backend may expect YYYY-MM-DD or ISO 8601 format.
 */
export interface GetConsultationsPageParams {
  page?: number;
  limit?: number;
  audiologistId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetConsultationsPageResult {
  consultations: ConsultationModelData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default async function getConsultationsPage(
  params: GetConsultationsPageParams = {}
): Promise<GetConsultationsPageResult> {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 10, 100); // Backend: default 10, max 100
  const offset = (page - 1) * limit;

  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (params.audiologistId) searchParams.set("audiologistId", params.audiologistId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const url = `${baseUrl}consultation/get-all?${searchParams.toString()}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load consultations: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const data = json?.data;

  const consultations: ConsultationModelData[] = Array.isArray(data?.data)
    ? data.data
    : [];
  const total = typeof data?.total === "number" ? data.total : consultations.length;
  // If we got a partial page (fewer than limit) or empty, there is no next page - prevents infinite "Loading more..."
  const receivedFullPage = consultations.length >= limit;
  const hasNext =
    receivedFullPage &&
    (typeof data?.hasNext === "boolean" ? data.hasNext : true);
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : Math.max(1, Math.ceil(total / limit));

  return {
    consultations,
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrevious: page > 1,
  };
}
