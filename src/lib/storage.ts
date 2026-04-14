import { getSupabase } from "./supabase";

/**
 * KV-style storage backed by Supabase.
 *
 * All "files" (applications, form-config, role-status, members-meta) are
 * stored as rows in a single `kv` table with shape:
 *   key text primary key
 *   value jsonb
 *   updated_at timestamptz default now()
 *
 * Each helper function's signature is preserved from the original file-based
 * implementation so that API routes and server components don't need to
 * change.
 */

const KV_TABLE = "kv";

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(KV_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error(`[storage] readJson(${key}) failed:`, error);
    return fallback;
  }
  if (!data) return fallback;
  return (data.value as T) ?? fallback;
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from(KV_TABLE)
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) {
    console.error(`[storage] writeJson(${key}) failed:`, error);
    throw new Error(`Failed to write ${key}: ${error.message}`);
  }
}

// ================= Applications =================

export interface Application {
  id: string;
  // Core built-in fields (always present if configured)
  name?: string;
  studentId?: string;
  generation?: string;
  role?: string;
  github?: string;
  introduction?: string;
  motivation?: string;
  wantedFeatures?: string;
  portfolio?: string;
  email?: string; // verified via Google (@gsm.hs.kr), optional if email auth disabled
  // Custom fields (admin-added)
  custom?: Record<string, string>;
  privacyAgreed?: boolean;
  createdAt: string;
}

export async function getApplications(): Promise<Application[]> {
  return readJson<Application[]>("applications", []);
}

export async function addApplication(
  data: Omit<Application, "id" | "createdAt">,
): Promise<Application> {
  const list = await getApplications();
  const app: Application = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  list.unshift(app);
  await writeJson("applications", list);
  return app;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const list = await getApplications();
  const next = list.filter((a) => a.id !== id);
  if (next.length === list.length) return false;
  await writeJson("applications", next);
  return true;
}

// ================= Role status =================

export type RoleKey =
  | "iOS"
  | "Android"
  | "Backend"
  | "Flutter"
  | "DevOps"
  | "Design";

export const ROLE_KEYS: RoleKey[] = [
  "iOS",
  "Android",
  "Backend",
  "Flutter",
  "DevOps",
  "Design",
];

export type RoleStatus = Record<RoleKey, boolean>;

const DEFAULT_ROLE_STATUS: RoleStatus = {
  iOS: true,
  Android: true,
  Backend: true,
  Flutter: true,
  DevOps: true,
  Design: true,
};

export async function getRoleStatus(): Promise<RoleStatus> {
  return readJson<RoleStatus>("role-status", DEFAULT_ROLE_STATUS);
}

export async function setRoleStatus(
  key: RoleKey,
  value: boolean,
): Promise<RoleStatus> {
  const current = await getRoleStatus();
  const next = { ...current, [key]: value };
  await writeJson("role-status", next);
  return next;
}

// ================= Members meta =================

export interface MemberMeta {
  name: string;
  role: string;
  leader?: number;
}

export interface ExtraMember {
  login: string;
  name: string;
  role: string;
  avatar: string;
  leader?: number;
}

export interface MembersMetaFile {
  byLogin: Record<string, MemberMeta>;
  extra: ExtraMember[];
  hidden: string[];
}

const DEFAULT_MEMBERS_META: MembersMetaFile = {
  byLogin: {},
  extra: [],
  hidden: [],
};

export async function getMembersMeta(): Promise<MembersMetaFile> {
  return readJson<MembersMetaFile>("members-meta", DEFAULT_MEMBERS_META);
}

export async function updateMemberMeta(
  login: string,
  meta: Partial<MemberMeta>,
): Promise<MembersMetaFile> {
  const data = await getMembersMeta();
  const key = login.toLowerCase();
  const existing = data.byLogin[key] ?? { name: login, role: "Member" };
  data.byLogin[key] = { ...existing, ...meta };
  await writeJson("members-meta", data);
  return data;
}

export async function deleteMemberMeta(
  login: string,
): Promise<MembersMetaFile> {
  const data = await getMembersMeta();
  const key = login.toLowerCase();
  delete data.byLogin[key];
  // Also hide from org fetch
  if (!data.hidden.includes(key)) data.hidden.push(key);
  await writeJson("members-meta", data);
  return data;
}

