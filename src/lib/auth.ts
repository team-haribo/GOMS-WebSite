// HMAC-signed session cookie for admin auth. Supports multiple accounts
// stored in the admin-accounts KV row; legacy env-based single-admin is
// still honored via automatic seeding on first credential check.
import {
  createAdminAccount,
  findAdminAccount,
  getAdminAccounts,
  type AdminAccount,
} from "./storage";
import { hashPassword, verifyPassword } from "./password";

const COOKIE_NAME = "goms_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set in .env.local");
  }
  return secret;
}

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  // base64url encode
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createSessionToken(id: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `${id}.${expires}`;
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<{ id: string } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expStr, sig] = parts;
  const payload = `${id}.${expStr}`;
  const expected = await hmacSign(payload);
  if (sig !== expected) return null;
  const exp = parseInt(expStr, 10);
  if (!exp || exp < Math.floor(Date.now() / 1000)) return null;
  return { id };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SEC;

// ================= Applicant session (Google OAuth) =================

export const APPLICANT_COOKIE_NAME = "goms_applicant";
const APPLICANT_MAX_AGE_SEC = 60 * 60 * 2; // 2 hours

export interface ApplicantSession {
  email: string;
  name?: string;
  picture?: string;
}

export async function createApplicantToken(
  session: ApplicantSession,
): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + APPLICANT_MAX_AGE_SEC;
  // Encode session as base64url JSON
  const data = btoa(
    unescape(encodeURIComponent(JSON.stringify({ ...session, exp: expires }))),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const sig = await hmacSign(data);
  return `${data}.${sig}`;
}

export async function verifyApplicantToken(
  token: string | undefined | null,
): Promise<ApplicantSession | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = await hmacSign(data);
  if (sig !== expected) return null;
  try {
    const padded = data.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      escape(atob(padded + "===".slice((padded.length + 3) % 4))),
    );
    const parsed = JSON.parse(json) as ApplicantSession & { exp: number };
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: parsed.email, name: parsed.name, picture: parsed.picture };
  } catch {
    return null;
  }
}

export const APPLICANT_MAX_AGE = APPLICANT_MAX_AGE_SEC;
export const ALLOWED_APPLICANT_DOMAIN = "gsm.hs.kr";

/**
 * Seeds the admin-accounts store with the env admin on first run. Idempotent
 * — if any account already exists, does nothing. If the env admin already
 * has an account row, also does nothing.
 *
 * Should be called before any credential check or account registration so
 * the very first deployment is never left with zero admins.
 */
async function ensureEnvAdminSeeded(): Promise<void> {
  const envId = process.env.ADMIN_ID;
  const envPassword = process.env.ADMIN_PASSWORD;
  const envName = process.env.ADMIN_NAME;
  if (!envId || !envPassword) return;
  const existing = await findAdminAccount(envId);
  if (existing) return;
  const { hash, salt } = await hashPassword(envPassword);
  const account: AdminAccount = {
    id: envId,
    name: envName || undefined,
    passwordHash: hash,
    passwordSalt: salt,
    status: "approved",
    role: "super",
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: "system",
  };
  try {
    await createAdminAccount(account);
  } catch {
    // Race-safe: if another request seeded it at the same time, ignore
  }
}

export type CredentialResult =
  | { ok: true; account: AdminAccount }
  | { ok: false; reason: "invalid" | "pending" | "rejected" };

/**
 * Verifies credentials against the admin accounts store. The env admin is
 * lazily seeded on first call so existing single-admin deployments keep
 * working without a manual migration step.
 */
export async function checkCredentials(
  id: string,
  password: string,
): Promise<CredentialResult> {
  await ensureEnvAdminSeeded();
  const account = await findAdminAccount(id);
  if (!account) return { ok: false, reason: "invalid" };
  const valid = await verifyPassword(
    password,
    account.passwordHash,
    account.passwordSalt,
  );
  if (!valid) return { ok: false, reason: "invalid" };
  if (account.status === "pending") return { ok: false, reason: "pending" };
  if (account.status === "rejected") return { ok: false, reason: "rejected" };
  return { ok: true, account };
}

/**
 * Helper for new-account registration. Wraps ensureEnvAdminSeeded + returns
 * the seeded total count so callers can know if this is the very first
 * registration on a fresh deploy.
 */
export async function ensureSeededAndCount(): Promise<number> {
  await ensureEnvAdminSeeded();
  const list = await getAdminAccounts();
  return list.length;
}
