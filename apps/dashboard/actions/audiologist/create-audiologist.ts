"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

import {
  CreateAudiologistModel,
  createAudiologistModelSchema,
  CreateAudiologistProfile,
} from "@/models/audiologist.model";

export async function createAudiologist(
  data: CreateAudiologistProfile
): Promise<CreateAudiologistModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}audiologist/create-audiologist-profile`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateAudiologistModel>(
    url,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    createAudiologistModelSchema
  );
  return response;
}
