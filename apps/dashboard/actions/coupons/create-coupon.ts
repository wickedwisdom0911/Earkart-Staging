"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import {
  CreateCouponModel,
  CreateCouponModelSchema,
  CouponDataModel,
} from "@/models/coupon.model";

export default async function createCoupon(
  coupon: CouponDataModel
): Promise<CreateCouponModel> {
  const {
    code,
    description,
    type,
    value,
    maxDiscount,
    minOrderAmount,
    startAt,
    endAt,
    usageLimitPerUser,
    usageLimitTotal,
    applicableCentreId,
    applicablePricingId,
    status,
  } = coupon;

  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}coupon/create`;
  const user = await verifySession();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify({
        code,
        description,
        type,
        value,
        maxDiscount,
        minOrderAmount,
        startAt,
        endAt,
        usageLimitPerUser,
        usageLimitTotal,
        applicableCentreId,
        applicablePricingId,
        status,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    CreateCouponModelSchema
  );

  return response;
}