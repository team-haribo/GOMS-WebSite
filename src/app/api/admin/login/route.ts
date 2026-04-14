import { NextResponse } from "next/server";
import {
  checkCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";

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

  if (!checkCredentials(id, password)) {
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
  return res;
}
