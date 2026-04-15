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
  // Admin-only — private notes taken during review/interview
  adminNote?: string;
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

/**
 * Updates the admin-only note on a single application. Trims whitespace
 * and stores `undefined` when the note is empty so the field doesn't
 * linger as an empty string.
 */
export async function updateApplicationNote(
  id: string,
  note: string,
): Promise<Application | null> {
  const list = await getApplications();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const trimmed = note.trim();
  const next: Application = {
    ...list[idx],
    adminNote: trimmed.length > 0 ? trimmed : undefined,
  };
  const nextList = [...list];
  nextList[idx] = next;
  await writeJson("applications", nextList);
  return next;
}

// ================= Application Batches (archives) =================

/**
 * A snapshot of applications taken at a point in time when a recruitment
 * round is closed. Once archived, the batch is immutable (aside from
 * deleting the whole thing).
 */
export interface ApplicationBatch {
  id: string;
  title: string; // e.g., "GOMS 1차 모집"
  closedAt: string; // ISO timestamp
  applications: Application[]; // snapshot at close time
}

export async function getApplicationBatches(): Promise<ApplicationBatch[]> {
  return readJson<ApplicationBatch[]>("application-batches", []);
}

/**
 * Snapshots the current applications list into a new batch with the given
 * title. If `clearCurrent` is true, also empties the live applications
 * list so the next round starts fresh.
 */
export async function createApplicationBatch(
  title: string,
  clearCurrent: boolean,
): Promise<ApplicationBatch> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new Error("제목이 필요해요.");
  const current = await getApplications();
  const batch: ApplicationBatch = {
    id: crypto.randomUUID(),
    title: trimmedTitle,
    closedAt: new Date().toISOString(),
    applications: current,
  };
  const list = await getApplicationBatches();
  list.unshift(batch);
  await writeJson("application-batches", list);
  if (clearCurrent) {
    await writeJson("applications", []);
  }
  return batch;
}

export async function deleteApplicationBatch(id: string): Promise<boolean> {
  const list = await getApplicationBatches();
  const next = list.filter((b) => b.id !== id);
  if (next.length === list.length) return false;
  await writeJson("application-batches", next);
  return true;
}

// ================= Admin accounts =================

/**
 * Multi-admin account storage. Accounts go through a pending → approved
 * (or rejected) flow so self-registration can't grant immediate access.
 *
 * The first account is seeded automatically from the ADMIN_ID environment
 * variable with super status and a hash of ADMIN_PASSWORD, so existing
 * deployments continue working without a manual migration step.
 */
export type AdminAccountStatus = "pending" | "approved" | "rejected";

export interface AdminAccount {
  id: string; // login id (unique)
  name?: string; // display name (e.g. "서지완") — optional for env-seeded legacy
  passwordHash: string; // base64url
  passwordSalt: string; // base64url
  status: AdminAccountStatus;
  role: "super" | "admin";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
}

export async function getAdminAccounts(): Promise<AdminAccount[]> {
  return readJson<AdminAccount[]>("admin-accounts", []);
}

export async function saveAdminAccounts(list: AdminAccount[]): Promise<void> {
  await writeJson("admin-accounts", list);
}

export async function findAdminAccount(
  id: string,
): Promise<AdminAccount | null> {
  const list = await getAdminAccounts();
  return list.find((a) => a.id.toLowerCase() === id.toLowerCase()) ?? null;
}

export async function createAdminAccount(account: AdminAccount): Promise<void> {
  const list = await getAdminAccounts();
  if (list.some((a) => a.id.toLowerCase() === account.id.toLowerCase())) {
    throw new Error("이미 같은 아이디가 있어요.");
  }
  list.push(account);
  await saveAdminAccounts(list);
}

export async function updateAdminAccount(
  id: string,
  patch: Partial<AdminAccount>,
): Promise<AdminAccount | null> {
  const list = await getAdminAccounts();
  const idx = list.findIndex(
    (a) => a.id.toLowerCase() === id.toLowerCase(),
  );
  if (idx === -1) return null;
  const next = { ...list[idx], ...patch, id: list[idx].id };
  list[idx] = next;
  await saveAdminAccounts(list);
  return next;
}

