import { NextResponse } from "next/server";
import { getAdminId, logAdminAction } from "@/lib/admin-session";
import {
  deleteAdminAccount,
  findAdminAccount,
  updateAdminAccount,
  type AdminAccount,
} from "@/lib/storage";

/**
 * Verifies the dedicated approval password from ADMIN_APPROVAL_PASSWORD.
 * This is a separate secret from any individual admin's login password —
 * even a logged-in admin can't approve new accounts without it, which
 * prevents a hijacked session from rubber-stamping pending registrations.
 *
 * Returns an error NextResponse when verification fails, or null when OK.
 */
function checkApprovalPassword(password: string): NextResponse | null {
  const expected = process.env.ADMIN_APPROVAL_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "서버 설정 오류: ADMIN_APPROVAL_PASSWORD 환경변수가 설정되지 않았어요.",
      },
      { status: 500 },
    );
  }
  if (!password) {
    return NextResponse.json(
      { error: "승인 암호를 입력해주세요." },
      { status: 400 },
    );
  }
  // Timing-safe compare via length check + XOR accumulator
  if (password.length !== expected.length) {
    return NextResponse.json(
      { error: "승인 암호가 올바르지 않아요." },
      { status: 401 },
    );
  }
  let diff = 0;
  for (let i = 0; i < password.length; i++) {
    diff |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json(
      { error: "승인 암호가 올바르지 않아요." },
      { status: 401 },
    );
  }
  return null;
}

/**
 * PATCH: change an account's status (approve / reject / re-approve).
 * Body: { status: "approved" | "rejected" }
 *
 * Any currently authenticated admin can perform the change. The acting
 * admin's id is recorded on the target account and in the audit log.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await getAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json(
      { error: "status는 approved 또는 rejected만 가능해요." },
      { status: 400 },
    );
  }

  // Require the dedicated approval password (ADMIN_APPROVAL_PASSWORD).
  // This is a separate secret from any admin's login password — only a
  // caller who knows it can rubber-stamp new accounts.
  const approvalPassword =
    typeof body.approvalPassword === "string" ? body.approvalPassword : "";
  const approvalError = checkApprovalPassword(approvalPassword);
  if (approvalError) return approvalError;

  const target = await findAdminAccount(id);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const patch: Partial<AdminAccount> =
    status === "approved"
      ? { status, approvedAt: now, approvedBy: adminId }
      : { status, rejectedAt: now, rejectedBy: adminId };

  const updated = await updateAdminAccount(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await logAdminAction(
    req,
    status === "approved" ? "account.approve" : "account.reject",
    status === "approved"
      ? `관리자 계정 "${target.id}" 승인`
      : `관리자 계정 "${target.id}" 거부`,
    { targetId: target.id },
  );

  const { passwordHash: _h, passwordSalt: _s, ...sanitized } = updated;
  return NextResponse.json({ account: sanitized });
}

/** DELETE: remove an account permanently. Requires password re-confirm. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await getAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Safety: don't let the acting admin delete themselves
  if (id.toLowerCase() === adminId.toLowerCase()) {
    return NextResponse.json(
      { error: "본인 계정은 삭제할 수 없어요." },
      { status: 400 },
    );
  }

  // Require the dedicated approval password (query ?approvalPassword=…).
  // Reading from the URL rather than the body so DELETE can still
  // work with fetch's optional body semantics.
  const url = new URL(req.url);
  const approvalPassword = url.searchParams.get("approvalPassword") ?? "";
  const approvalError = checkApprovalPassword(approvalPassword);
  if (approvalError) return approvalError;

  const target = await findAdminAccount(id);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Extra safety: don't let a non-super admin nuke the super admin
  if (target.role === "super") {
    return NextResponse.json(
      { error: "super 관리자는 삭제할 수 없어요." },
      { status: 403 },
    );
  }

  const ok = await deleteAdminAccount(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await logAdminAction(
    req,
    "account.delete",
    `관리자 계정 "${target.id}" 삭제`,
    { targetId: target.id },
  );

  return NextResponse.json({ ok: true });
}
