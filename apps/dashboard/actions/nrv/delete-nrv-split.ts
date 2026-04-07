"use server";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";

export async function deleteNrvSplit(id: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  const res = await fetch(`${baseUrl}nrv-split/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return { success: true, message: "Deleted successfully" };
  return res.json();
}
