import { NextResponse } from "next/server";
import {
  getApplicationBatches,
  createApplicationBatch,
} from "@/lib/storage";

// GET: list all batches (summary — still includes full apps for now,
// since the admin UI needs them for the expandable detail view)
export async function GET() {
  const batches = await getApplicationBatches();
  return NextResponse.json({ batches });
}

// POST: create a new batch by snapshotting current applications
// body: { title: string, clearCurrent?: boolean }
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : "";
  const clearCurrent = body.clearCurrent !== false; // default true

  if (!title.trim()) {
    return NextResponse.json(
      { error: "제목을 입력해주세요." },
      { status: 400 },
    );
  }

  try {
    const batch = await createApplicationBatch(title, clearCurrent);
    return NextResponse.json({ batch });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "저장 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
