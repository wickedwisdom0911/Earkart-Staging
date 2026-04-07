"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { NrvSplitListResponse, NrvSplitListResponseSchema } from "@/models/nrv.model";

export async function getAllNrvSplits(): Promise<NrvSplitListResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  return apiRequest(
    `${baseUrl}nrv-split/get-all`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
    },
    NrvSplitListResponseSchema
  );
}
