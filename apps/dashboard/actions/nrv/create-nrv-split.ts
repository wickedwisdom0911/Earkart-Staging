"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { NrvSplitResponse, NrvSplitResponseSchema } from "@/models/nrv.model";

export async function createNrvSplit(
  nrvSplitTypeId: string,
  percentageDoctor: number,
  percentageEarkart: number
): Promise<NrvSplitResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  return apiRequest(
    `${baseUrl}nrv-split/create`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ nrvSplitTypeId, percentageDoctor, percentageEarkart }),
    },
    NrvSplitResponseSchema
  );
}
