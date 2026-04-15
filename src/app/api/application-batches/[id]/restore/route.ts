import { NextResponse } from "next/server";
import {
  getApplicationBatches,
  restoreApplicationBatch,
} from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Body is optional. If `applicationIds` is an array, restore only those.
  let applicationIds: string[] | undefined;
  try {
    const body = (await req.json()) as { applicationIds?: unknown };
    if (Array.isArray(body.applicationIds)) {
      applicationIds = body.applicationIds.filter(
        (x): x is string => typeof x === "string",
      );
    }
  } catch {
    /* empty body is fine */
  }

  // Snapshot the batch title before the mutation so we can log it
  const before = await getApplicationBatches();
  const batch = before.find((b) => b.id === id);

  const restored = await restoreApplicationBatch(id, applicationIds);
  if (restored === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const full = applicationIds === undefined;
  await logAdminAction(
    req,
    full ? "batch.restore" : "batch.restore.partial",
    full
      ? `모집 기록 "${batch?.title ?? id}" 전체 복구 (${restored.length}명)`
      : `모집 기록 "${batch?.title ?? id}"에서 ${restored.length}명 복구`,
    { batchId: id, count: restored.length, full },
  );
  return NextResponse.json({ ok: true, restored: restored.length });
}
