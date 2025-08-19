"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

export type InitiateMultipartRequest = {
  fileName: string;
  sessionId: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type InitiateMultipartResponse = {
  uploadId: string;
  key: string;
  partSize: number;
};

export default async function initiateRecordingUpload(
  params: InitiateMultipartRequest
): Promise<InitiateMultipartResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const url = `${baseUrl}recordings/initiate`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to initiate upload: ${res.status} ${text}`);
  }

  const rawText = await res.text();
  let raw: any;
  try {
    raw = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}$/);
    if (!match) throw new Error(`Unexpected initiate response: ${rawText}`);
    raw = JSON.parse(match[0]);
  }

  const data = raw?.data ?? raw;
  const uploadId = data?.uploadId ?? data?.UploadId ?? data?.upload_id;
  const key = data?.key ?? data?.s3Key ?? data?.Key ?? data?.Location ?? data?.location;
  const partSize = typeof data?.partSize === "number" ? data.partSize : Number(data?.PartSize);

  if (!uploadId || !key || !partSize) {
    throw new Error("Unexpected initiate response shape");
  }
  return { uploadId, key, partSize };
}


