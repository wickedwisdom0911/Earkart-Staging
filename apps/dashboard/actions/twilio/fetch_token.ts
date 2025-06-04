"use server";

import getBaseUrl from "@/lib/environment";

export default async function fetchToken(identity: string, room: string) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}twilio/video-token`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identity, room }),
  });
  const data = await response.json();
  return data;
}
