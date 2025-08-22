"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

export type RecordingDto = {
  id: string;
  sessionId: string;
  recordingUrl: string | null;
  s3Key: string | null;
  uploadId: string | null;
  status: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  durationMs: number | null;
  totalParts: number | null;
  createdAt: string;
  updatedAt: string;
};

export default async function getRecordingById(id: string): Promise<RecordingDto> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const url = `${baseUrl}recordings/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch recording: ${res.status} ${text}`);
  }
  const json = await res.json().catch(() => ({}));
  const data = json?.data ?? json;
  return data as RecordingDto;
}