export async function deleteAdminAccount(id: string): Promise<boolean> {
  const list = await getAdminAccounts();
  const next = list.filter(
    (a) => a.id.toLowerCase() !== id.toLowerCase(),
  );
  if (next.length === list.length) return false;
  await saveAdminAccounts(next);
  return true;
}

// ================= Admin activity log =================

/**
 * A single entry in the admin audit log. One row per mutation an admin
 * performs through the admin panel (delete applicant, update role, etc.).
 *
 * The log is append-only from the caller's perspective but is trimmed to
 * the most recent MAX_ACTIVITY_ENTRIES rows to keep the KV row small.
 */
export interface AdminActivity {
  id: string;
  adminId: string;
  action: string; // machine key, e.g. "application.delete"
  description: string; // human-readable Korean summary
  createdAt: string; // ISO timestamp
  meta?: Record<string, unknown>;
}

// Cap the activity log so the jsonb row stays under a few MB. Each entry
// is roughly 300-500 bytes (id, adminId, action, description, timestamp,
// optional IP/UA/device meta), so 2000 entries ≈ 0.6-1 MB — still well
// within Supabase's jsonb limits and keeps read/write latency minimal.
const MAX_ACTIVITY_ENTRIES = 2000;

export async function getAdminActivity(): Promise<AdminActivity[]> {
  return readJson<AdminActivity[]>("admin-activity", []);
}

export async function logAdminActivity(entry: {
  adminId: string;
  action: string;
  description: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const list = await getAdminActivity();
    const row: AdminActivity = {
      id: crypto.randomUUID(),
      adminId: entry.adminId,
      action: entry.action,
      description: entry.description,
      createdAt: new Date().toISOString(),
      meta: entry.meta,
    };
    list.unshift(row);
    if (list.length > MAX_ACTIVITY_ENTRIES) {
      list.length = MAX_ACTIVITY_ENTRIES;
    }
    await writeJson("admin-activity", list);
  } catch (err) {
    // Logging should never break the underlying mutation
    console.error("[storage] logAdminActivity failed:", err);
  }
}

/**
 * Permanently removes a single log entry by id. Returns the deleted row
 * for audit purposes, or null when no match is found. Intended only for
 * super admins — the API layer should gate this behind a role check and
 * a dedicated approval password.
 */
export async function deleteAdminActivity(
  id: string,
): Promise<AdminActivity | null> {
  const list = await getAdminActivity();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const [removed] = list.splice(idx, 1);
  await writeJson("admin-activity", list);
  return removed ?? null;
}

/**
 * Restores applications from a batch back into the live applications list.
 *
 * - If `applicationIds` is omitted, restores every application in the batch.
 * - If provided, restores only the listed applications.
 *
 * Semantics: "move" — restored applications are appended to the current list
 * (deduped by id) and removed from the batch. If the batch becomes empty
 * after the move, it is deleted.
 *
 * Returns the list of applications that were actually restored, or null if
 * the batch doesn't exist.
 */
export async function restoreApplicationBatch(
  id: string,
  applicationIds?: string[],
): Promise<Application[] | null> {
  const list = await getApplicationBatches();
  const batchIdx = list.findIndex((b) => b.id === id);
  if (batchIdx === -1) return null;
  const batch = list[batchIdx];

  // Partition: apps to restore vs apps that stay in the batch
  const toRestore: Application[] = [];
  const remaining: Application[] = [];
  const idSet = applicationIds ? new Set(applicationIds) : null;
  for (const app of batch.applications) {
    if (!idSet || idSet.has(app.id)) {
      toRestore.push(app);
    } else {
      remaining.push(app);
    }
  }

  // Nothing matched — short-circuit
  if (toRestore.length === 0) return [];

  // Merge into live applications, deduped by id (existing wins)
  const current = await getApplications();
  const seen = new Set(current.map((a) => a.id));
  const nextCurrent = [...current];
  for (const app of toRestore) {
    if (!seen.has(app.id)) {
      nextCurrent.unshift(app);
      seen.add(app.id);
    }
  }
  await writeJson("applications", nextCurrent);

  // Update the batch — either shrink it or drop it
  const nextBatches = [...list];
  if (remaining.length === 0) {
    nextBatches.splice(batchIdx, 1);
  } else {
    nextBatches[batchIdx] = { ...batch, applications: remaining };
  }
  await writeJson("application-batches", nextBatches);

  return toRestore;
}

