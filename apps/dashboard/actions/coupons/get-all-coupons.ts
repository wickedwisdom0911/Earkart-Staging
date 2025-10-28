// apps/dashboard/actions/coupons/get-all-coupons.ts
"use server";
import { apiRequest } from "@/lib/api";
import { CouponListResponseSchema } from "@/models/coupon.model";
import { getBaseUrl } from "@/lib/environment";

export async function getAllCoupons(params: Record<string, any> = {}) {
  const baseUrl = await getBaseUrl();
  // Serialize params to query string
  const query = new URLSearchParams(params).toString();
  const url = `${baseUrl}coupon/get-all${query ? "?" + query : ""}`;
  return await apiRequest(
    url,
    { method: "GET", headers: { "Content-Type": "application/json" } },
    CouponListResponseSchema
  );
}