import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "r53_session";
const PROTECTED_PREFIX = "/route53";

/**
 * Lightweight route guard: redirects unauthenticated visitors away from the
 * protected /route53 area before any page code runs, avoiding a flash of
 * protected UI. This only checks cookie *presence* (fast, edge-safe) -- the
 * actual token signature/expiry is verified server-side via GET /api/auth/me
 * by the client-side AuthProvider on mount, which redirects to /login if the
 * session turns out to be invalid/expired.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  if (pathname.startsWith(PROTECTED_PREFIX) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/route53", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/route53/:path*", "/login"],
};
