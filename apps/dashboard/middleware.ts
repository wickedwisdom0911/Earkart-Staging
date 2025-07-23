import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define protected and public routes
  const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/consultation");
  const isPublicRoute = path === "/login" || path === "/";

  // Get session
  const session = await getSession();

  // Redirect logic
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
