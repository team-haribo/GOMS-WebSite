import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

// Pages that should be accessible without an admin session. These are
// either the login/register screens themselves or flows that exist
// precisely for unauthenticated visitors.
const PUBLIC_ADMIN_PAGES = new Set<string>([
  "/admin/login",
  "/admin/register",
]);

// API endpoints under /api/admin/* that don't require an existing session.
const PUBLIC_ADMIN_APIS = new Set<string>([
  "/api/admin/login",
  "/api/admin/register",
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin pages except for the public ones (login / register)
  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN_PAGES.has(pathname)) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect mutation APIs + admin-only read APIs.
  // /api/application-batches stores full PII snapshots of applicants
  // (name, email, studentId, memos) and must NEVER be public — gate every
  // method, including GET.
  const needsAuth =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/application-batches") ||
    (pathname.startsWith("/api/members") && req.method !== "GET") ||
    (pathname.startsWith("/api/roles") && req.method !== "GET") ||
    (pathname.startsWith("/api/form-config") && req.method !== "GET") ||
    (pathname.startsWith("/api/applications") && req.method !== "POST");

  // Allow public admin endpoints
  if (PUBLIC_ADMIN_APIS.has(pathname)) {
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
    "/api/application-batches/:path*",
  ],
};
