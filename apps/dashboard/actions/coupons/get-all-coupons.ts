// apps/dashboard/actions/coupons/get-all-coupons.ts
"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import {
  CouponListResponseSchema,
  CouponListFlexibleSchema,
  GetCouponsParams,
} from "@/models/coupon.model";

export default async function getAllCoupons(params: GetCouponsParams = {}) {
  const baseUrl = await getBaseUrl();
  // Convert params to URLSearchParams, handling arrays properly
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array parameters (ids, statuses)
        value.forEach((item) => queryParams.append(key, String(item)));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });
  
  const query = queryParams.toString();
  const url = `${baseUrl}coupon/get-all${query ? "?" + query : ""}`;
  
  try {
    const response = await apiRequest(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      CouponListResponseSchema
    );
    
    // Normalize the response structure for the UI
    // Response is: { success, message, data: { data: [...], total, ... } }
    // Return just the inner data object: { data: [...], total, ... }
    return response?.data ?? { data: [], total: 0, limit: 0, offset: 0, page: 0, totalPages: 0 };
  } catch (e) {
    // Fallback to a more flexible schema when backend wraps arrays
    const flexible = await apiRequest(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      CouponListFlexibleSchema
    );
    // Normalize to strict shape expected by UI
    const items = Array.isArray(flexible.data)
      ? flexible.data
      : (flexible.data as any)?.items || (flexible.data as any)?.results || [];
    return {
      data: items,
      total: (flexible as any).total ?? (flexible as any)?.data?.total ?? items.length,
      limit: (flexible as any).limit ?? (flexible as any)?.data?.limit ?? 0,
      offset: (flexible as any).offset ?? (flexible as any)?.data?.offset ?? 0,
      page: (flexible as any).page ?? (flexible as any)?.data?.page ?? 0,
      totalPages:
        (flexible as any).totalPages ?? (flexible as any)?.data?.totalPages ?? 0,
      hasNext:
        (flexible as any).hasNext ?? (flexible as any)?.data?.hasNext ?? false,
      hasPrevious:
        (flexible as any).hasPrevious ?? (flexible as any)?.data?.hasPrevious ?? false,
    };
  }
}