import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/environment";
import { apiRequest } from "@/lib/api";
import { createSession } from "@/lib/session";
import { UserApiResponseSchema } from "@/models/user.model";


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isAiims = body?.isAiims === true;
    console.log("🔵 /api/auth/login payload:", { isAiims, email: body?.email });
    const baseUrl = await getBaseUrl(isAiims);
    console.log("🔵 /api/auth/login resolved baseUrl:", baseUrl);
    const url = `${baseUrl}auth/login`;

    const response = await apiRequest(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      UserApiResponseSchema
    );

    // Create NextResponse first
    const res = NextResponse.json(response);

    // Attach cookie explicitly to guarantee Set-Cookie header is sent
    // This is the KEY FIX for EC2 - cookies().set() alone doesn't always work behind Nginx
    if (response.success && response.data) {
      const cookie = await createSession(response.data);
      if (cookie) {
        res.cookies.set(cookie.name, cookie.value, cookie.options);
        console.log("🔵 Cookie attached to response:", cookie.name);
      } else {
        console.error("🔴 Failed to create session cookie");
      }
    }

    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


