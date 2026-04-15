import { NextResponse } from "next/server";
import { deleteApplication, updateApplicationNote } from "@/lib/storage";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await deleteApplication(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
  return NextResponse.json({ application: updated });
}
