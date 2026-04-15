import { NextResponse } from "next/server";
import {
  getFormConfig,
  updateFormSettings,
  addFormField,
  type FormField,
  type FormFieldType,
} from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-session";

const VALID_TYPES: FormFieldType[] = [
  "text",
  "textarea",
  "url",
  "role",
  "username",
];

// GET: return full form config (public)
export async function GET() {
  const config = await getFormConfig();
  return NextResponse.json({ config });
}

// PATCH: update settings (requireEmailAuth, privacyPolicy) — admin only
export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const patch: Parameters<typeof updateFormSettings>[0] = {};
  if (typeof body.requireEmailAuth === "boolean")
    patch.requireEmailAuth = body.requireEmailAuth;
  if (body.privacyPolicy && typeof body.privacyPolicy === "object") {
    const pp = body.privacyPolicy as Record<string, unknown>;
    patch.privacyPolicy = {
      enabled: typeof pp.enabled === "boolean" ? pp.enabled : true,
      summary: typeof pp.summary === "string" ? pp.summary : "",
      details: typeof pp.details === "string" ? pp.details : "",
    };
  }

  const cfg = await updateFormSettings(patch);
  const parts: string[] = [];
  if (patch.requireEmailAuth !== undefined)
    parts.push(
      `학생 인증 필수 ${patch.requireEmailAuth ? "켜짐" : "꺼짐"}`,
    );
  if (patch.privacyPolicy) parts.push("개인정보 방침 수정");
  await logAdminAction(
    req,
    "form.settings",
    `지원폼 설정 수정 (${parts.join(", ") || "변경사항"})`,
    { patch },
  );
  return NextResponse.json({ config: cfg });
}

// POST: add a custom field — admin only
export async function POST(req: Request) {
  let body: Partial<FormField>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  const label = String(body.label ?? "").trim();
  const type = body.type;
  const required = Boolean(body.required);

  if (!id || !/^[a-z][a-z0-9_-]{0,30}$/i.test(id)) {
    return NextResponse.json(
      { error: "id는 영문으로 시작하는 영숫자 30자 이하여야 해요." },
      { status: 400 },
    );
  }
  if (!label) {
    return NextResponse.json(
      { error: "label이 필요해요." },
      { status: 400 },
    );
  }
  if (!type || !VALID_TYPES.includes(type as FormFieldType)) {
    return NextResponse.json({ error: "잘못된 type이에요." }, { status: 400 });
  }

  const field: FormField = {
    id,
    label,
    type: type as FormFieldType,
    required,
    placeholder:
      typeof body.placeholder === "string" ? body.placeholder : undefined,
    helpText: typeof body.helpText === "string" ? body.helpText : undefined,
    pattern: typeof body.pattern === "string" ? body.pattern : undefined,
    patternError:
      typeof body.patternError === "string" ? body.patternError : undefined,
    minLength:
      typeof body.minLength === "number" && body.minLength > 0
        ? body.minLength
        : undefined,
    maxLength:
      typeof body.maxLength === "number" && body.maxLength > 0
        ? body.maxLength
        : undefined,
    builtin: false,
  };

  try {
    const cfg = await addFormField(field);
    await logAdminAction(req, "form.field.add", `지원폼 필드 "${label}" 추가`, {
      id,
      type,
    });
    return NextResponse.json({ config: cfg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
