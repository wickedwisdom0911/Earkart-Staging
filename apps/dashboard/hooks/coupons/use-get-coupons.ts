// apps/dashboard/hooks/coupons/use-get-coupons.ts
import { useQuery } from "@tanstack/react-query";
import { getAllCoupons } from "@/actions/coupons/get-all-coupons";

export function useGetCoupons(params = {}) {
  return useQuery({
    queryKey: ["coupons", params],
    queryFn: () => getAllCoupons(params),
  });
}