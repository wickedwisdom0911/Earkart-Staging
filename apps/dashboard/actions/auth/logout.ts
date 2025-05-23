"use server";
import { deleteSession } from "@/lib/session";

export default async function LogoutUser(): Promise<boolean> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await deleteSession();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
