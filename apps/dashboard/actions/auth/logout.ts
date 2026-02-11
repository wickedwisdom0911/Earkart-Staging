"use server";

import { deleteSession, verifySession } from "@/lib/session";
import { getBaseUrl } from "@/lib/environment";

export default async function LogoutUser(): Promise<boolean> {
  try {
    // Call backend logout so it can set available=false for audiologists
    const user = await verifySession();
    if (user?.token) {
      const baseUrl = await getBaseUrl();
      const url = `${baseUrl}auth/logout`;
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      // Ignore errors - we still want to clear the session locally
    }
    await deleteSession();
    return true;
  } catch (error) {
    console.error(error);
    // Still delete session on error so user can log out locally
    await deleteSession();
    return false;
  }
}
