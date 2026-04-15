import { NextResponse } from "next/server";
import { duplicateFormField } from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const cfg = await duplicateFormField(id);
    await logAdminAction(
      req,
      "form.field.duplicate",
      `지원폼 필드 "${id}" 복제`,
      { sourceId: id },
    );
    return NextResponse.json({ config: cfg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
