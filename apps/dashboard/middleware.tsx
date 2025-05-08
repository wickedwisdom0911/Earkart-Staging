import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "./lib/session";

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  // 3. Decrypt the session from the cookie
  const cookie = await cookies();
  const session = await decrypt(cookie.get("session_omni")?.value);
  // 4. Redirect
  if (isProtectedRoute && !session?.user?.token) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}
