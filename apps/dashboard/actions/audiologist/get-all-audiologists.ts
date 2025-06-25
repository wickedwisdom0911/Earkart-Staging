"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  AudiologistModel,
  AudiologistModelSchema,
} from "@/models/audiologist.model";

export default async function getAllAudiologists(): Promise<AudiologistModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}audiologist/get-all-audiologists`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<AudiologistModel>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    AudiologistModelSchema
  );
  return response;
}
