/**
 * One-time seed script: reads local data/*.json files and pushes them into
 * the Supabase `kv` table. Run this AFTER you've created your Supabase
 * project and pasted the URL/service key into .env.local.
 *
 * Usage:
 *   npx tsx scripts/seed-supabase.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually (no dotenv dependency needed)
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

const FILES: { file: string; key: string }[] = [
  { file: "applications.json", key: "applications" },
  { file: "role-status.json", key: "role-status" },
  { file: "members-meta.json", key: "members-meta" },
  { file: "form-config.json", key: "form-config" },
];

async function main() {
  await loadEnv();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "✗ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const { file, key: kvKey } of FILES) {
    const fullPath = path.join(process.cwd(), "data", file);
    let value: unknown;
    try {
      const raw = await readFile(fullPath, "utf-8");
      value = JSON.parse(raw);
    } catch (err) {
      console.log(`⚠ skipping ${file} (not found)`);
      continue;
    }
    const { error } = await sb.from("kv").upsert(
      { key: kvKey, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    if (error) {
      console.error(`✗ failed to seed ${kvKey}:`, error.message);
      process.exit(1);
    }
    console.log(`✓ seeded ${kvKey}`);
  }

  console.log("\nAll done. Your Supabase kv table now contains the local data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
