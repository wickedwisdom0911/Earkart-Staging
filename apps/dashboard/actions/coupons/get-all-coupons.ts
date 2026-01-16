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
    try {
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
      let items: any[] = [];
      
      if (Array.isArray(flexible.data)) {
        items = flexible.data;
      } else if (flexible.data && typeof flexible.data === 'object') {
        items = (flexible.data as any)?.data || 
                (flexible.data as any)?.items || 
                (flexible.data as any)?.results || 
                [];
      }
      
      return {
        data: items,
        total: flexible.total ?? (flexible.data as any)?.total ?? items.length,
        limit: flexible.limit ?? (flexible.data as any)?.limit ?? 0,
        offset: flexible.offset ?? (flexible.data as any)?.offset ?? 0,
        page: flexible.page ?? (flexible.data as any)?.page ?? 0,
        totalPages: flexible.totalPages ?? (flexible.data as any)?.totalPages ?? 0,
        hasNext: flexible.hasNext ?? (flexible.data as any)?.hasNext ?? false,
        hasPrevious: flexible.hasPrevious ?? (flexible.data as any)?.hasPrevious ?? false,
      };
    } catch (fallbackError) {
      console.error("🔴 [getAllCoupons] Flexible schema fallback also failed:", fallbackError);
      throw e; // Throw original error
    }
  }
}