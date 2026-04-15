import { NextResponse } from "next/server";
import {
  getRoles,
  getRoleStatus,
  addRole,
  updateRole,
  deleteRole,
  type Role,
} from "@/lib/storage";

/** GET — return list of roles + legacy status map */
export async function GET() {
  const roles = await getRoles();
  const status = await getRoleStatus();
  return NextResponse.json({ roles, status });
}

/** POST — create a new role */
export async function POST(req: Request) {
  let body: Partial<Role>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  const label = String(body.label ?? "").trim();
  if (!slug || !/^[a-z][a-z0-9-]{0,30}$/i.test(slug)) {
    return NextResponse.json(
      { error: "slug는 영문으로 시작하는 영숫자/하이픈 30자 이하여야 해요." },
      { status: 400 },
    );
  }
  if (!label) {
    return NextResponse.json({ error: "이름이 필요해요." }, { status: 400 });
  }

  try {
    const next = await addRole({
      slug,
      label,
      color: typeof body.color === "string" ? body.color : "#6B7280",
      bg: typeof body.bg === "string" ? body.bg : "from-gray-50 to-gray-100",
      title: typeof body.title === "string" ? body.title : label,
      subtitle: typeof body.subtitle === "string" ? body.subtitle : "",
      intro: typeof body.intro === "string" ? body.intro : "",
      stack: Array.isArray(body.stack) ? body.stack.filter((s) => typeof s === "string") : [],
      talents: Array.isArray(body.talents)
        ? body.talents.filter(
            (t): t is { title: string; desc: string } =>
              typeof t === "object" &&
              t !== null &&
              typeof (t as { title?: unknown }).title === "string" &&
              typeof (t as { desc?: unknown }).desc === "string",
          )
        : [],
      open: typeof body.open === "boolean" ? body.open : true,
      openAt: typeof body.openAt === "string" ? body.openAt : null,
      closeAt: typeof body.closeAt === "string" ? body.closeAt : null,
    });
    return NextResponse.json({ roles: next });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}

/** PATCH — update an existing role (full or partial).
 *  Also accepts legacy `{ role, open }` shape to toggle by label. */
export async function PATCH(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Legacy: { role: "iOS", open: true } — toggle by label
  if (typeof body.role === "string" && typeof body.open === "boolean" && !body.slug) {
    const roles = await getRoles();
    const target = roles.find((r) => r.label === body.role);
    if (!target) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const next = await updateRole(target.slug, { open: body.open });
    return NextResponse.json({ roles: next });
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!slug) {
    return NextResponse.json({ error: "slug가 필요해요." }, { status: 400 });
  }

  const patch: Partial<Role> = {};
  if (typeof body.label === "string") patch.label = body.label;
  if (typeof body.color === "string") patch.color = body.color;
  if (typeof body.bg === "string") patch.bg = body.bg;
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.subtitle === "string") patch.subtitle = body.subtitle;
  if (typeof body.intro === "string") patch.intro = body.intro;
  if (Array.isArray(body.stack)) {
    patch.stack = body.stack.filter((s): s is string => typeof s === "string");
  }
  if (Array.isArray(body.talents)) {
    patch.talents = body.talents.filter(
      (t): t is { title: string; desc: string } =>
        typeof t === "object" &&
        t !== null &&
        typeof (t as { title?: unknown }).title === "string" &&
        typeof (t as { desc?: unknown }).desc === "string",
    );
  }
  if (typeof body.open === "boolean") patch.open = body.open;
  if (body.openAt === null || typeof body.openAt === "string")
    patch.openAt = body.openAt as string | null;
  if (body.closeAt === null || typeof body.closeAt === "string")
    patch.closeAt = body.closeAt as string | null;

  try {
    const next = await updateRole(slug, patch);
    return NextResponse.json({ roles: next });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}

/** DELETE — remove a role. Body: { slug } */
export async function DELETE(req: Request) {
  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const slug = body.slug ?? "";
  try {
    const next = await deleteRole(slug);
    return NextResponse.json({ roles: next });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