// ================= Roles =================

export type RoleKey = string; // now dynamic — any admin-defined role

export interface RoleTalent {
  title: string;
  desc: string;
}

export interface Role {
  slug: string; // URL slug, e.g. "ios", "backend"
  label: string; // display label, e.g. "iOS", "Backend"
  color: string; // hex
  bg: string; // tailwind gradient classes, e.g. "from-orange-50 to-amber-50"
  title: string; // big title on detail page
  subtitle: string; // one-liner
  intro: string; // paragraph
  stack: string[]; // tech tags
  talents: RoleTalent[]; // 인재상
  open: boolean; // manual open/close switch
  openAt?: string | null; // ISO datetime — applications automatically open at this time
  closeAt?: string | null; // ISO datetime — applications automatically close at this time
}

export type RoleStatus = Record<string, boolean>;

// Default role seed (used if no roles stored yet)
const DEFAULT_ROLES: Role[] = [
  {
    slug: "ios",
    label: "iOS",
    color: "#F5A623",
    bg: "from-orange-50 to-amber-50",
    title: "iOS Developer",
    subtitle: "Swift로 Apple 생태계의 앱을 만들어요.",
    intro:
      "UIKit·SwiftUI·Combine으로 사용자가 오래 쓰고 싶어지는 앱을 만들어요. 디테일과 애니메이션, 그리고 새로운 기술 도입에 열려 있는 사람을 찾고 있어요.",
    stack: ["Swift", "UIKit", "SwiftUI", "Combine"],
    talents: [
      {
        title: "Swift에 대한 호기심",
        desc: "Swift 문법과 Apple의 API에 흥미가 있고, 공식 문서를 읽는 걸 두려워하지 않아요.",
      },
      {
        title: "사용자 경험에 대한 집착",
        desc: "버튼 하나, 애니메이션 하나, 트랜지션 하나에 '왜 이렇게 동작해야 하는지' 고민하는 사람.",
      },
      {
        title: "새로운 기술에 대한 열린 마음",
        desc: "UIKit에서 SwiftUI로, Combine에서 async/await로, 변화를 기회로 보는 사람.",
      },
    ],
    open: true,
  },
  {
    slug: "android",
    label: "Android",
    color: "#3B82F6",
    bg: "from-blue-50 to-indigo-50",
    title: "Android Developer",
    subtitle: "Kotlin과 Compose로 안드로이드 앱을 만들어요.",
    intro:
      "Jetpack Compose·Coroutines·Flow로 모던한 안드로이드 앱을 만들어요. Material Design을 존중하면서도 GOMS만의 개성을 녹여낼 줄 아는 사람을 찾아요.",
    stack: ["Kotlin", "Jetpack Compose", "Coroutines", "Flow"],
    talents: [
      {
        title: "Kotlin에 대한 애정",
        desc: "Java에서 Kotlin으로 넘어오는 과정 자체가 재미있는 사람. 확장 함수나 코루틴이 예뻐 보이는 사람.",
      },
      {
        title: "Compose·Material Design 이해",
        desc: "선언형 UI의 장점을 이해하고, Material Design 가이드와 디자인 시스템을 존중하는 사람.",
      },
      {
        title: "새로운 기술 도입에 적극적",
        desc: "매년 쏟아지는 Jetpack 라이브러리를 따라가고, 팀에 공유하는 걸 즐기는 사람.",
      },
    ],
    open: true,
  },
  {
    slug: "backend",
    label: "Backend",
    color: "#10B981",
    bg: "from-emerald-50 to-teal-50",
    title: "Backend Developer",
    subtitle: "Spring Boot로 서버와 API를 설계해요.",
    intro:
      "Kotlin·Spring Boot·JPA로 안정적인 REST API와 데이터베이스, 푸시 알림 시스템을 만들어요. 데이터의 흐름과 구조를 깊이 고민하는 사람을 찾아요.",
    stack: ["Kotlin", "Spring Boot", "JPA", "MySQL"],
    talents: [
      {
        title: "데이터 흐름에 대한 감각",
        desc: "요청이 들어와서 응답이 나가기까지, 각 계층에서 무슨 일이 일어나는지 머릿속에 그릴 수 있는 사람.",
      },
      {
        title: "견고한 설계에 대한 욕심",
        desc: "당장 돌아가는 코드보다, 6개월 뒤에도 유지보수하기 쉬운 구조를 고민하는 사람.",
      },
      {
        title: "문제 해결 능력",
        desc: "버그가 발생했을 때 당황하지 않고, 로그와 스택 트레이스에서 단서를 찾는 사람.",
      },
    ],
    open: true,
  },
  {
    slug: "flutter",
    label: "Flutter",
    color: "#06B6D4",
    bg: "from-cyan-50 to-sky-50",
    title: "Flutter Developer",
    subtitle: "Dart로 iOS와 Android를 한 번에 만들어요.",
    intro:
      "Flutter·Riverpod·Dio로 크로스 플랫폼 앱을 빠르게 만들어요. 하나의 코드베이스로 여러 플랫폼을 다루는 재미를 아는 사람을 찾아요.",
    stack: ["Dart", "Flutter", "Riverpod", "Dio"],
    talents: [
      {
        title: "크로스 플랫폼에 대한 관심",
        desc: "iOS와 Android를 따로 만드는 것보다 하나로 만들고 싶은 이유가 명확한 사람.",
      },
      {
        title: "위젯 트리 이해",
        desc: "Flutter의 위젯 철학과 상태 관리 흐름을 이해하고, 직접 구조를 설계해보고 싶은 사람.",
      },
      {
        title: "빠른 프로토타이핑 마인드",
        desc: "'일단 만들어 보자'와 '설계를 먼저 하자' 사이의 균형을 잡을 줄 아는 사람.",
      },
    ],
    open: true,
  },
  {
    slug: "devops",
    label: "DevOps",
    color: "#8B5CF6",
    bg: "from-violet-50 to-purple-50",
    title: "DevOps Engineer",
    subtitle: "배포와 인프라를 자동화해요.",
    intro:
      "Docker·GitHub Actions·AWS로 CI/CD 파이프라인과 서버 인프라를 관리해요. 서비스가 새벽에도 안정적으로 돌아가도록 책임지는 사람을 찾아요.",
    stack: ["Docker", "GitHub Actions", "AWS", "Linux"],
    talents: [
      {
        title: "자동화에 대한 집착",
        desc: "같은 작업을 두 번 하느니 자동화 스크립트를 짜는 게 재밌는 사람.",
      },
      {
        title: "안정성에 대한 책임감",
        desc: "'서비스가 멈추면 안 된다'는 마음가짐으로, 장애 대응과 모니터링을 중요하게 생각하는 사람.",
      },
      {
        title: "네트워크·리눅스 기초",
        desc: "SSH, Docker, nginx, 기본적인 리눅스 명령어와 친한 사람. 아니면 친해지고 싶은 사람.",
      },
    ],
    open: true,
  },
  {
    slug: "design",
    label: "Design",
    color: "#EC4899",
    bg: "from-pink-50 to-rose-50",
    title: "UI/UX Designer",
    subtitle: "Figma로 서비스의 얼굴을 만들어요.",
    intro:
      "Figma로 와이어프레임, 프로토타입, 디자인 시스템을 만들어요. 사용자의 관점에서 생각하고, 개발자와 함께 디테일을 맞춰가는 사람을 찾아요.",
    stack: ["Figma", "Design System", "Prototype"],
    talents: [
      {
        title: "사용자 관점에서 생각하는 힘",
        desc: "'이 버튼을 처음 보는 사람은 어떻게 느낄까?'를 먼저 떠올리는 사람.",
      },
      {
        title: "디자인 시스템에 대한 이해",
        desc: "반복되는 요소에서 규칙을 찾고, 일관된 시스템을 만드는 걸 즐기는 사람.",
      },
      {
        title: "개발자와의 협업",
        desc: "개발이 가능한 디자인과 불가능한 디자인의 차이를 이해하고, 함께 절충점을 찾는 사람.",
      },
    ],
    open: true,
  },
];

