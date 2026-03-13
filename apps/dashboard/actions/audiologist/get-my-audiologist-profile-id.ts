"use server";

import { verifySession } from "@/lib/session";
import getAllAudiologists from "./get-all-audiologists";
import getAudiologist from "./get-audiogist";

/**
 * Resolves the current user's audiologist profile ID.
 * Used so simple audiologists can filter consultations by their own ID.
 * Tries: (1) get-all-audiologists + match by userId (2) get-audiologist-profile with user.id as fallback.
 */
export default async function getMyAudiologistProfileId(): Promise<string | null> {
  const user = await verifySession();
  if (!user?.id) return null;

  try {
    const res = await getAllAudiologists();
    const arr = Array.isArray(res?.data) ? res.data : (res as any)?.data?.data;
    if (Array.isArray(arr)) {
      const found = arr.find(
        (a: any) =>
          String(a?.userId) === String(user.id) ||
          String(a?.user?.id) === String(user.id)
      );
      if (found?.id) return String(found.id);
    }
  } catch {
    // ignore
  }

  try {
    const profile = await getAudiologist(user.id);
    const data = (profile as any)?.data ?? profile;
    const id = data?.id ?? data?.audiologist?.id;
    if (id) return String(id);
  } catch {
    // ignore
  }

  return null;
}
