import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-session";
import {
  getClientIp,
  getUserAgent,
  parseDeviceLabel,
} from "@/lib/request-info";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  const device = parseDeviceLabel(ua);
  // Log before clearing the cookie so getAdminId can still resolve
  await logAdminAction(
    req,
    "session.logout",
    `관리자 로그아웃 · ${device} · ${ip}`,
    { ip, userAgent: ua, device },
  );
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