function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Compute effective open state considering manual flag + scheduled windows */
export function isRoleEffectivelyOpen(role: Role, now: Date = new Date()): boolean {
  if (!role.open) return false;
  if (role.openAt && now < new Date(role.openAt)) return false;
  if (role.closeAt && now >= new Date(role.closeAt)) return false;
  return true;
}

export async function getRoles(): Promise<Role[]> {
  const stored = await readJson<Role[] | null>("roles", null);
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  // Seed on first read
  await writeJson("roles", DEFAULT_ROLES);
  return DEFAULT_ROLES;
}

export async function getRoleBySlug(slug: string): Promise<Role | null> {
  const list = await getRoles();
  const normalized = normalizeSlug(slug);
  return list.find((r) => r.slug === normalized) ?? null;
}

export async function addRole(role: Omit<Role, "slug"> & { slug: string }): Promise<Role[]> {
  const list = await getRoles();
  const slug = normalizeSlug(role.slug);
  if (!slug) throw new Error("slug가 필요해요.");
  if (list.some((r) => r.slug === slug)) {
    throw new Error("이미 같은 slug의 직군이 있어요.");
  }
  const next: Role[] = [
    ...list,
    {
      ...role,
      slug,
      stack: role.stack ?? [],
      talents: role.talents ?? [],
      open: role.open ?? true,
    },
  ];
  await writeJson("roles", next);
  return next;
}

