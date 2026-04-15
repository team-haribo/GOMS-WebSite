import { NextResponse } from "next/server";
import { getAdminId } from "@/lib/admin-session";
import { getAdminActivity } from "@/lib/storage";

/**
 * Full admin audit log. Returns every recorded activity entry regardless
 * of which admin performed it — intended for the "로그" system channel.
 *
 * Still guarded by an authenticated admin session; anonymous callers get
 * a 401 so the log isn't publicly browseable.
 */
export async function GET() {
  const adminId = await getAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const activity = await getAdminActivity();
  return NextResponse.json({ activity });
}
