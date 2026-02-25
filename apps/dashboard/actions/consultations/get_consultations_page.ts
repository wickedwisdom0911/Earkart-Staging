"use server";

import type { ConsultationModelData } from "@/models/consultation.model";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

/**
 * Pagination - matches backend API:
 * GET /consultation/get-all?limit=&offset=
 * Response: { data: { data: consultations[], total, hasNext, totalPages } }
 */
export interface GetConsultationsPageParams {
  page?: number;
  limit?: number;
  audiologistId?: string;
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

  const url = `${baseUrl}consultation/get-all?limit=${limit}&offset=${offset}`;
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
  const hasNext = typeof data?.hasNext === "boolean" ? data.hasNext : consultations.length >= limit;
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
