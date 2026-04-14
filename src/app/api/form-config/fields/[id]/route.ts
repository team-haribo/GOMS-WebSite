import { NextResponse } from "next/server";
import {
  deleteFormField,
  updateFormField,
  type FormField,
} from "@/lib/storage";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: Partial<FormField>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const patch: Partial<FormField> = {};
  if (typeof body.label === "string") patch.label = body.label;
  if (typeof body.required === "boolean") patch.required = body.required;
  if (typeof body.placeholder === "string")
    patch.placeholder = body.placeholder;
  if (typeof body.helpText === "string") patch.helpText = body.helpText;
  if (typeof body.minLength === "number") patch.minLength = body.minLength;
  if (typeof body.maxLength === "number") patch.maxLength = body.maxLength;
  // Don't allow changing id, type, or builtin

  try {
    const cfg = await updateFormField(id, patch);
    return NextResponse.json({ config: cfg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const cfg = await deleteFormField(id);
    return NextResponse.json({ config: cfg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
