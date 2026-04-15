import { NextResponse } from "next/server";
import {
  deleteApplication,
  getApplications,
  updateApplicationNote,
  updateApplicationStatus,
  type ApplicationStatus,
} from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-session";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "신규",
  reviewing: "검토 중",
  passed: "서류 통과",
  rejected: "불합격",
  hired: "합격",
};
const VALID_STATUSES = new Set<string>([
  "new",
  "reviewing",
  "passed",
  "rejected",
  "hired",
]);

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Capture name before delete so the log is readable
  const list = await getApplications();
  const target = list.find((a) => a.id === id);
  const ok = await deleteApplication(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await logAdminAction(
    req,
    "application.delete",
    `지원자 ${target?.name ?? id} 삭제`,
    { applicationId: id, role: target?.role },
  );
  return NextResponse.json({ ok: true });
}

// PATCH: partial update — either admin note or pipeline status.
// Body accepts one of: { adminNote: string } or { status: "new" | ... }.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Status update branch
  if (typeof body.status === "string") {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: "유효하지 않은 상태예요." },
        { status: 400 },
      );
    }
    const nextStatus = body.status as ApplicationStatus;
    const updated = await updateApplicationStatus(id, nextStatus);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await logAdminAction(
      req,
      "application.status",
      `지원자 ${updated.name ?? id} 상태 → ${STATUS_LABELS[nextStatus]}`,
      { applicationId: id, status: nextStatus },
    );
    return NextResponse.json({ application: updated });
  }

  // Admin note branch
  if (typeof body.adminNote !== "string") {
    return NextResponse.json(
      { error: "adminNote 또는 status가 필요해요." },
      { status: 400 },
    );
  }
  const updated = await updateApplicationNote(id, body.adminNote);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await logAdminAction(
    req,
    "application.note",
    `지원자 ${updated.name ?? id} 메모 ${
      updated.adminNote ? "수정" : "삭제"
    }`,
    { applicationId: id },
  );
  return NextResponse.json({ application: updated });
}
