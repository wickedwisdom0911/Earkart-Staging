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

    if (response.success && response.data) {
      await createSession(response.data);
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}


