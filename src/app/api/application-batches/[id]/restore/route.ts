import { NextResponse } from "next/server";
import { restoreApplicationBatch } from "@/lib/storage";

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

  const restored = await restoreApplicationBatch(id, applicationIds);
  if (restored === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, restored: restored.length });
}
