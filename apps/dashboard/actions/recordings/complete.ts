"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

export type CompleteMultipartRequest = {
  uploadId: string;
  parts: Array<{ partNumber: number; etag: string }>;
};

export type CompleteMultipartResponse = {
  key: string;
  playbackUrl?: string;
};

export default async function completeRecordingUpload(
  params: CompleteMultipartRequest
): Promise<CompleteMultipartResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const url = `${baseUrl}recordings/complete`;

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
    throw new Error(`Failed to complete upload: ${res.status} ${text}`);
  }

  // Robust parsing: some dev setups prepend lines. Parse the last JSON object.
  const rawText = await res.text();
  try {
    // Server-side console for debugging raw response
    console.log("[RECORDINGS_COMPLETE] raw response:", rawText);
  } catch {}

  let raw: any;
  try {
    raw = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}$/);
    if (!match) throw new Error(`Unexpected complete response: ${rawText.slice(0, 500)}`);
    raw = JSON.parse(match[0]);
  }

  const data = raw?.data ?? raw;

  try {
    console.log("[RECORDINGS_COMPLETE] parsed keys:", Object.keys(data || {}));
  } catch {}

  const key = data?.key ?? data?.Key ?? data?.s3Key ?? data?.Location ?? data?.location ?? null;
  const playbackUrl = data?.playbackUrl ?? data?.playback_url ?? data?.url ?? undefined;

  if (!key) throw new Error(`Unexpected complete response shape. Raw: ${rawText.slice(0, 500)}`);
  return { key, playbackUrl };
}


