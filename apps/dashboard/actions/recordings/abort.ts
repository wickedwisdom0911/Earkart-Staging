"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

export type AbortMultipartRequest = {
  uploadId: string;
};

export default async function abortRecordingUpload(
  params: AbortMultipartRequest
): Promise<void> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const url = `${baseUrl}recordings/abort`;

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
    throw new Error(`Failed to abort upload: ${res.status} ${text}`);
  }
}

