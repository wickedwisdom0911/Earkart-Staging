"use server";

import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import type { RecordingDto } from "./get-by-id";

export default async function getRecordingsBySession(sessionId: string): Promise<RecordingDto[]> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user?.token) throw new Error("Unauthorized");

  const url = `${baseUrl}recordings/session/${encodeURIComponent(sessionId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch session recordings: ${res.status} ${text}`);
  }
  const json = await res.json().catch(() => ({}));
  const data = json?.data ?? json;
  return data as RecordingDto[];
}

