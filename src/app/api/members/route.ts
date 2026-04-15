import { NextResponse } from "next/server";
import { addExtraMember, getMembersMeta } from "@/lib/storage";
import { getMembers } from "@/lib/getMembers";
import { logAdminAction } from "@/lib/admin-session";

// GET: return full members list (with meta + extras + hidden applied)
export async function GET() {
  const [members, meta] = await Promise.all([getMembers(), getMembersMeta()]);
  return NextResponse.json({ members, meta });
}

// POST: add an extra (non-org) member
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const login = String(body.login ?? "").trim();
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "").trim();
  const avatar = String(body.avatar ?? "").trim();
  const generation =
    typeof body.generation === "number" ? body.generation : undefined;
  const leader =
    typeof body.leader === "boolean" ? body.leader : undefined;

  if (!login || !name || !role || !avatar) {
    return NextResponse.json(
      { error: "login, name, role, avatar는 필수예요." },
      { status: 400 },
    );
  }

  const next = await addExtraMember({
    login,
    name,
    role,
    avatar,
    generation,
    leader,
  });
  await logAdminAction(req, "member.addExtra", `외부 멤버 ${name} 추가`, {
    login,
    role,
  });
  return NextResponse.json({ meta: next });
}
