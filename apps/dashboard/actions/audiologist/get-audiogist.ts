"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateAudiologistModel,
  createAudiologistModelSchema,
} from "@/models/audiologist.model";

export default async function getAudiologist(
  id: string
): Promise<CreateAudiologistModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}audiologist/get-audiologist-profile/${id}`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateAudiologistModel>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    createAudiologistModelSchema
  );
  return response;
}
