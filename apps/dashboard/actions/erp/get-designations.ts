"use server";

import { ERP_TEAM_MANAGEMENT_API_BASE_URL } from "@/lib/erp-team-management-api";

/**
 * GET /team-management/get-designations?name=ASM
 * Uses hardcoded ERP base — only team-management ERP routes use this URL.
 */
export async function getDesignations(name?: string): Promise<unknown> {
  const base = ERP_TEAM_MANAGEMENT_API_BASE_URL;
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  const q = params.toString();
  const url = `${base}team-management/get-designations${q ? `?${q}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ERP get-designations failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}
