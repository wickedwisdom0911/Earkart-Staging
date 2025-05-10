"use server";
import { verifySession } from "@/lib/session";
import { UserModelData } from "@/models/user.model";

export default async function getCurrentUser(): Promise<UserModelData | null> {
  const user = await verifySession();
  if (user != null) {
    return user;
  } else {
    throw new Error("User not found");
  }
}
