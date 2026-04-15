import { NextResponse } from "next/server";
import { getAdminId } from "@/lib/admin-session";
import { getAdminAccounts } from "@/lib/storage";

/**
 * GET: list all admin accounts (including pending/rejected). Strips the
 * password hash and salt before returning so they never leak to the client.
 */
export async function GET() {
  const adminId = await getAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await getAdminAccounts();
  const sanitized = list.map(
    ({ passwordHash: _h, passwordSalt: _s, ...rest }) => rest,
  );
  return NextResponse.json({ accounts: sanitized });
}
