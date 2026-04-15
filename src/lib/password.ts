/**
 * Password hashing via PBKDF2 (Web Crypto). Works in both Node and Edge
 * runtimes without pulling in bcrypt or scrypt native bindings.
 *
 * Parameters:
 *   iterations = 100_000 (OWASP 2023 minimum for SHA-256)
 *   salt       = 16 random bytes
 *   key length = 256 bits
 *
 * Serialized format is base64url for both hash and salt so they fit in
 * plain JSON without any special encoding handling.
 */

const ITERATIONS = 100_000;
const KEY_LEN_BYTES = 32;
const SALT_LEN_BYTES = 16;

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded + "===".slice((padded.length + 3) % 4);
  const bin = atob(pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function derive(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password) as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LEN_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(
  password: string,
): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN_BYTES));
  const hash = await derive(password, salt);
  return { hash: toBase64Url(hash), salt: toBase64Url(salt) };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  try {
    const expected = fromBase64Url(hash);
    const saltBytes = fromBase64Url(salt);
    const actual = await derive(password, saltBytes);
    if (expected.length !== actual.length) return false;
    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
    return diff === 0;
  } catch {
    return false;
  }
}
