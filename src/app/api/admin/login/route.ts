import { NextResponse } from "next/server";
import {
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { logAdminActivity } from "@/lib/storage";
import {
  getClientIp,
  getUserAgent,
  parseDeviceLabel,
} from "@/lib/request-info";

export async function POST(req: Request) {
  let body: { id?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { id, password } = body;
  if (!id || !password) {
    return NextResponse.json(
      { error: "아이디와 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const result = await checkCredentials(id, password);
  if (!result.ok) {
    if (result.reason === "pending") {
      return NextResponse.json(
        { error: "아직 승인 대기 중인 계정이에요. 관리자의 승인을 기다려주세요." },
        { status: 403 },
      );
    }
    if (result.reason === "rejected") {
      return NextResponse.json(
        { error: "이 계정은 승인이 거부됐어요. 기존 관리자에게 문의해주세요." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않아요." },
      { status: 401 },
    );
  }

  const token = await createSessionToken(id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  // Log the session event directly (cookie isn't in the incoming request yet)
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  const device = parseDeviceLabel(ua);
  await logAdminActivity({
    adminId: id,
    action: "session.login",
    description: `관리자 로그인 · ${device} · ${ip}`,
    meta: { ip, userAgent: ua, device },
  });
  return res;
}
