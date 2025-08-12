"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { AgoraModel, AgoraModelSchema } from "@/models/agora.model";

interface CreateTokenParams {
  channelName: string;
  userRole: 'publisher' | 'subscriber';
  isUVC: boolean;
}

export default async function createToken(
  params: CreateTokenParams
): Promise<AgoraModel> {
  const { channelName, userRole, isUVC } = params;
  
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}agora/create-agora-token`;
  const user = await verifySession();
  
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  
  const response = await apiRequest<AgoraModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify({ 
        channelName, 
        userRole, 
        isUVC 
      }),
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
