import { NextResponse } from "next/server";
import { getAdminId } from "@/lib/admin-session";
import {
  deleteAdminActivity,
  findAdminAccount,
} from "@/lib/storage";

/**
 * DELETE a specific activity log entry. Gated on two things:
 *   1. The caller must be a logged-in super admin
 *   2. The caller must pass the dedicated approval password (same secret
 *      used for admin account mutations) via ?approvalPassword= query
 *
 * Intentionally does NOT write a meta log entry for the deletion itself —
 * if super admins could only remove a row while leaving a breadcrumb
 * "log.delete" record pointing at the original content, the whole point
 * of being able to scrub a log would be defeated. So this is a silent
 * drop: the row is gone and no trace is left.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await getAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const acting = await findAdminAccount(adminId);
  if (!acting || acting.role !== "super") {
    return NextResponse.json(
      { error: "super 관리자만 로그를 삭제할 수 있어요." },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const approvalPassword = url.searchParams.get("approvalPassword") ?? "";
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
  if (!approvalPassword) {
    return NextResponse.json(
      { error: "승인 암호를 입력해주세요." },
      { status: 400 },
    );
  }
  if (approvalPassword.length !== expected.length) {
    return NextResponse.json(
      { error: "승인 암호가 올바르지 않아요." },
      { status: 401 },
    );
  }
  let diff = 0;
  for (let i = 0; i < approvalPassword.length; i++) {
    diff |= approvalPassword.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json(
      { error: "승인 암호가 올바르지 않아요." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const removed = await deleteAdminActivity(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
