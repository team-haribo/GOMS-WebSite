import { NextResponse } from "next/server";
import {
  deleteApplication,
  getApplications,
  updateApplicationNote,
} from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-session";

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

// PATCH: update admin-only note on an application
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
  if (typeof body.adminNote !== "string") {
    return NextResponse.json(
      { error: "adminNote가 필요해요." },
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
