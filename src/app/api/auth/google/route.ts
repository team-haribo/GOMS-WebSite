import { NextResponse } from "next/server";
import {
  createApplicantToken,
  APPLICANT_COOKIE_NAME,
  APPLICANT_MAX_AGE,
  ALLOWED_APPLICANT_DOMAIN,
} from "@/lib/auth";

interface GoogleTokenInfo {
  iss: string;
  azp?: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  hd?: string; // hosted domain
  exp: string;
  error_description?: string;
}

export async function POST(req: Request) {
  let body: { credential?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const credential = body.credential;
  if (!credential) {
    return NextResponse.json({ error: "Missing credential" }, { status: 400 });
  }

  // Verify the ID token via Google's tokeninfo endpoint
  let info: GoogleTokenInfo;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Google 토큰 검증에 실패했어요." },
        { status: 401 },
      );
    }
    info = (await res.json()) as GoogleTokenInfo;
  } catch {
    return NextResponse.json(
      { error: "Google 인증 중 오류가 발생했어요." },
      { status: 500 },
    );
  }

  // Validate issuer
  if (info.iss !== "accounts.google.com" && info.iss !== "https://accounts.google.com") {
    return NextResponse.json(
      { error: "잘못된 토큰 발급자예요." },
      { status: 401 },
    );
  }

  // Validate audience (our client ID)
  const expectedAud = process.env.GOOGLE_CLIENT_ID;
  if (!expectedAud) {
    return NextResponse.json(
      { error: "서버 설정 오류: GOOGLE_CLIENT_ID가 설정되지 않았어요." },
      { status: 500 },
    );
  }
  if (info.aud !== expectedAud) {
    return NextResponse.json(
      { error: "토큰 수신자가 일치하지 않아요." },
      { status: 401 },
    );
  }

  // Validate email verified
  const verified =
    info.email_verified === true || info.email_verified === "true";
  if (!verified) {
    return NextResponse.json(
      { error: "이메일이 Google에서 인증되지 않았어요." },
      { status: 401 },
    );
  }

  // Validate domain
  const email = (info.email || "").toLowerCase();
  const isGsmHsKr =
    info.hd === ALLOWED_APPLICANT_DOMAIN ||
    email.endsWith(`@${ALLOWED_APPLICANT_DOMAIN}`);

  if (!isGsmHsKr) {
    return NextResponse.json(
      {
        error: `광주소프트웨어마이스터고등학교 계정(@${ALLOWED_APPLICANT_DOMAIN})으로만 지원할 수 있어요.`,
      },
      { status: 403 },
    );
  }

  // Create session cookie
  const token = await createApplicantToken({
    email,
    name: info.name,
    picture: info.picture,
  });
  const res = NextResponse.json({
    ok: true,
    email,
    name: info.name,
    picture: info.picture,
  });
  res.cookies.set(APPLICANT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: APPLICANT_MAX_AGE,
  });
  return res;
}
