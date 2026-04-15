import { NextResponse } from "next/server";
import {
  getApplicationBatches,
  deleteApplicationBatch,
} from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const batches = await getApplicationBatches();
  const batch = batches.find((b) => b.id === id);
  if (!batch) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ batch });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const batches = await getApplicationBatches();
  const target = batches.find((b) => b.id === id);
  const ok = await deleteApplicationBatch(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await logAdminAction(
    req,
    "batch.delete",
    `모집 기록 "${target?.title ?? id}" 삭제`,
    { batchId: id },
  );
  return NextResponse.json({ ok: true });
}
