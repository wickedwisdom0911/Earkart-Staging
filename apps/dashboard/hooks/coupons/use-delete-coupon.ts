"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import deleteCoupon from "@/actions/coupons/delete-coupon";

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteCoupon(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