export async function updateRole(
  slug: string,
  patch: Partial<Omit<Role, "slug">>,
): Promise<Role[]> {
  const list = await getRoles();
  const normalized = normalizeSlug(slug);
  const idx = list.findIndex((r) => r.slug === normalized);
  if (idx === -1) throw new Error("해당 직군을 찾을 수 없어요.");
  const next = [...list];
  next[idx] = { ...next[idx], ...patch, slug: next[idx].slug };
  await writeJson("roles", next);
  return next;
}

export async function deleteRole(slug: string): Promise<Role[]> {
  const list = await getRoles();
  const normalized = normalizeSlug(slug);
  const next = list.filter((r) => r.slug !== normalized);
  if (next.length === list.length) throw new Error("해당 직군을 찾을 수 없어요.");
  await writeJson("roles", next);
  return next;
}

/**
 * Legacy adapter: returns a map of `{ [label]: effectiveOpen }` for back-compat
 * with existing code paths that still expect the old shape.
 */
export async function getRoleStatus(): Promise<RoleStatus> {
  const roles = await getRoles();
  const status: RoleStatus = {};
  for (const r of roles) {
    status[r.label] = isRoleEffectivelyOpen(r);
  }
  return status;
}

/** Legacy adapter: flip a role's manual open flag by label */
export async function setRoleStatus(
  labelOrSlug: string,
  value: boolean,
): Promise<RoleStatus> {
  const list = await getRoles();
  const target = list.find(
    (r) => r.label === labelOrSlug || r.slug === normalizeSlug(labelOrSlug),
  );
  if (target) {
    await updateRole(target.slug, { open: value });
  }
  return getRoleStatus();
}

