"use server";
import getBaseUrl from "@/lib/environment";
import { verifySession } from "@/lib/session";

export async function deleteRoom(roomName: string) {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}twilio/delete-room`;
  const user = await verifySession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      room: roomName,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
  });
  return response.json();
}
