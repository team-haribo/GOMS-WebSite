import { NextResponse } from "next/server";
import { getAdminId } from "@/lib/admin-session";
import { findAdminAccount, getAdminActivity } from "@/lib/storage";

// GET: current admin profile + their activity log (most recent first)
export async function GET() {
  const adminId = await getAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const account = await findAdminAccount(adminId);
  const all = await getAdminActivity();
  // Only show entries owned by this admin. For a single-admin deployment
  // this matches every row; for multi-admin it scopes the view.
  const mine = all.filter((a) => a.adminId === adminId);
  return NextResponse.json({
    adminId,
    name: account?.name ?? null,
    activity: mine,
  });
}
