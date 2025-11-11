"use server";
import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { DeleteCouponModel, DeleteCouponModelSchema } from "@/models/coupon.model";

export default async function deleteCoupon(id: string): Promise<DeleteCouponModel> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}coupon/delete/${id}`;
  const user = await verifySession();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const response = await apiRequest(
    url,
    {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    DeleteCouponModelSchema
  );

  return response;
}

