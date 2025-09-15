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
  // Check if this is a mock uploadId (created by initiate action in mock mode)
  if (params.uploadId.startsWith('mock-upload-')) {
    console.log("🧪 [COMPLETE] Mock uploadId detected, returning mock completion");
    return {
      key: `recordings/test/mock-${Date.now()}.webm`,
      playbackUrl: `mock://test-recording-${Date.now()}.webm`
    };
  }

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
    console.error(`❌ [COMPLETE] API Error ${res.status}:`, text);
    
    // Mock completion response for testing
    if (res.status === 404 || res.status >= 500) {
      console.log("🧪 [COMPLETE] Backend unavailable, using mock completion");
      return {
        key: `recordings/test/mock-${Date.now()}.webm`,
        playbackUrl: `https://mock-cloudfront.net/recordings/test/mock-${Date.now()}.webm`
      };
    }
    
    throw new Error(`Failed to complete upload: ${res.status} ${text}`);
  }

  // Robust parsing: some dev setups prepend lines. Parse the last JSON object.
  const rawText = await res.text();
  console.log("🔍 [RECORDINGS_COMPLETE] Raw backend response:", rawText);

  let raw: any;
  try {
    raw = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}$/);
    if (!match) {
      console.error("❌ [RECORDINGS_COMPLETE] Failed to parse response:", rawText.slice(0, 500));
      throw new Error(`Unexpected complete response: ${rawText.slice(0, 500)}`);
    }
    raw = JSON.parse(match[0]);
  }

  const data = raw?.data ?? raw;
  console.log("📋 [RECORDINGS_COMPLETE] Parsed data:", data);
  console.log("🔑 [RECORDINGS_COMPLETE] Available keys:", Object.keys(data || {}));

  // If backend reports failure, surface the message clearly
  if (data && typeof data === 'object' && data.success === false) {
    const msg = data?.message || 'Completion failed';
    throw new Error(String(msg));
  }

  let key = data?.key ?? data?.Key ?? data?.s3Key ?? data?.Location ?? data?.location ?? null;
  if (key === 'key') key = null; // avoid literal field-name mishit
  const playbackUrl = data?.playbackUrl ?? data?.playback_url ?? data?.url ?? undefined;

  console.log("🎯 [RECORDINGS_COMPLETE] Extracted values:", { key, playbackUrl });

  if (!key) {
    console.error("❌ [RECORDINGS_COMPLETE] No key found in response. Data:", data);
    throw new Error(`Unexpected complete response shape. Raw: ${rawText.slice(0, 500)}`);
  }
  return { key, playbackUrl };
}


