import { NextResponse } from "next/server";
import {
  createApplicantToken,
  APPLICANT_COOKIE_NAME,
  APPLICANT_MAX_AGE,
  ALLOWED_APPLICANT_DOMAIN,
} from "@/lib/auth";
import { getFormConfig, logAdminActivity } from "@/lib/storage";
import {
  getClientIp,
  getUserAgent,
  parseDeviceLabel,
} from "@/lib/request-info";

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
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  const device = parseDeviceLabel(ua);

  const logFail = async (
    actor: string,
    reason: string,
    extra?: Record<string, unknown>,
  ) => {
    const email =
      typeof extra?.email === "string" ? (extra.email as string) : null;
    // Compose a description that surfaces the account (email) whenever we
    // know it — so the admin can tell exactly which Google account failed.
    const who = email && email !== actor ? `${actor} <${email}>` : actor;
    await logAdminActivity({
      adminId: actor,
      action: "application.authGoogleFail",
      description: `${who} Google 로그인 실패 — ${reason} · ${device} · ${ip}`,
      meta: { ip, userAgent: ua, device, reason, ...extra },
    });
  };

  let body: { credential?: string };
  try {
    body = await req.json();
  } catch {
    await logFail("지원자", "잘못된 요청 본문");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const credential = body.credential;
  if (!credential) {
    await logFail("지원자", "credential 누락");
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
      await logFail("지원자", "Google 토큰 검증 실패");
      return NextResponse.json(
        { error: "Google 토큰 검증에 실패했어요." },
        { status: 401 },
      );
    }
    info = (await res.json()) as GoogleTokenInfo;
  } catch {
    await logFail("지원자", "Google 서버 오류");
    return NextResponse.json(
      { error: "Google 인증 중 오류가 발생했어요." },
      { status: 500 },
    );
  }

  const actorLabel = info.name ?? info.email ?? "지원자";

  // Validate issuer
  if (info.iss !== "accounts.google.com" && info.iss !== "https://accounts.google.com") {
    await logFail(actorLabel, "잘못된 토큰 발급자", { email: info.email });
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
    await logFail(actorLabel, "audience 불일치", { email: info.email });
    return NextResponse.json(
      { error: "토큰 수신자가 일치하지 않아요." },
      { status: 401 },
    );
  }

  // Validate email verified
  const verified =
    info.email_verified === true || info.email_verified === "true";
  if (!verified) {
    await logFail(actorLabel, "Google 미인증 이메일", { email: info.email });
    return NextResponse.json(
      { error: "이메일이 Google에서 인증되지 않았어요." },
      { status: 401 },
    );
  }

  // Validate domain (only when the form requires @gsm.hs.kr auth)
  const email = (info.email || "").toLowerCase();
  const config = await getFormConfig();
  if (config.requireEmailAuth) {
    const isGsmHsKr =
      info.hd === ALLOWED_APPLICANT_DOMAIN ||
      email.endsWith(`@${ALLOWED_APPLICANT_DOMAIN}`);

    if (!isGsmHsKr) {
      await logFail(
        actorLabel,
        `${ALLOWED_APPLICANT_DOMAIN} 도메인 아님`,
        { email },
      );
      return NextResponse.json(
        {
          error: `광주소프트웨어마이스터고등학교 계정(@${ALLOWED_APPLICANT_DOMAIN})으로만 지원할 수 있어요.`,
        },
        { status: 403 },
      );
    }
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

  // Success log — always include the email so it's obvious which Google
  // account signed in, even when the display name matches multiple users.
  const successWho =
    info.name && info.name !== email ? `${info.name} <${email}>` : email;
  await logAdminActivity({
    adminId: actorLabel,
    action: "application.authGoogle",
    description: `${successWho} Google 로그인 성공 · ${device} · ${ip}`,
    meta: { ip, userAgent: ua, device, email, name: info.name },
  });

  return res;
}
