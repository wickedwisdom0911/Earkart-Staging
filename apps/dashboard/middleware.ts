import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "./lib/session";

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);
  // 3. Decrypt the session from the cookie
  const cookie = await cookies();
  const session = await decrypt(cookie.get("session_omni")?.value);
  // 4. Redirect
  if (isProtectedRoute && !session?.user?.token) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Only redirect from /login if logged in
  if (isPublicRoute && session?.user?.token) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}
