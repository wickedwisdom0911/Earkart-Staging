"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateAudiologistModel,
  createAudiologistModelSchema,
} from "@/models/audiologist.model";

export default async function deleteAudiologist(
  id: string
): Promise<CreateAudiologistModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}audiologist/delete-audiologist-profile/${id}`;
  const user = await verifySession();
  if (!user?.token) {
    throw new Error("Unauthorized");
  }
  const response = await apiRequest<CreateAudiologistModel>(
    url,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    },
    createAudiologistModelSchema
  );
  return response;
}
