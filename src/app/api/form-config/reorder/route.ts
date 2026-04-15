import { NextResponse } from "next/server";
import { reorderFormFields } from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-session";

export async function POST(req: Request) {
  let body: { orderedIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!Array.isArray(body.orderedIds)) {
    return NextResponse.json(
      { error: "orderedIds 배열이 필요해요." },
      { status: 400 },
    );
  }

  const ids = body.orderedIds.filter((x): x is string => typeof x === "string");
  try {
    const cfg = await reorderFormFields(ids);
    await logAdminAction(
      req,
      "form.field.reorder",
      `지원폼 필드 순서 변경 (${ids.length}개)`,
      { count: ids.length },
    );
    return NextResponse.json({ config: cfg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
