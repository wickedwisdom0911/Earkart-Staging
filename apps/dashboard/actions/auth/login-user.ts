"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { createSession } from "@/lib/session";
import { UserApiResponseSchema, UserModel } from "@/models/user.model";

export default async function loginUser(
  formData: FormData
): Promise<UserModel> {
  try {
    console.log("🔵 Login server action called");

    // Debug environment variables
    console.log("🔵 Environment check:", {
      IS_PRODUCTION: process.env.IS_PRODUCTION,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      BASE_API_URL_PROD: process.env.BASE_API_URL_PROD ? "SET" : "NOT SET",
      BASE_API_URL_DEV: process.env.BASE_API_URL_DEV ? "SET" : "NOT SET",
    });

    const uri = await getBaseUrl();
    console.log("🔵 Resolved base URL:", uri);

    const url = `${uri}auth/login`;
    console.log("🔵 Full API URL:", url);

    const requestBody = Object.fromEntries(formData);
    console.log("🔵 Request body:", {
      email: requestBody.email,
      password: "***",
    });

    const response = await apiRequest(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
      UserApiResponseSchema
    );

    console.log(" API Response:", {
      success: response.success,
      message: response.message,
      hasData: !!response.data,
    });

    if (response.success && response.data) {
      console.log("🔵 Creating session...");
      const sessionResult = await createSession(response.data);
      console.log("🔵 Session creation result:", sessionResult);
    }

    return response;
  } catch (error) {
    console.error("🔴 Login error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
