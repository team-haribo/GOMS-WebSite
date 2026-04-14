import { NextResponse } from "next/server";
import {
  getRoleStatus,
  setRoleStatus,
  ROLE_KEYS,
  type RoleKey,
} from "@/lib/storage";

export async function GET() {
  const status = await getRoleStatus();
  return NextResponse.json({ status });
}

export async function PATCH(req: Request) {
  let body: { role?: string; open?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const role = body.role;
  const open = body.open;

  if (!role || !ROLE_KEYS.includes(role as RoleKey)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (typeof open !== "boolean") {
    return NextResponse.json({ error: "Invalid open" }, { status: 400 });
  }

  const next = await setRoleStatus(role as RoleKey, open);
  return NextResponse.json({ status: next });
}
