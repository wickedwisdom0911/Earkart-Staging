"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { CouponDataModel, CreateCouponModel, CreateCouponModelSchema } from "@/models/coupon.model";

export async function createCoupon(data: CouponDataModel):Promise<CreateCouponModel> {
  const baseUrl = await getBaseUrl();

  const user = await verifySession();
  if (!user) throw new Error("Unauthorized");
  return await apiRequest<CreateCouponModel>(
    `${baseUrl}coupon/create`,
    { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` }, body: JSON.stringify(data) },
    CreateCouponModelSchema
  );
}