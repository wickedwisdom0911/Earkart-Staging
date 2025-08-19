"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

export type PresignPartRequest = {
  uploadId: string;
  partNumber: number;
};

export type PresignPartResponse = {
  url: string;
};

export default async function presignRecordingPart(
  params: PresignPartRequest
): Promise<PresignPartResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const url = `${baseUrl}recordings/presign?uploadId=${encodeURIComponent(
    params.uploadId
  )}&partNumber=${encodeURIComponent(String(params.partNumber))}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to presign part: ${res.status} ${text}`);
  }
  const json = await res.json().catch(() => ({}));
  const data = json?.data ?? json;
  const presignedUrl = data?.presignedUrl || data?.url;
  if (!presignedUrl || typeof presignedUrl !== "string") {
    throw new Error("Unexpected presign response shape");
  }
  return { url: presignedUrl };
}


