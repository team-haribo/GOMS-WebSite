import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./auth";
import { logAdminActivity } from "./storage";
import {
  getClientIp,
  getUserAgent,
  parseDeviceLabel,
} from "./request-info";

/**
 * Returns the currently authenticated admin id, or null if there's no
 * valid session. Safe to call from any API route.
 */
export async function getAdminId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  return session?.id ?? null;
}

/**
 * Records an admin activity entry tied to the current session. If there's
 * no session (unauthenticated call) the log entry is silently dropped so
 * public endpoints can call this without extra branching.
 *
 * When a Request is passed, the client IP, raw user-agent, and a friendly
 * device label are automatically merged into meta so every mutation gets
 * the same per-action provenance as session events.
 */
export async function logAdminAction(
  req: Request,
  action: string,
  description: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  const adminId = await getAdminId();
  if (!adminId) return;
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const device = parseDeviceLabel(userAgent);
  await logAdminActivity({
    adminId,
    action,
    description,
    meta: { ...meta, ip, userAgent, device },
  });
}
