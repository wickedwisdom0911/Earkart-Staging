"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { AgoraModel, AgoraModelSchema } from "@/models/agora.model";

export default async function createToken(
  channelName: string
): Promise<AgoraModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}agora/create-agora-token`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  console.log("Creating token for channel:", channelName);
  const response = await apiRequest<AgoraModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ channelName }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    AgoraModelSchema
  );
  if (!response.success) {
    throw new Error(response.message);
  }
  return response;
}
