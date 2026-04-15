import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  addApplication,
  getApplications,
  getRoles,
  getFormConfig,
  isRoleEffectivelyOpen,
  logAdminActivity,
  type FormField,
  type Application,
} from "@/lib/storage";
import {
  verifyApplicantToken,
  APPLICANT_COOKIE_NAME,
  ALLOWED_APPLICANT_DOMAIN,
} from "@/lib/auth";
import {
  getClientIp,
  getUserAgent,
  parseDeviceLabel,
} from "@/lib/request-info";

export async function GET() {
  const list = await getApplications();
  return NextResponse.json({ applications: list });
}

// Built-in field IDs that map to Application columns
const BUILTIN_IDS = [
  "name",
  "studentId",
  "generation",
  "role",
  "github",
  "introduction",
  "motivation",
  "wantedFeatures",
  "portfolio",
] as const;

const URL_REGEX = /^(https?:\/\/|www\.)[^\s]+$/i;

function validateField(field: FormField, raw: unknown): string | null {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (!value) {
    if (field.required) return `${field.label}을(를) 입력해주세요.`;
    return null;
  }

  if (field.type === "role") {
    // Role validity is checked separately against the dynamic role list below
    return null;
  }

  if (field.type === "url") {
    try {
      new URL(value.startsWith("http") ? value : `https://${value}`);
    } catch {
      return `${field.label}은(는) 올바른 URL이어야 해요.`;
    }
    return null;
  }

  if (field.type === "username") {
    if (URL_REGEX.test(value) || value.includes("/")) {
      return `${field.label}에는 URL이 아닌 아이디만 입력해주세요.`;
    }
    return null;
  }

  if (field.pattern) {
    try {
      const re = new RegExp(field.pattern);
      if (!re.test(value))
        return field.patternError ?? `${field.label} 형식이 올바르지 않아요.`;
    } catch {
      /* invalid regex, skip */
    }
  }

  if (field.minLength !== undefined && value.length < field.minLength) {
    return `${field.label}은(는) 최소 ${field.minLength}자 이상이어야 해요. (현재 ${value.length}자)`;
  }
  if (field.maxLength !== undefined && value.length > field.maxLength) {
    return `${field.label}은(는) 최대 ${field.maxLength}자까지 입력할 수 있어요. (현재 ${value.length}자)`;
  }

  return null;
}

export async function POST(req: Request) {
  // Capture request provenance up front so every outcome (success, auth
  // failure, validation failure) can be logged with the same metadata.
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  const device = parseDeviceLabel(ua);

  /** Record a failed submission attempt in the audit log. */
  const logFail = async (
    actor: string,
    reason: string,
    extra?: Record<string, unknown>,
  ) => {
    const email =
      typeof extra?.email === "string" ? (extra.email as string) : null;
    const who = email && email !== actor ? `${actor} <${email}>` : actor;
    await logAdminActivity({
      adminId: actor,
      action: "application.submitFail",
      description: `${who} 지원 실패 — ${reason} · ${device} · ${ip}`,
      meta: { ip, userAgent: ua, device, reason, ...extra },
    });
  };

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    await logFail("지원자", "잘못된 요청 본문");
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const config = await getFormConfig();

  // 1. Google login is always required. The `requireEmailAuth` flag only
  //    controls whether the email must belong to @gsm.hs.kr.
  const jar = await cookies();
  const token = jar.get(APPLICANT_COOKIE_NAME)?.value;
  const session = await verifyApplicantToken(token);
  if (!session) {
    await logFail("지원자", "Google 로그인 필요");
    return NextResponse.json(
      { error: "Google 로그인이 필요해요." },
      { status: 401 },
    );
  }
  if (
    config.requireEmailAuth &&
    !session.email.endsWith(`@${ALLOWED_APPLICANT_DOMAIN}`)
  ) {
    await logFail(
      session.name ?? session.email,
      `${ALLOWED_APPLICANT_DOMAIN} 도메인 아님`,
      { email: session.email },
    );
    return NextResponse.json(
      {
        error: `광주소프트웨어마이스터고(@${ALLOWED_APPLICANT_DOMAIN}) 계정으로만 지원할 수 있어요.`,
      },
      { status: 403 },
    );
  }
  const verifiedEmail = session.email;
  const applicantLabel = session.name ?? verifiedEmail;

  // 2. Privacy consent
  if (config.privacyPolicy.enabled && body.privacyAgreed !== true) {
    await logFail(applicantLabel, "개인정보 동의 없음", {
      email: verifiedEmail,
    });
    return NextResponse.json(
      { error: "개인정보 수집 및 이용에 동의해야 지원할 수 있어요." },
      { status: 400 },
    );
  }

  // 3. Validate each field per config
  const fields = body.fields as Record<string, unknown> | undefined;
  if (!fields || typeof fields !== "object") {
    await logFail(applicantLabel, "입력 데이터 없음", {
      email: verifiedEmail,
    });
    return NextResponse.json(
      { error: "입력 데이터가 없어요." },
      { status: 400 },
    );
  }

  for (const field of config.fields) {
    if (field.hidden) continue;
    const err = validateField(field, fields[field.id]);
    if (err) {
      await logFail(applicantLabel, `필드 검증 실패: ${field.label}`, {
        fieldId: field.id,
        email: verifiedEmail,
      });
      return NextResponse.json({ error: err }, { status: 400 });
    }
  }

  // 4. Check role status against dynamic role list (label or slug match)
  const roleValue =
    typeof fields.role === "string" ? (fields.role as string).trim() : "";
  if (roleValue) {
    const allRoles = await getRoles();
    const matched = allRoles.find(
      (r) => r.label === roleValue || r.slug === roleValue.toLowerCase(),
    );
    if (!matched) {
      await logFail(applicantLabel, `잘못된 직군: ${roleValue}`, {
        email: verifiedEmail,
      });
      return NextResponse.json(
        { error: "잘못된 직군이에요." },
        { status: 400 },
      );
    }
    if (!isRoleEffectivelyOpen(matched)) {
      await logFail(applicantLabel, `${matched.label} 모집 마감 상태`, {
        role: matched.label,
        email: verifiedEmail,
      });
      return NextResponse.json(
        { error: "해당 직군은 현재 모집 마감 상태예요." },
        { status: 400 },
      );
    }
  }

  // 5. Build application — map built-in fields to columns, rest to custom
  const app: Omit<Application, "id" | "createdAt"> = {
    custom: {},
    privacyAgreed: true,
    email: verifiedEmail,
  };

  const builtinSet = new Set<string>(BUILTIN_IDS);

  for (const field of config.fields) {
    const raw = fields[field.id];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) continue;

    if (builtinSet.has(field.id)) {
      (app as Record<string, unknown>)[field.id] = value;
    } else {
      app.custom![field.id] = value;
    }
  }

  const saved = await addApplication(app);

  // Record the successful submission in the audit log (ip/device captured
  // at the top of the handler and reused for every outcome).
  const actor = saved.name ?? applicantLabel;
  const who =
    verifiedEmail && verifiedEmail !== actor
      ? `${actor} <${verifiedEmail}>`
      : actor;
  await logAdminActivity({
    adminId: actor,
    action: "application.submit",
    description: `${who}${saved.role ? ` (${saved.role})` : ""} 지원 제출 · ${device} · ${ip}`,
    meta: {
      applicationId: saved.id,
      role: saved.role,
      email: verifiedEmail,
      ip,
      userAgent: ua,
      device,
    },
  });

  return NextResponse.json({ ok: true, application: saved });
}
