"use server";

import { ERP_TEAM_MANAGEMENT_API_BASE_URL } from "@/lib/erp-team-management-api";

/**
 * GET /team-management/get-employees-by-designation-name?designationName=ASM
 * Uses hardcoded ERP base — only team-management ERP routes use this URL.
 */
export async function getEmployeesByDesignationName(designationName: string): Promise<unknown> {
  const base = ERP_TEAM_MANAGEMENT_API_BASE_URL;
  const params = new URLSearchParams({ designationName });
  const url = `${base}team-management/get-employees-by-designation-name?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ERP get-employees failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}
