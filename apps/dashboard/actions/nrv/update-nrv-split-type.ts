"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { NrvSplitTypeResponse, NrvSplitTypeResponseSchema } from "@/models/nrv.model";

export async function updateNrvSplitType(id: string, name: string): Promise<NrvSplitTypeResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  return apiRequest(
    `${baseUrl}nrv-split-type/update`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ id, name }),
    },
    NrvSplitTypeResponseSchema
  );
}
