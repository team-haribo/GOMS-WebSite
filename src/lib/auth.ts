// Minimal HMAC-signed session cookie for single-admin auth.
// Uses Web Crypto (available in both Node and Edge runtimes).

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

export function checkCredentials(id: string, password: string): boolean {
  const adminId = process.env.ADMIN_ID;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminId || !adminPassword) return false;
  // Timing-safe compare via length check + constant-time loop
  if (id.length !== adminId.length || password.length !== adminPassword.length)
    return false;
  let diff = 0;
  for (let i = 0; i < id.length; i++) diff |= id.charCodeAt(i) ^ adminId.charCodeAt(i);
  for (let i = 0; i < password.length; i++)
    diff |= password.charCodeAt(i) ^ adminPassword.charCodeAt(i);
  return diff === 0;
}
