"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { toApiStartDate, toApiEndDate } from "@/lib/utils";
import { ConsultationModelData } from "@/models/consultation.model";

export interface GetConsultationsByCentreParams {
  centreId: string;
  startDate?: string;
  endDate?: string;
  /** Records per page — API max is 100 (default 100) */
  limit?: number;
}

export interface GetConsultationsByCentreResult {
  consultations: ConsultationModelData[];
}

export default async function getConsultationsByCentre(
  params: GetConsultationsByCentreParams
): Promise<GetConsultationsByCentreResult> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const { centreId, startDate, endDate } = params;
  const limit = Math.min(params.limit ?? 100, 100); // API enforces max 100 per page
  const MAX_PAGES = 25; // hard cap at 5000 records

  let offset = 0;
  let hasMore = true;
  let pagesFetched = 0;
  const allConsultations: ConsultationModelData[] = [];

  while (hasMore && pagesFetched < MAX_PAGES) {
    pagesFetched++;

    const urlParams = new URLSearchParams({
      id: centreId,
      limit: String(limit),
      offset: String(offset),
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    if (startDate) urlParams.set("startDate", toApiStartDate(startDate));
    if (endDate) urlParams.set("endDate", toApiEndDate(endDate));

    const url = `${baseUrl}consultation/get-by-centre-id?${urlParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        hasMore = false;
        break;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || `API error: ${response.status}`);
    }

    const json = await response.json();

    // Handle both array and paginated response shapes
    let items: ConsultationModelData[] = [];
    let hasNext = false;

    if (Array.isArray(json?.data)) {
      // { success, message, data: [...] }
      items = json.data as ConsultationModelData[];
      hasNext = items.length === limit;
    } else if (Array.isArray(json?.data?.data)) {
      // { success, message, data: { data: [...], hasNext: bool } }
      items = json.data.data as ConsultationModelData[];
      hasNext = json.data.hasNext ?? items.length === limit;
    } else if (Array.isArray(json)) {
      items = json as ConsultationModelData[];
      hasNext = items.length === limit;
    }

    allConsultations.push(...items);

    if (hasNext) {
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  return { consultations: allConsultations };
}
