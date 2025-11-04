import { useQuery } from "@tanstack/react-query";
import getAllCoupons from "@/actions/coupons/get-all-coupons";
import { GetCouponsParams } from "@/models/coupon.model";

export default function useGetCoupons(
  params: GetCouponsParams = {},
  options?: { enabled?: boolean; onError?: (error: Error) => void }
) {
  return useQuery({
    queryKey: ["coupons", params],
    queryFn: async () => {
      const result = await getAllCoupons(params);
      return result ?? null; // never undefined
    },
    initialData: null,
    retry: false,
    ...options,
  });
}