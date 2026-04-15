/**
 * One-off script: replace the currently seeded super admin with a new
 * account (different id / name / password). Run after updating
 * ADMIN_ID / ADMIN_NAME / ADMIN_PASSWORD in .env.local so the next
 * `ensureEnvAdminSeeded` call doesn't re-create the old record.
 *
 * Usage:
 *   OLD_ADMIN_ID=test1234 \
 *   NEW_ADMIN_ID=superadmin \
 *   NEW_ADMIN_NAME=Super_Admin \
 *   NEW_ADMIN_PASSWORD=2846070802 \
 *   npx tsx scripts/replace-super-admin.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

async function loadEnv() {
  try {
    const raw = await readFile(
      path.join(process.cwd(), ".env.local"),
      "utf-8",
    );
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // no .env.local — rely on real env vars
  }
}

// ----- Inline PBKDF2 (mirrors src/lib/password.ts) -----
const ITERATIONS = 100_000;
const KEY_LEN_BYTES = 32;
const SALT_LEN_BYTES = 16;

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function derive(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LEN_BYTES * 8,
  );
  return new Uint8Array(bits);
}

async function hashPassword(
  password: string,
): Promise<{ hash: string; salt: string }> {
  const salt = globalThis.crypto.getRandomValues(
    new Uint8Array(SALT_LEN_BYTES),
  );
  const hash = await derive(password, salt);
  return { hash: toBase64Url(hash), salt: toBase64Url(salt) };
}

// ----- Main -----
async function main() {
  await loadEnv();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았어요.",
    );
    process.exit(1);
  }

  const oldId = process.env.OLD_ADMIN_ID;
  const newId = process.env.NEW_ADMIN_ID;
  const newName = process.env.NEW_ADMIN_NAME;
  const newPassword = process.env.NEW_ADMIN_PASSWORD;

  if (!newId || !newName || !newPassword) {
    console.error(
      "✗ NEW_ADMIN_ID / NEW_ADMIN_NAME / NEW_ADMIN_PASSWORD가 모두 필요해요.",
    );
    process.exit(1);
  }

  const sb = createClient(url, key);

  // Read current admin-accounts row
  const { data, error } = await sb
    .from("kv")
    .select("value")
    .eq("key", "admin-accounts")
    .maybeSingle();
  if (error) {
    console.error("✗ admin-accounts 읽기 실패:", error.message);
    process.exit(1);
  }

  type Account = {
    id: string;
    name?: string;
    passwordHash: string;
    passwordSalt: string;
    status: "pending" | "approved" | "rejected";
    role: "super" | "admin";
    createdAt: string;
    approvedAt?: string;
    approvedBy?: string;
  };

  const list: Account[] = ((data?.value as Account[]) ?? []).filter(
    (a) => a.id.toLowerCase() !== (oldId ?? "").toLowerCase(),
  );

  // Reject if the new id collides with an existing account
  if (
    list.some((a) => a.id.toLowerCase() === newId.toLowerCase())
  ) {
    console.error(
      `✗ "${newId}" 아이디가 이미 존재해요. 먼저 삭제하거나 다른 id를 쓰세요.`,
    );
    process.exit(1);
  }

  const { hash, salt } = await hashPassword(newPassword);
  const now = new Date().toISOString();
  const newAccount: Account = {
    id: newId,
    name: newName,
    passwordHash: hash,
    passwordSalt: salt,
    status: "approved",
    role: "super",
    createdAt: now,
    approvedAt: now,
    approvedBy: "system",
  };
  list.push(newAccount);

  const { error: writeErr } = await sb
    .from("kv")
    .upsert(
      { key: "admin-accounts", value: list, updated_at: now },
      { onConflict: "key" },
    );
  if (writeErr) {
    console.error("✗ admin-accounts 쓰기 실패:", writeErr.message);
    process.exit(1);
  }

  console.log("✓ 완료");
  console.log(`  · 삭제: ${oldId ?? "(없음)"}`);
  console.log(
    `  · 생성: ${newName} @${newId} (role=super, status=approved)`,
  );
  console.log(`  · 총 ${list.length}개 계정`);
}

main().catch((err) => {
  console.error("✗ 스크립트 실행 실패:", err);
  process.exit(1);
});
