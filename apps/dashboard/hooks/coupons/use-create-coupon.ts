"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CouponDataModel } from "@/models/coupon.model";
import createCoupon from "@/actions/coupons/create-coupon";

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (coupon: CouponDataModel) => {
      return await createCoupon(coupon);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}