export async function toggleMemberHidden(
  login: string,
): Promise<MembersMetaFile> {
  const data = await getMembersMeta();
  const key = login.toLowerCase();
  const idx = data.hidden.indexOf(key);
  if (idx === -1) data.hidden.push(key);
  else data.hidden.splice(idx, 1);
  await writeJson("members-meta", data);
  return data;
}

export async function addExtraMember(
  member: ExtraMember,
): Promise<MembersMetaFile> {
  const data = await getMembersMeta();
  // Replace if exists
  data.extra = data.extra.filter(
    (m) => m.login.toLowerCase() !== member.login.toLowerCase(),
  );
  data.extra.push(member);
  await writeJson("members-meta", data);
  return data;
}

export async function deleteExtraMember(
  login: string,
): Promise<MembersMetaFile> {
  const data = await getMembersMeta();
  data.extra = data.extra.filter(
    (m) => m.login.toLowerCase() !== login.toLowerCase(),
  );
  await writeJson("members-meta", data);
  return data;
}

// ================= Form config =================

export type FormFieldType =
  | "text" // 일반 텍스트
  | "textarea" // 멀티라인
  | "url" // URL 검증
  | "role" // 직군 선택
  | "username"; // 텍스트인데 URL 불가 (GitHub ID 등)

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  pattern?: string; // 정규식 (string)
  patternError?: string;
  minLength?: number;
  maxLength?: number;
  builtin?: boolean; // true면 삭제 불가
}

export interface PrivacyPolicy {
  enabled: boolean;
  summary: string;
  details: string;
}

export interface FormConfig {
  requireEmailAuth: boolean;
  privacyPolicy: PrivacyPolicy;
  fields: FormField[];
}

const DEFAULT_FORM_CONFIG: FormConfig = {
  requireEmailAuth: true,
  privacyPolicy: {
    enabled: true,
    summary: "지원서에 입력한 개인정보는 채용 목적으로만 사용됩니다.",
    details: "",
  },
  fields: [],
};

export async function getFormConfig(): Promise<FormConfig> {
  return readJson<FormConfig>("form-config", DEFAULT_FORM_CONFIG);
}

export async function updateFormSettings(
  patch: Partial<Pick<FormConfig, "requireEmailAuth" | "privacyPolicy">>,
): Promise<FormConfig> {
  const cfg = await getFormConfig();
  if (patch.requireEmailAuth !== undefined)
    cfg.requireEmailAuth = patch.requireEmailAuth;
  if (patch.privacyPolicy) {
    cfg.privacyPolicy = { ...cfg.privacyPolicy, ...patch.privacyPolicy };
  }
  await writeJson("form-config", cfg);
  return cfg;
}

export async function updateFormField(
  id: string,
  patch: Partial<FormField>,
): Promise<FormConfig> {
  const cfg = await getFormConfig();
  const idx = cfg.fields.findIndex((f) => f.id === id);
  if (idx === -1) throw new Error("Field not found");
  cfg.fields[idx] = { ...cfg.fields[idx], ...patch, id: cfg.fields[idx].id };
  await writeJson("form-config", cfg);
  return cfg;
}

export async function addFormField(field: FormField): Promise<FormConfig> {
  const cfg = await getFormConfig();
  if (cfg.fields.some((f) => f.id === field.id)) {
    throw new Error("Duplicate field id");
  }
  cfg.fields.push({ ...field, builtin: false });
  await writeJson("form-config", cfg);
  return cfg;
}

export async function deleteFormField(id: string): Promise<FormConfig> {
  const cfg = await getFormConfig();
  const field = cfg.fields.find((f) => f.id === id);
  if (!field) throw new Error("Field not found");
  if (field.builtin) throw new Error("Cannot delete builtin field");
  cfg.fields = cfg.fields.filter((f) => f.id !== id);
  await writeJson("form-config", cfg);
  return cfg;
}

export async function reorderFormFields(
  orderedIds: string[],
): Promise<FormConfig> {
  const cfg = await getFormConfig();
  const map = new Map(cfg.fields.map((f) => [f.id, f]));
  const next: FormField[] = [];
  for (const id of orderedIds) {
    const f = map.get(id);
    if (f) next.push(f);
  }
  // Append any that weren't mentioned at the end
  for (const f of cfg.fields) {
    if (!orderedIds.includes(f.id)) next.push(f);
  }
  cfg.fields = next;
  await writeJson("form-config", cfg);
  return cfg;
}