// ================= Members meta =================

export interface MemberMeta {
  name: string;
  role: string;
  /** 기수 (예: 7) — 사용자가 입력 */
  generation?: number;
  /** 리더 여부 */
  leader?: boolean;
}

export interface ExtraMember {
  login: string;
  name: string;
  role: string;
  avatar: string;
  generation?: number;
  leader?: boolean;
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
  const raw = await readJson<MembersMetaFile>(
    "members-meta",
    DEFAULT_MEMBERS_META,
  );
  // Migrate legacy `leader: number` → `{ generation: N, leader: true }`
  type Legacy = MemberMeta & { leader?: number | boolean };
  const byLogin: Record<string, MemberMeta> = {};
  for (const [k, v] of Object.entries(raw.byLogin ?? {})) {
    const legacy = v as Legacy;
    if (typeof legacy.leader === "number") {
      byLogin[k] = {
        name: legacy.name,
        role: legacy.role,
        generation: legacy.generation ?? legacy.leader,
        leader: true,
      };
    } else {
      byLogin[k] = legacy as MemberMeta;
    }
  }
  type LegacyExtra = ExtraMember & { leader?: number | boolean };
  const extra: ExtraMember[] = (raw.extra ?? []).map((e) => {
    const le = e as LegacyExtra;
    if (typeof le.leader === "number") {
      return {
        login: le.login,
        name: le.name,
        role: le.role,
        avatar: le.avatar,
        generation: le.generation ?? le.leader,
        leader: true,
      };
    }
    return le as ExtraMember;
  });
  return { byLogin, extra, hidden: raw.hidden ?? [] };
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

// ================= Member snapshot (persistent) =================

/**
 * Once a GitHub org member is seen, we keep their login + avatar here
 * so that even if they later leave the org, they still show up in the
 * members list. Admins can still hide them manually if needed.
 */
export interface MemberSnapshotEntry {
  login: string;
  avatar: string;
  lastSeenAt: string;
}

export async function getMemberSnapshot(): Promise<MemberSnapshotEntry[]> {
  return readJson<MemberSnapshotEntry[]>("member-snapshot", []);
}

export async function upsertMemberSnapshot(
  seen: { login: string; avatar: string }[],
): Promise<void> {
  if (seen.length === 0) return;
  const list = await getMemberSnapshot();
  const byLogin = new Map<string, MemberSnapshotEntry>();
  for (const e of list) byLogin.set(e.login.toLowerCase(), e);
  const now = new Date().toISOString();
  for (const s of seen) {
    byLogin.set(s.login.toLowerCase(), {
      login: s.login,
      avatar: s.avatar,
      lastSeenAt: now,
    });
  }
  await writeJson("member-snapshot", Array.from(byLogin.values()));
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
  hidden?: boolean; // true면 지원폼에 표시되지 않음
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
  const existing = cfg.fields[idx];
  // Builtin fields can't change type
  const safePatch: Partial<FormField> = { ...patch };
  if (existing.builtin) {
    delete safePatch.type;
  }
  cfg.fields[idx] = {
    ...existing,
    ...safePatch,
    id: existing.id,
    builtin: existing.builtin,
  };
  await writeJson("form-config", cfg);
  return cfg;
}

export async function duplicateFormField(id: string): Promise<FormConfig> {
  const cfg = await getFormConfig();
  const field = cfg.fields.find((f) => f.id === id);
  if (!field) throw new Error("Field not found");
  // Generate a unique id
  let newId = `${field.id}-copy`;
  let counter = 2;
  while (cfg.fields.some((f) => f.id === newId)) {
    newId = `${field.id}-copy-${counter++}`;
  }
  const dup: FormField = {
    ...field,
    id: newId,
    label: `${field.label} (복사본)`,
    builtin: false,
  };
  // Insert right after the original
  const idx = cfg.fields.findIndex((f) => f.id === id);
  cfg.fields.splice(idx + 1, 0, dup);
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
