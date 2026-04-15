import { NextResponse } from "next/server";
import {
  deleteExtraMember,
  deleteMemberMeta,
  toggleMemberHidden,
  updateMemberMeta,
} from "@/lib/storage";
import { logAdminAction } from "@/lib/admin-session";

// PATCH: update meta for a given login (either org member or extra)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ login: string }> },
) {
  const { login } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const patch: {
    name?: string;
    role?: string;
    generation?: number;
    leader?: boolean;
  } = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.role === "string") patch.role = body.role.trim();
  if (body.generation === null) patch.generation = undefined;
  else if (typeof body.generation === "number")
    patch.generation = body.generation;
  if (typeof body.leader === "boolean") patch.leader = body.leader;

  const next = await updateMemberMeta(login, patch);
  await logAdminAction(
    req,
    "member.update",
    `멤버 ${patch.name ?? login} 정보 수정`,
    { login, fields: Object.keys(patch) },
  );
  return NextResponse.json({ meta: next });
}

// DELETE: hide an org member or remove extra member
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ login: string }> },
) {
  const { login } = await params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // "extra" | "org" (default)

  if (type === "extra") {
    const next = await deleteExtraMember(login);
    await logAdminAction(
      req,
      "member.deleteExtra",
      `외부 멤버 ${login} 삭제`,
      { login },
    );
    return NextResponse.json({ meta: next });
  }

  // Org member → hide
  const next = await toggleMemberHidden(login);
  await logAdminAction(
    req,
    "member.toggleHidden",
    `멤버 ${login} 숨김 토글`,
    { login },
  );
  return NextResponse.json({ meta: next });
}

// Re-expose via POST for toggling hidden (handier from UI)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ login: string }> },
) {
  const { login } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  if (action === "toggle-hidden") {
    const next = await toggleMemberHidden(login);
    await logAdminAction(
      req,
      "member.toggleHidden",
      `멤버 ${login} 숨김 토글`,
      { login },
    );
    return NextResponse.json({ meta: next });
  }
  if (action === "delete-meta") {
    const next = await deleteMemberMeta(login);
    await logAdminAction(
      req,
      "member.deleteMeta",
      `멤버 ${login} 메타 삭제`,
      { login },
    );
    return NextResponse.json({ meta: next });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
