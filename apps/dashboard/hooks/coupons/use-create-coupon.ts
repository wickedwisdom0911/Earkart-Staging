import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCoupon } from "@/actions/coupons/create-coupon";

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      // Invalidate the coupons query so list auto-refreshes
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}