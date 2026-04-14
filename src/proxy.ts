import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin pages except /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect mutation APIs
  const needsAuth =
    pathname.startsWith("/api/admin") ||
    (pathname.startsWith("/api/members") && req.method !== "GET") ||
    (pathname.startsWith("/api/roles") && req.method !== "GET") ||
    (pathname.startsWith("/api/form-config") && req.method !== "GET") ||
    (pathname.startsWith("/api/applications") && req.method !== "POST");

  // Allow login endpoint
  if (pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (needsAuth) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/members/:path*",
    "/api/roles/:path*",
    "/api/form-config/:path*",
    "/api/applications/:path*",
  ],
};
