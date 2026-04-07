"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { NrvSplitTypeListResponse, NrvSplitTypeListResponseSchema } from "@/models/nrv.model";

export async function getAllNrvSplitTypes(): Promise<NrvSplitTypeListResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  return apiRequest(
    `${baseUrl}nrv-split-type/get-all`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
    },
    NrvSplitTypeListResponseSchema
  );
}
