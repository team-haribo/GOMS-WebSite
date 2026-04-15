import { NextResponse } from "next/server";
import { reorderFormFields } from "@/lib/storage";

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
    return NextResponse.json({ config: cfg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
