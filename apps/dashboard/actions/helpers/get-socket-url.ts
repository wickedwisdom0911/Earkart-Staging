"use server";
import { getSocketUrl } from "@/lib/environment";

export default async function getSocketUrlAction() {
  return await getSocketUrl();
}
