"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import AdminLogo from "@/components/AdminLogo";

// useLayoutEffect warns on SSR but is required to prevent the initial-overview flash.
// Fall back to useEffect during server render to silence the warning.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { useRouter } from "next/navigation";

interface Application {
  id: string;
  name?: string;
  studentId?: string;
  generation?: string;
  role?: string;
  github?: string;
  introduction?: string;
  motivation?: string;
  wantedFeatures?: string;
  portfolio?: string;
  email?: string;
  custom?: Record<string, string>;
  privacyAgreed?: boolean;
  createdAt: string;
  adminNote?: string;
}

interface ApplicationBatch {
  id: string;
  title: string;
  closedAt: string;
  applications: Application[];
}

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "url" | "role" | "username";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  pattern?: string;
  patternError?: string;
  minLength?: number;
  maxLength?: number;
  builtin?: boolean;
  hidden?: boolean;
}

interface FormConfig {
  requireEmailAuth: boolean;
  privacyPolicy: {
    enabled: boolean;
    summary: string;
    details: string;
  };
  fields: FormField[];
}

interface Member {
  name: string;
  github: string;
  role: string;
  avatar: string;
  generation?: number;
  leader?: boolean;
}

interface MembersMetaFile {
  byLogin: Record<
    string,
    { name: string; role: string; generation?: number; leader?: boolean }
  >;
  extra: {
    login: string;
    name: string;
    role: string;
    avatar: string;
    generation?: number;
    leader?: boolean;
  }[];
  hidden: string[];
}

type RoleKey = string;
type RoleStatus = Record<string, boolean>;

interface RoleTalent {
  title: string;
  desc: string;
}

interface Role {
  slug: string;
  label: string;
  color: string;
  bg: string;
  title: string;
  subtitle: string;
  intro: string;
  stack: string[];
  talents: RoleTalent[];
  open: boolean;
  openAt?: string | null;
  closeAt?: string | null;
}

const ROLE_COLOR: Record<string, string> = {
  iOS: "#F5A623",
  Android: "#3B82F6",
  Backend: "#10B981",
  Flutter: "#06B6D4",
  DevOps: "#8B5CF6",
  Design: "#EC4899",
  Member: "#6B7280",
};

type Tab =
  | "overview"
  | "members"
  | "roles"
  | "form"
  | "applications"
  | "archives"
  | "me"
  | "logs"
  | "accounts";

interface AdminAccountSummary {
  id: string;
  name?: string;
  status: "pending" | "approved" | "rejected";
  role: "super" | "admin";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
}

interface AdminActivity {
  id: string;
  adminId: string;
  action: string;
  description: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

const VALID_TABS: Tab[] = [
  "overview",
  "members",
  "roles",
  "form",
  "applications",
  "archives",
  "me",
  "logs",
  "accounts",
];

function readInitialTab(): Tab {
  if (typeof window === "undefined") return "overview";
  const p = new URLSearchParams(window.location.search).get("tab");
  return (VALID_TABS as string[]).includes(p ?? "") ? (p as Tab) : "overview";
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTabState] = useState<Tab>("overview");

  // Hydrate tab from URL BEFORE first paint — prevents the overview flash
  // when reloading on a non-default tab. useLayoutEffect runs after the
  // initial commit but before the browser paints, so the overview state
  // from SSR never becomes visible.
  useIsomorphicLayoutEffect(() => {
    setTabState(readInitialTab());
  }, []);

  useEffect(() => {
    const onPop = () => setTabState(readInitialTab());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setTab = useCallback((next: Tab) => {
    setTabState(next);
    const url = new URL(window.location.href);
    if (next === "overview") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", next);
    }
    window.history.replaceState(null, "", url.toString());
  }, []);
  const [applications, setApplications] = useState<Application[]>([]);
  const [batches, setBatches] = useState<ApplicationBatch[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<MembersMetaFile | null>(null);
  const [roleStatus, setRoleStatus] = useState<RoleStatus | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [allActivity, setAllActivity] = useState<AdminActivity[]>([]);
  const [accounts, setAccounts] = useState<AdminAccountSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m, r, f, b, me, logs, accts] = await Promise.all([
        fetch("/api/applications").then((r) => r.json()),
        fetch("/api/members").then((r) => r.json()),
        fetch("/api/roles").then((r) => r.json()),
        fetch("/api/form-config").then((r) => r.json()),
        fetch("/api/application-batches").then((r) => r.json()),
        fetch("/api/admin/me").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/logs").then((r) => r.json()).catch(() => null),
        fetch("/api/admin/accounts").then((r) => r.json()).catch(() => null),
      ]);
      setApplications(a.applications ?? []);
      setMembers(m.members ?? []);
      setMeta(m.meta ?? null);
      setRoleStatus(r.status ?? null);
      setRoles(r.roles ?? []);
      setFormConfig(f.config ?? null);
      setBatches(b.batches ?? []);
      setAdminId(me?.adminId ?? null);
      setAdminName(me?.name ?? null);
      setActivity(me?.activity ?? []);
      setAllActivity(logs?.activity ?? []);
      setAccounts(accts?.accounts ?? []);
    } catch (err) {
      console.error("[admin] load() failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function deleteApp(id: string) {
    if (!confirm("정말 삭제할까요?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    load();
  }

  async function saveAppNote(id: string, note: string): Promise<boolean> {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: note }),
    });
    if (!res.ok) {
      alert("메모 저장 실패");
      return false;
    }
    // Update local state in place to avoid jittery full reload while the
    // admin is still typing / reviewing other cards.
    const data = await res.json().catch(() => null);
    if (data?.application) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? data.application : a)),
      );
    }
    return true;
  }

  async function closeRound(title: string, clearCurrent: boolean): Promise<boolean> {
    const res = await fetch("/api/application-batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, clearCurrent }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "저장 실패");
      return false;
    }
    await load();
    return true;
  }

  async function setAccountStatus(
    targetId: string,
    status: "approved" | "rejected",
    approvalPassword: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(
      `/api/admin/accounts/${encodeURIComponent(targetId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, approvalPassword }),
      },
    );
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return { ok: false, error: d.error || "저장 실패" };
    }
    await load();
    return { ok: true };
  }

  async function deleteLog(
    logId: string,
    approvalPassword: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(
      `/api/admin/logs/${encodeURIComponent(logId)}?approvalPassword=${encodeURIComponent(approvalPassword)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return { ok: false, error: d.error || "삭제 실패" };
    }
    await load();
    return { ok: true };
  }

  async function removeAccount(
    targetId: string,
    approvalPassword: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(
      `/api/admin/accounts/${encodeURIComponent(targetId)}?approvalPassword=${encodeURIComponent(approvalPassword)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return { ok: false, error: d.error || "삭제 실패" };
    }
    await load();
    return { ok: true };
  }

  async function deleteBatch(id: string) {
    if (!confirm("이 모집 기록을 정말 삭제할까요? 복구할 수 없어요.")) return;
    const res = await fetch(`/api/application-batches/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("삭제 실패");
      return;
    }
    load();
  }

  async function restoreBatch(id: string) {
    const batch = batches.find((b) => b.id === id);
    if (!batch) return;
    const currentCount = applications.length;
    const restoreCount = batch.applications.length;
    const msg =
      `"${batch.title}" 기록 전체를 복구할까요?\n\n` +
      `• ${restoreCount}명이 현재 지원자 목록(${currentCount}명)에 추가돼요.\n` +
      `• 같은 지원자가 이미 있으면 건너뛰어요.\n` +
      `• 복구된 건은 "이전 모집"에서 사라져요.`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/application-batches/${id}/restore`, {
      method: "POST",
    });
    if (!res.ok) {
      alert("복구 실패");
      return;
    }
    await load();
    setTab("applications");
  }

  async function restoreApplication(batchId: string, appId: string) {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;
    const app = batch.applications.find((a) => a.id === appId);
    if (!app) return;
    const msg =
      `${app.name ?? "이 지원자"}를 복구할까요?\n\n` +
      `• 현재 지원자 목록에 추가되고, "${batch.title}"에서는 사라져요.`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/application-batches/${batchId}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationIds: [appId] }),
    });
    if (!res.ok) {
      alert("복구 실패");
      return;
    }
    await load();
  }

  async function toggleRole(slug: string, open: boolean) {
    await fetch("/api/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, open }),
    });
    load();
  }

  async function saveRole(slug: string, patch: Partial<Role>) {
    const res = await fetch("/api/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...patch }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "저장 실패");
      return;
    }
    load();
  }

  async function createRole(role: Role) {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(role),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "생성 실패");
      return false;
    }
    load();
    return true;
  }

  async function removeRole(slug: string) {
    if (!confirm("정말 이 직군을 삭제할까요?")) return;
    const res = await fetch("/api/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "삭제 실패");
      return;
    }
    load();
  }

  async function updateMember(
    login: string,
    patch: {
      name?: string;
      role?: string;
      generation?: number | null;
      leader?: boolean;
    },
  ) {
    await fetch(`/api/members/${encodeURIComponent(login)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function toggleHidden(login: string) {
    await fetch(`/api/members/${encodeURIComponent(login)}?action=toggle-hidden`, {
      method: "POST",
    });
    load();
  }

  async function deleteExtra(login: string) {
    if (!confirm("정말 삭제할까요?")) return;
    await fetch(`/api/members/${encodeURIComponent(login)}?type=extra`, {
      method: "DELETE",
    });
    load();
  }

  async function addExtra(form: {
    login: string;
    name: string;
    role: string;
    avatar: string;
    generation?: number;
    leader?: boolean;
  }) {
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    load();
  }

  const navSections: {
    title: string;
    items: {
      key: Tab;
      label: string;
      count: number | null;
      icon: React.ReactNode;
    }[];
  }[] = [
    {
      title: "General",
      items: [
        {
          key: "overview",
          label: "소개",
          count: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ),
        },
        {
          key: "members",
          label: "멤버",
          count: members.length,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Recruiting",
      items: [
        {
          key: "roles",
          label: "직군 모집",
          count: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
          ),
        },
        {
          key: "form",
          label: "지원폼",
          count: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          ),
        },
        {
          key: "applications",
          label: "지원자",
          count: applications.length,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          ),
        },
        {
          key: "archives",
          label: "이전 모집",
          count: batches.length || null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          key: "me",
          label: "마이페이지",
          count: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ),
        },
        {
          key: "accounts",
          label: "계정 관리",
          count:
            accounts.filter((a) => a.status === "pending").length || null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          ),
        },
        {
          key: "logs",
          label: "로그",
          count: null,
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
        },
      ],
    },
  ];

  const navItems = navSections.flatMap((s) => s.items);
  const currentNavLabel = navItems.find((n) => n.key === tab)?.label ?? "";

  return (
    <main className="min-h-screen bg-[#F5F7FA] lg:pl-60 flex flex-col">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 z-40 w-60 flex-col bg-white border-r border-gray-200">
        <div className="px-5 py-5 border-b border-gray-100">
          <button
            onClick={() => setTab("overview")}
            className="flex items-center gap-2.5 group"
            aria-label="소개 페이지로 이동"
          >
            <AdminLogo size={32} />
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#B486F9] leading-none">ADMIN</p>
              <p className="text-base font-black text-[#1E1E1E] tracking-tight leading-tight">GOMS</p>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <p className="px-3 py-2 text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
                {section.title}
              </p>
              {section.items.map(({ key, label, count, icon }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[#B486F9]/10 text-[#B486F9]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-[#1E1E1E]"
                    }`}
                  >
                    <span className={active ? "text-[#B486F9]" : "text-gray-400"}>
                      {icon}
                    </span>
                    <span className="flex-1 text-left">{label}</span>
                    {count !== null && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          active
                            ? "bg-[#B486F9] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-2">
          {/* Current admin badge — name, id, role */}
          <button
            onClick={() => setTab("me")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#B486F9]/5 transition-colors group"
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#B486F9] to-[#8B5CF6] text-white flex items-center justify-center font-black text-sm">
              {(adminName ?? adminId ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[11px] font-black text-[#1E1E1E] truncate leading-tight">
                {adminName ?? adminId ?? "—"}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-gray-400">
                {adminId && <span className="truncate">@{adminId}</span>}
                {(() => {
                  const me = accounts.find(
                    (a) =>
                      adminId &&
                      a.id.toLowerCase() === adminId.toLowerCase(),
                  );
                  if (!me) return null;
                  return (
                    <>
                      {adminId && <span className="text-gray-300">·</span>}
                      <span
                        className={`font-bold ${
                          me.role === "super"
                            ? "text-[#B486F9]"
                            : "text-gray-500"
                        }`}
                      >
                        {me.role === "super" ? "SUPER" : "ADMIN"}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => setTab("overview")}
            className="flex items-center gap-2.5"
            aria-label="소개 페이지로 이동"
          >
            <AdminLogo size={28} />
            <div className="text-left">
              <p className="text-[9px] font-bold tracking-[0.18em] text-[#B486F9] leading-none">ADMIN</p>
              <p className="text-sm font-black text-[#1E1E1E] tracking-tight leading-tight">GOMS</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#B486F9] hover:text-[#8B5CF6] transition-colors"
            >
              team.HARIBO
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </Link>
            <button
              onClick={logout}
              className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className="px-3 pb-3 flex gap-1 overflow-x-auto scrollbar-hide">
          {navItems.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                tab === key
                  ? "bg-[#B486F9] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {label}
              {count !== null && ` ${count}`}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-5 sm:px-8 py-8 lg:py-10">
        {/* Desktop top-right: back to team.HARIBO */}
        <div className="hidden lg:flex justify-end mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#B486F9] bg-[#B486F9]/10 hover:bg-[#B486F9]/15 transition-colors"
          >
            team.HARIBO로 돌아가기
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </Link>
        </div>

        {/* Page header (hidden on overview — hero fills the space) */}
        {tab !== "overview" && (
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] text-gray-400 uppercase">
                Admin
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-black text-[#1E1E1E] tracking-tight">
                {currentNavLabel}
              </h1>
            </div>
          </div>
        )}

        <div
          key={tab}
          className="animate-admin-tab flex-1 flex flex-col"
        >
          {loading && (
            <p className="text-center text-gray-500 py-20">불러오는 중...</p>
          )}

          {!loading && tab === "overview" && (
            <OverviewTab
              memberCount={members.length}
              applicationCount={applications.length}
              roleCount={roles.length}
              onNavigate={setTab}
            />
          )}
          {!loading && tab === "applications" && (
            <ApplicationsTab
              applications={applications}
              roles={roles}
              onDelete={deleteApp}
              onCloseRound={closeRound}
              onSaveNote={saveAppNote}
            />
          )}
          {!loading && tab === "archives" && (
            <ArchivesTab
              batches={batches}
              onDelete={deleteBatch}
              onRestore={restoreBatch}
              onRestoreOne={restoreApplication}
            />
          )}
          {!loading && tab === "me" && (
            <MyPageTab
              adminId={adminId}
              adminName={adminName}
              adminRole={
                accounts.find(
                  (a) =>
                    adminId && a.id.toLowerCase() === adminId.toLowerCase(),
                )?.role ?? null
              }
              activity={activity}
              onRefresh={load}
            />
          )}
          {!loading && tab === "logs" && (
            <LogsTab
              currentAdminId={adminId}
              accounts={accounts}
              activity={allActivity}
              onRefresh={load}
              onDelete={deleteLog}
            />
          )}
          {!loading && tab === "accounts" && (
            <AccountsTab
              currentAdminId={adminId}
              accounts={accounts}
              activity={allActivity}
              applications={applications}
              batches={batches}
              onSetStatus={setAccountStatus}
              onDelete={removeAccount}
            />
          )}
          {!loading && tab === "members" && meta && (
            <MembersTab
              members={members}
              meta={meta}
              onUpdate={updateMember}
              onToggleHidden={toggleHidden}
              onDeleteExtra={deleteExtra}
              onAddExtra={addExtra}
            />
          )}
          {!loading && tab === "roles" && (
            <RolesTab
              roles={roles}
              onToggle={toggleRole}
              onSave={saveRole}
              onCreate={createRole}
              onDelete={removeRole}
            />
          )}
          {!loading && tab === "form" && formConfig && (
            <FormTab config={formConfig} reload={load} />
          )}
        </div>
      </div>

      {/* Admin footer — light, minimal */}
      <footer className="mt-4 px-5 sm:px-8 py-5 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-gray-400">
          <p>
            © {new Date().getFullYear()} team.HARIBO · GOMS Admin
          </p>
          <p>
            Made by{" "}
            <a
              href="https://github.com/Xixn2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#B486F9] transition-colors font-medium"
            >
              @Xixn2
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

function OverviewTab({
  memberCount,
  applicationCount,
  roleCount,
  onNavigate,
}: {
  memberCount: number;
  applicationCount: number;
  roleCount: number;
  onNavigate: (tab: Tab) => void;
}) {
  return (
    <section className="relative flex-1 flex items-center justify-center overflow-hidden rounded-3xl bg-white border border-gray-100 px-6 py-14 sm:py-16 shadow-[0_20px_60px_-30px_rgba(180,134,249,0.25)]">
      {/* Background gradient orbs — soft purple */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#B486F9]/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#C4B5FD]/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#B486F9]/[0.08] rounded-full blur-3xl" />
      </div>

      {/* GOMS logo watermark — bottom-right, very subtle blend */}
      <div className="absolute -right-16 -bottom-16 sm:-right-24 sm:-bottom-24 pointer-events-none select-none -rotate-12 opacity-[0.07] mix-blend-multiply blur-[1px]">
        <svg
          width="520"
          height="520"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[420px] sm:w-[520px] h-auto"
        >
          <defs>
            <linearGradient id="gomsAdminBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="50%" stopColor="#B486F9" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="102.4" fill="url(#gomsAdminBg)" />
          <path
            d="M202.619 149.841L251.528 159.933L292.206 151.015L321.833 151.015L331.238 152.423L349.344 157.82L358.984 160.637L364.628 162.983L374.033 167.912L389.317 182.696L401.309 197.011L405.776 205.225L410.479 215.785L414.947 225.172L416.593 232.447L420.59 257.792L422.471 283.372L423.647 301.676L437.755 327.49L438.225 329.837L438.46 335.704L433.993 347.672L429.995 352.601L424.352 359.171L421.53 362.457L417.141 365.742L407.266 371.375L405.541 371.375L402.484 370.905L399.428 370.201L397.312 368.793L395.901 366.681L395.43 358.467L396.371 350.254L399.428 343.214L390.257 333.357L383.203 325.613L380.382 321.623L373.798 318.103L331.238 299.799L325.595 299.564L320.892 300.503L303.963 304.727L287.503 306.135L270.103 303.554L267.987 304.492L271.044 354.947L270.103 361.284L265.871 369.262L260.698 374.895L256.465 377.476L251.998 379.119L240.006 380.057L229.19 379.823L225.192 378.415L221.665 376.068L220.49 373.252L220.019 370.436L220.96 366.916L222.136 363.865L228.249 358.702L233.657 354.478L214.376 313.41L206.852 307.308L154.182 285.718L146.422 280.086L141.719 273.046L123.144 273.28L115.854 273.28L109.506 272.342L103.392 269.291L101.041 269.056L73.295 271.168L66.4761 269.341L57.7761 262.485L55.1896 260.139L51.6625 255.68L47.4301 249.109L47.195 247.701L47.4301 245.589L48.1355 243.946L51.6626 240.895L63.8896 232.212L66.4761 212.265L70.4734 207.337L85.0518 194.43L85.7572 176.829L86.4626 173.544L87.8734 170.728L91.1653 168.146L94.2221 167.442L97.7491 168.146L103.157 173.544L104.568 173.544L106.214 172.84L108.565 164.157L109.036 162.514L110.917 161.106L114.48 160.323L118.676 161.575L133.96 171.432L141.014 171.197L178.871 151.954L194.625 149.372L202.619 149.841Z"
            fill="white"
          />
          <path
            d="M148.306 288.299L202.857 311.062L167.822 358.701L150.657 371.843L139.605 373.955L115.151 375.833L107.392 375.363L101.984 373.955L99.6325 371.843L98.2217 366.915L99.6325 361.752L107.392 355.885L124.557 348.845L138.9 326.785L148.306 288.299Z"
            fill="white"
          />
          <path
            d="M327.952 303.552L375.214 323.734L366.984 331.947L348.879 361.282L346.292 364.802L343.236 367.383L335.006 373.015L330.303 374.658L305.614 375.597L299.5 373.954L297.149 372.546L294.092 370.434L293.622 368.557V365.506L295.268 360.108L301.382 354.242L319.252 346.263L328.657 325.611L327.952 303.552Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Admin badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B486F9]/10 text-[#B486F9] text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-[#B486F9] animate-pulse" />
          GOMS Admin
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-[#B486F9] via-[#8B5CF6] to-[#C4B5FD] bg-clip-text text-transparent">
            GOMS
          </span>
        </h1>

        <p className="mt-4 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
          Team HARIBO의 운영 콘솔
          <br />
          사이트의 모든 것을 여기서 관리해요
        </p>

        {/* Slogan */}
        <p className="mt-6 text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
          멤버 · 직군 · 지원자 한 곳에서.
        </p>

        {/* Stats */}
        <div className="mt-8 inline-flex items-center gap-6 sm:gap-10 px-6 py-4 rounded-2xl bg-[#F5F7FA] border border-gray-100">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
              멤버
            </p>
            <p className="mt-1 text-2xl font-black text-[#1E1E1E] tabular-nums">
              {memberCount}
            </p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
              직군
            </p>
            <p className="mt-1 text-2xl font-black text-[#1E1E1E] tabular-nums">
              {roleCount}
            </p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
              지원자
            </p>
            <p className="mt-1 text-2xl font-black text-[#1E1E1E] tabular-nums">
              {applicationCount}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate("applications")}
            className="group px-8 py-3.5 rounded-full bg-[#B486F9] text-white font-semibold hover:bg-[#A070F0] hover:scale-[1.03] transition-all hover:shadow-lg hover:shadow-[#B486F9]/25 inline-flex items-center gap-2"
          >
            지원자 보기
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:translate-x-0.5 transition-transform"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => onNavigate("members")}
            className="px-8 py-3.5 rounded-full border-2 border-[#B486F9]/30 text-[#B486F9] font-semibold hover:bg-[#B486F9]/10 transition-all"
          >
            멤버 편집
          </button>
        </div>
      </div>
    </section>
  );
}

function MyPageTab({
  adminId,
  adminName,
  adminRole,
  activity,
  onRefresh,
}: {
  adminId: string | null;
  adminName: string | null;
  adminRole: "super" | "admin" | null;
  activity: AdminActivity[];
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<string>("all");

  // Group by action category for filter chips
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activity) {
      const prefix = a.action.split(".")[0];
      map.set(prefix, (map.get(prefix) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [activity]);

  const visible = useMemo(() => {
    if (filter === "all") return activity;
    return activity.filter((a) => a.action.startsWith(filter + "."));
  }, [activity, filter]);

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <section className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8 shadow-[0_12px_40px_-20px_rgba(180,134,249,0.25)]">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <AdminLogo size={56} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#B486F9] uppercase">
              Admin Profile
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-black text-[#1E1E1E] tracking-tight truncate">
              {adminName ?? adminId ?? "—"}
              {adminName && adminId && (
                <span className="ml-2 text-sm font-bold text-gray-400">
                  @{adminId}
                </span>
              )}
            </h2>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {adminRole && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-[0.14em] uppercase ${
                    adminRole === "super"
                      ? "bg-gradient-to-r from-[#B486F9] to-[#8B5CF6] text-white shadow-sm shadow-[#B486F9]/30"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {adminRole === "super" && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3 7h7l-6 4 3 7-7-5-7 5 3-7-6-4h7z" />
                    </svg>
                  )}
                  {adminRole === "super" ? "SUPER" : "ADMIN"}
                </span>
              )}
              <span className="text-xs text-gray-500">
                GOMS 관리자 콘솔 세션
              </span>
            </div>
          </div>
          <div className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            온라인
          </div>
        </div>
      </section>

      {/* Activity log */}
      <section className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">
              ACTIVITY
            </p>
            <h3 className="mt-2 text-xl font-black text-[#1E1E1E]">
              수정 기록
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              이 계정({adminName ? `${adminName} @${adminId}` : (adminId ?? "—")})이
              수행한 모든 수정 작업 · 최대 2000건까지 보관
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-[#B486F9] hover:bg-[#B486F9]/10 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            새로고침
          </button>
        </div>

        {/* Filter chips */}
        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                filter === "all"
                  ? "bg-[#B486F9] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              전체 {activity.length}
            </button>
            {categories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                  filter === cat
                    ? "bg-[#B486F9] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {CATEGORY_LABELS[cat] ?? cat} {count}
              </button>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className="mt-6">
          {visible.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              아직 기록된 작업이 없어요.
            </p>
          ) : (
            <ol className="relative border-l border-gray-100 ml-3 space-y-4">
              {visible.map((a) => {
                const d = new Date(a.createdAt);
                const cat = a.action.split(".")[0];
                return (
                  <li key={a.id} className="pl-5 relative">
                    <span
                      className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: CATEGORY_COLORS[cat] ?? "#B486F9" }}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[9px] font-bold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background: `${CATEGORY_COLORS[cat] ?? "#B486F9"}15`,
                          color: CATEGORY_COLORS[cat] ?? "#B486F9",
                        }}
                      >
                        {a.action}
                      </span>
                      <span className="text-[11px] text-gray-400 tabular-nums">
                        {d.toLocaleString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#1E1E1E]">
                      {a.description}
                    </p>
                    {cat === "session" && a.meta && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                        {typeof a.meta.device === "string" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-semibold">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                              <line x1="12" y1="18" x2="12" y2="18" />
                            </svg>
                            {a.meta.device}
                          </span>
                        )}
                        {typeof a.meta.ip === "string" && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-mono tabular-nums"
                            title={
                              typeof a.meta.userAgent === "string"
                                ? a.meta.userAgent
                                : undefined
                            }
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                            {a.meta.ip}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  application: "지원자",
  batch: "모집 기록",
  role: "직군",
  member: "멤버",
  form: "지원폼",
  session: "세션",
  account: "관리자 계정",
};

const CATEGORY_COLORS: Record<string, string> = {
  application: "#3B82F6",
  batch: "#F5A623",
  role: "#10B981",
  member: "#8B5CF6",
  form: "#EC4899",
  session: "#6B7280",
  account: "#B486F9",
};

/**
 * Global admin audit log. Shows every recorded activity across all admins,
 * with session grouping so the admin can see who logged in from which
 * device/IP. Flags unseen devices as "새로운 기기" relative to earlier
 * sessions by the same admin — useful for spotting credential sharing.
 */
function LogsTab({
  currentAdminId,
  accounts,
  activity,
  onRefresh,
  onDelete,
}: {
  currentAdminId: string | null;
  accounts: AdminAccountSummary[];
  activity: AdminActivity[];
  onRefresh: () => void;
  onDelete: (
    logId: string,
    approvalPassword: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  // Two log channels — admin actions vs. public applicant funnel.
  // Applicant actions are anything under the `application.*` action key.
  const [channel, setChannel] = useState<"admin" | "user">("admin");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deletingLog, setDeletingLog] = useState<AdminActivity | null>(null);

  // Only super admins can delete log entries.
  const isSuper = useMemo(() => {
    if (!currentAdminId) return false;
    const me = accounts.find(
      (a) => a.id.toLowerCase() === currentAdminId.toLowerCase(),
    );
    return me?.role === "super";
  }, [accounts, currentAdminId]);

  // Build a id→name lookup so we can render "이름 · @id" everywhere.
  // Falls back to the activity entry's own meta.name (set on register)
  // for entries where the actor no longer has an account row.
  const nameFor = useMemo(() => {
    const map = new Map<string, string>();
    for (const acc of accounts) {
      if (acc.name) map.set(acc.id, acc.name);
    }
    for (const row of activity) {
      if (
        !map.has(row.adminId) &&
        typeof row.meta?.name === "string"
      ) {
        map.set(row.adminId, row.meta.name as string);
      }
    }
    return (id: string) => map.get(id) ?? null;
  }, [accounts, activity]);

  // Compute session summary: unique (adminId, ip, device) tuples seen.
  // Excludes entries whose actor is no longer in the accounts list — that
  // way the summary only shows living accounts and drops ghosts from
  // deleted or rejected users.
  const liveAdminIds = useMemo(
    () => new Set(accounts.map((a) => a.id.toLowerCase())),
    [accounts],
  );
  const sessionSummary = useMemo(() => {
    const seen = new Map<
      string,
      { adminId: string; ip: string; device: string; count: number; last: string }
    >();
    for (const row of activity) {
      if (!liveAdminIds.has(row.adminId.toLowerCase())) continue;
      const ip = typeof row.meta?.ip === "string" ? row.meta.ip : "unknown";
      const device =
        typeof row.meta?.device === "string" ? row.meta.device : "unknown";
      if (ip === "unknown" && device === "unknown") continue;
      const key = `${row.adminId}::${ip}::${device}`;
      const existing = seen.get(key);
      if (existing) {
        existing.count++;
        if (row.createdAt > existing.last) existing.last = row.createdAt;
      } else {
        seen.set(key, {
          adminId: row.adminId,
          ip,
          device,
          count: 1,
          last: row.createdAt,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.last < b.last ? 1 : -1,
    );
  }, [activity, liveAdminIds]);

  // For each admin, collect the set of (ip|device) pairs they've previously
  // used so we can mark "new device" on their current session.login rows.
  // Since activity is newest-first, walk it in reverse chronological order
  // and check if each login's fingerprint is unseen.
  const newDeviceLoginIds = useMemo(() => {
    const seenPerAdmin = new Map<string, Set<string>>();
    const flagged = new Set<string>();
    // Iterate oldest → newest so the first time we see a fingerprint it
    // gets added and future hits aren't flagged
    const ordered = [...activity].sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : 1,
    );
    for (const row of ordered) {
      if (row.action !== "session.login") continue;
      const ip = typeof row.meta?.ip === "string" ? row.meta.ip : "";
      const device =
        typeof row.meta?.device === "string" ? row.meta.device : "";
      if (!ip && !device) continue;
      const key = `${ip}::${device}`;
      const set = seenPerAdmin.get(row.adminId) ?? new Set<string>();
      if (!set.has(key) && set.size > 0) {
        // Admin has other fingerprints on file but this one is new
        flagged.add(row.id);
      }
      set.add(key);
      seenPerAdmin.set(row.adminId, set);
    }
    return flagged;
  }, [activity]);

  // Admin channel: drop ghost entries from deleted admin accounts, and
  // exclude the public applicant funnel (that goes in the user channel).
  const adminActivity = useMemo(
    () =>
      activity.filter(
        (a) =>
          !a.action.startsWith("application.") &&
          liveAdminIds.has(a.adminId.toLowerCase()),
      ),
    [activity, liveAdminIds],
  );

  // User channel: the public applicant funnel (submit, Google auth).
  // Actors are ad-hoc labels (name / email / "지원자") so we don't filter
  // by liveAdminIds here — just by action prefix.
  const userActivity = useMemo(
    () => activity.filter((a) => a.action.startsWith("application.")),
    [activity],
  );

  // Whichever channel is currently selected drives the stats, chips, and
  // timeline below.
  const liveActivity = channel === "admin" ? adminActivity : userActivity;

  const adminIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of liveActivity) set.add(a.adminId);
    return Array.from(set).sort();
  }, [liveActivity]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of liveActivity) {
      const prefix = a.action.split(".")[0];
      map.set(prefix, (map.get(prefix) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [liveActivity]);

  const visible = useMemo(() => {
    return liveActivity.filter((a) => {
      if (adminFilter !== "all" && a.adminId !== adminFilter) return false;
      if (categoryFilter !== "all" && !a.action.startsWith(categoryFilter + "."))
        return false;
      return true;
    });
  }, [liveActivity, adminFilter, categoryFilter]);

  const loginCount = liveActivity.filter(
    (a) => a.action === "session.login",
  ).length;
  const uniqueDevices = new Set(
    liveActivity
      .filter((a) => typeof a.meta?.device === "string")
      .map((a) => a.meta!.device as string),
  ).size;
  const uniqueIps = new Set(
    liveActivity
      .filter((a) => typeof a.meta?.ip === "string")
      .map((a) => a.meta!.ip as string),
  ).size;

  const adminTotal = adminActivity.length;
  const userTotal = userActivity.length;

  return (
    <div className="space-y-6">
      {/* Channel tabs */}
      <div className="inline-flex gap-1 p-1 rounded-xl bg-gray-100">
        <button
          onClick={() => {
            setChannel("admin");
            setAdminFilter("all");
            setCategoryFilter("all");
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            channel === "admin"
              ? "bg-white text-[#B486F9] shadow-sm"
              : "text-gray-500 hover:text-[#1E1E1E]"
          }`}
        >
          관리자 로그 {adminTotal}
        </button>
        <button
          onClick={() => {
            setChannel("user");
            setAdminFilter("all");
            setCategoryFilter("all");
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            channel === "user"
              ? "bg-white text-[#B486F9] shadow-sm"
              : "text-gray-500 hover:text-[#1E1E1E]"
          }`}
        >
          유저 로그 {userTotal}
        </button>
      </div>

      {/* Stats */}
      <section className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">
              {channel === "admin" ? "ADMIN AUDIT" : "USER AUDIT"}
            </p>
            <h3 className="mt-2 text-xl font-black text-[#1E1E1E]">
              {channel === "admin" ? "관리자 로그" : "유저 로그"}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              {channel === "admin"
                ? "관리자들의 모든 활동 · 로그인 기기/IP · 최대 2000건까지 보관"
                : "지원자 Google 로그인 · 지원서 제출 시도 (성공/실패) · IP/기기"}
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-[#B486F9] hover:bg-[#B486F9]/10 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            새로고침
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="전체 로그" value={liveActivity.length} />
          <StatCard label="로그인 수" value={loginCount} />
          <StatCard label="고유 기기" value={uniqueDevices} />
          <StatCard label="고유 IP" value={uniqueIps} />
        </div>
      </section>

      {/* Seen devices per admin — only meaningful on the admin channel */}
      {channel === "admin" && sessionSummary.length > 0 && (
        <section className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">
            SESSIONS
          </p>
          <h3 className="mt-2 text-xl font-black text-[#1E1E1E]">
            로그인한 기기
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            같은 계정인데 기기나 IP가 다르면 누군가 자격증명을 공유하고 있을 수
            있어요
          </p>
          <div className="mt-5 space-y-2">
            {sessionSummary.map((s) => {
              const name = nameFor(s.adminId);
              return (
              <div
                key={`${s.adminId}-${s.ip}-${s.device}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-[#B486F9]/10 text-[#B486F9] flex items-center justify-center font-black text-sm">
                  {(name ?? s.adminId).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1E1E1E]">
                    {name ?? s.adminId}
                    {name && (
                      <span className="ml-1.5 text-[11px] font-semibold text-gray-400">
                        @{s.adminId}
                      </span>
                    )}
                    {s.adminId === currentAdminId && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-500">
                        · 본인
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {s.device}{" "}
                    <span className="text-gray-300">·</span>{" "}
                    <span className="font-mono tabular-nums">{s.ip}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    Activity
                  </p>
                  <p className="text-sm font-black text-[#1E1E1E] tabular-nums">
                    {s.count}
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filters + timeline */}
      <section className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8">
        {channel === "admin" && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
              Filter
            </p>
            {/* Admin filter — only makes sense on the admin channel */}
            <div className="flex gap-1.5 flex-wrap">
              <FilterChip
                active={adminFilter === "all"}
                onClick={() => setAdminFilter("all")}
              >
                모든 관리자
              </FilterChip>
              {adminIds.map((aid) => {
                const nm = nameFor(aid);
                return (
                  <FilterChip
                    key={aid}
                    active={adminFilter === aid}
                    onClick={() => setAdminFilter(aid)}
                  >
                    {nm ? `${nm} @${aid}` : aid}
                  </FilterChip>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
            Category
          </p>
          <div className="flex gap-1.5 flex-wrap">
            <FilterChip
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
            >
              전체 {liveActivity.length}
            </FilterChip>
            {categoryCounts.map(([cat, count]) => (
              <FilterChip
                key={cat}
                active={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
              >
                {CATEGORY_LABELS[cat] ?? cat} {count}
              </FilterChip>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            조건에 맞는 로그가 없어요.
          </p>
        ) : (
          <ol className="relative border-l border-gray-100 ml-3 space-y-4">
            {visible.map((a) => {
              const d = new Date(a.createdAt);
              const cat = a.action.split(".")[0];
              const isNewDevice = newDeviceLoginIds.has(a.id);
              const actorName = nameFor(a.adminId);
              return (
                <li key={a.id} className="pl-5 relative">
                  <span
                    className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: CATEGORY_COLORS[cat] ?? "#B486F9" }}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[9px] font-bold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded"
                      style={{
                        background: `${CATEGORY_COLORS[cat] ?? "#B486F9"}15`,
                        color: CATEGORY_COLORS[cat] ?? "#B486F9",
                      }}
                    >
                      {a.action}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 px-1.5 py-0.5 rounded bg-gray-100">
                      {actorName ? (
                        <>
                          {actorName}{" "}
                          <span className="text-gray-400">@{a.adminId}</span>
                        </>
                      ) : (
                        a.adminId
                      )}
                    </span>
                    <span className="text-[11px] text-gray-400 tabular-nums">
                      {d.toLocaleString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isNewDevice && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        ⚠ 새로운 기기
                      </span>
                    )}
                    {isSuper && (
                      <button
                        onClick={() => setDeletingLog(a)}
                        className="ml-auto inline-flex items-center p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="이 로그 삭제"
                        title="이 로그 삭제"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#1E1E1E]">{a.description}</p>
                  {a.meta && (typeof a.meta.ip === "string" || typeof a.meta.device === "string") && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {typeof a.meta.device === "string" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-semibold">
                          {a.meta.device}
                        </span>
                      )}
                      {typeof a.meta.ip === "string" && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-mono tabular-nums"
                          title={
                            typeof a.meta.userAgent === "string"
                              ? a.meta.userAgent
                              : undefined
                          }
                        >
                          {a.meta.ip}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {deletingLog && (
        <ApprovalPasswordDialog
          kind="delete"
          targetId={`log / ${deletingLog.action}`}
          onCancel={() => setDeletingLog(null)}
          onConfirm={(password) => onDelete(deletingLog.id, password)}
          onDone={() => setDeletingLog(null)}
        />
      )}
    </div>
  );
}

/**
 * Account management tab — list all admin accounts by status and let the
 * current admin approve / reject / delete via a password-gated dialog.
 *
 * Also surfaces derived "user accounts" (applicants who have authenticated
 * via Google) so the admin has a single place to see both admin accounts
 * and end-user accounts that have interacted with the apply flow.
 */
function AccountsTab({
  currentAdminId,
  accounts,
  activity,
  applications,
  batches,
  onSetStatus,
  onDelete,
}: {
  currentAdminId: string | null;
  accounts: AdminAccountSummary[];
  activity: AdminActivity[];
  applications: Application[];
  batches: ApplicationBatch[];
  onSetStatus: (
    targetId: string,
    status: "approved" | "rejected",
    approvalPassword: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (
    targetId: string,
    approvalPassword: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [confirming, setConfirming] = useState<
    | {
        kind: "approve" | "reject" | "delete";
        targetId: string;
      }
    | null
  >(null);

  const pending = accounts.filter((a) => a.status === "pending");
  const approved = accounts.filter((a) => a.status === "approved");
  const rejected = accounts.filter((a) => a.status === "rejected");

  // Derive user accounts from the activity log. Each unique email that
  // ever successfully authed with Google becomes a row. We also count
  // login attempts, submission attempts, and last seen time so the admin
  // has a quick overview without digging through raw logs.
  const userAccounts = useMemo(() => {
    type Row = {
      email: string;
      name: string | null;
      loginCount: number;
      firstSeen: string;
      lastSeen: string;
      submitCount: number;
      submitFailCount: number;
    };
    const byEmail = new Map<string, Row>();

    for (const row of activity) {
      if (!row.action.startsWith("application.")) continue;
      const email =
        typeof row.meta?.email === "string" ? (row.meta.email as string) : null;
      if (!email) continue;
      const name =
        typeof row.meta?.name === "string" ? (row.meta.name as string) : null;
      const existing = byEmail.get(email);
      if (existing) {
        if (name && !existing.name) existing.name = name;
        if (row.createdAt > existing.lastSeen) existing.lastSeen = row.createdAt;
        if (row.createdAt < existing.firstSeen)
          existing.firstSeen = row.createdAt;
        if (row.action === "application.authGoogle") existing.loginCount++;
        if (row.action === "application.submit") existing.submitCount++;
        if (row.action === "application.submitFail")
          existing.submitFailCount++;
      } else {
        byEmail.set(email, {
          email,
          name,
          loginCount: row.action === "application.authGoogle" ? 1 : 0,
          submitCount: row.action === "application.submit" ? 1 : 0,
          submitFailCount: row.action === "application.submitFail" ? 1 : 0,
          firstSeen: row.createdAt,
          lastSeen: row.createdAt,
        });
      }
    }

    // Fallback: also surface applicants from both the live list AND any
    // archived batches, so users whose rounds have already been closed
    // (and submissions moved to archives) still show up here.
    const fallbackApps: Application[] = [
      ...applications,
      ...batches.flatMap((b) => b.applications),
    ];
    for (const app of fallbackApps) {
      if (!app.email) continue;
      const existing = byEmail.get(app.email);
      if (existing) {
        // Already have this user from the log — just make sure the
        // submission count reflects the archived record too.
        existing.submitCount = Math.max(existing.submitCount, 1);
        if (!existing.name && app.name) existing.name = app.name;
        if (app.createdAt < existing.firstSeen)
          existing.firstSeen = app.createdAt;
        if (app.createdAt > existing.lastSeen) existing.lastSeen = app.createdAt;
      } else {
        byEmail.set(app.email, {
          email: app.email,
          name: app.name ?? null,
          loginCount: 0,
          submitCount: 1,
          submitFailCount: 0,
          firstSeen: app.createdAt,
          lastSeen: app.createdAt,
        });
      }
    }

    return Array.from(byEmail.values()).sort((a, b) =>
      a.lastSeen < b.lastSeen ? 1 : -1,
    );
  }, [activity, applications, batches]);

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="대기" value={pending.length} />
        <StatCard label="승인된 관리자" value={approved.length} />
        <StatCard label="거부됨" value={rejected.length} />
        <StatCard label="유저 계정" value={userAccounts.length} />
      </section>

      {/* Pending */}
      <AccountsSection
        title="승인 대기"
        subtitle="새로 가입을 신청한 계정 — 승인 암호를 입력해 허용하거나 거부할 수 있어요."
        accounts={pending}
        currentAdminId={currentAdminId}
        renderActions={(acc) => (
          <>
            <button
              onClick={() =>
                setConfirming({ kind: "approve", targetId: acc.id })
              }
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#B486F9] hover:bg-[#A070F0] transition-colors"
            >
              승인
            </button>
            <button
              onClick={() =>
                setConfirming({ kind: "reject", targetId: acc.id })
              }
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              거부
            </button>
          </>
        )}
        emptyLabel="대기 중인 신청이 없어요."
      />

      {/* Approved */}
      <AccountsSection
        title="승인된 관리자"
        subtitle="로그인이 가능한 활성 계정."
        accounts={approved}
        currentAdminId={currentAdminId}
        renderActions={(acc) =>
          acc.role === "super" || acc.id === currentAdminId ? (
            <span className="text-[10px] text-gray-400 font-semibold">
              {acc.role === "super" ? "SUPER" : "본인"}
            </span>
          ) : (
            <button
              onClick={() =>
                setConfirming({ kind: "delete", targetId: acc.id })
              }
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              계정 삭제
            </button>
          )
        }
        emptyLabel="승인된 계정이 없어요."
      />

      {/* Rejected */}
      {rejected.length > 0 && (
        <AccountsSection
          title="거부된 계정"
          subtitle="다시 승인하거나 영구 삭제할 수 있어요."
          accounts={rejected}
          currentAdminId={currentAdminId}
          renderActions={(acc) => (
            <>
              <button
                onClick={() =>
                  setConfirming({ kind: "approve", targetId: acc.id })
                }
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#B486F9] hover:bg-[#B486F9]/10 transition-colors"
              >
                재승인
              </button>
              <button
                onClick={() =>
                  setConfirming({ kind: "delete", targetId: acc.id })
                }
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                계정 삭제
              </button>
            </>
          )}
          emptyLabel=""
        />
      )}

      {/* User accounts — applicants who authed via Google */}
      <UserAccountsSection accounts={userAccounts} />

      {confirming && (
        <ApprovalPasswordDialog
          kind={confirming.kind}
          targetId={confirming.targetId}
          onCancel={() => setConfirming(null)}
          onConfirm={async (password) => {
            const result =
              confirming.kind === "delete"
                ? await onDelete(confirming.targetId, password)
                : await onSetStatus(
                    confirming.targetId,
                    confirming.kind === "approve" ? "approved" : "rejected",
                    password,
                  );
            return result;
          }}
          onDone={() => setConfirming(null)}
        />
      )}
    </div>
  );
}

function AccountsSection({
  title,
  subtitle,
  accounts,
  currentAdminId,
  renderActions,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  accounts: AdminAccountSummary[];
  currentAdminId: string | null;
  renderActions: (acc: AdminAccountSummary) => React.ReactNode;
  emptyLabel: string;
}) {
  return (
    <section className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9] uppercase">
            {title}
          </p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
        <span className="text-[10px] font-bold text-gray-400 tabular-nums">
          {accounts.length}건
        </span>
      </div>

      {accounts.length === 0 ? (
        emptyLabel && (
          <p className="mt-4 text-sm text-gray-400 text-center py-6">
            {emptyLabel}
          </p>
        )
      ) : (
        <div className="mt-5 space-y-2">
          {accounts.map((acc) => {
            const d = new Date(acc.createdAt);
            return (
              <div
                key={acc.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-[#B486F9]/10 text-[#B486F9] flex items-center justify-center font-black">
                  {(acc.name ?? acc.id).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1E1E1E] truncate">
                    {acc.name ?? acc.id}
                    {acc.name && (
                      <span className="ml-1.5 text-[11px] font-semibold text-gray-400">
                        @{acc.id}
                      </span>
                    )}
                    {acc.id === currentAdminId && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-500">
                        · 본인
                      </span>
                    )}
                    {acc.role === "super" && (
                      <span className="ml-2 text-[10px] font-bold text-[#B486F9]">
                        · SUPER
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500 tabular-nums">
                    가입{" "}
                    {d.toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                    {acc.approvedAt && (
                      <>
                        {" · "}
                        승인{" "}
                        {new Date(acc.approvedAt).toLocaleDateString(
                          "ko-KR",
                          { month: "short", day: "numeric" },
                        )}
                        {acc.approvedBy && ` (${acc.approvedBy})`}
                      </>
                    )}
                    {acc.rejectedAt && (
                      <>
                        {" · "}
                        거부{" "}
                        {new Date(acc.rejectedAt).toLocaleDateString(
                          "ko-KR",
                          { month: "short", day: "numeric" },
                        )}
                        {acc.rejectedBy && ` (${acc.rejectedBy})`}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {renderActions(acc)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface UserAccountRow {
  email: string;
  name: string | null;
  loginCount: number;
  firstSeen: string;
  lastSeen: string;
  submitCount: number;
  submitFailCount: number;
}

/**
 * Derived view of applicant "accounts" — one row per Google email seen in
 * the activity log. Not a real account store (there's no underlying table),
 * so there's nothing to approve/reject/delete here — it's purely informational.
 */
function UserAccountsSection({ accounts }: { accounts: UserAccountRow[] }) {
  return (
    <section className="rounded-3xl bg-white border border-gray-100 p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9] uppercase">
            User Accounts
          </p>
          <p className="mt-1 text-xs text-gray-400">
            지원 페이지에서 Google로 로그인한 유저 · 로그인/제출 기록 기준
          </p>
        </div>
        <span className="text-[10px] font-bold text-gray-400 tabular-nums">
          {accounts.length}명
        </span>
      </div>

      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400 text-center py-6">
          아직 Google 로그인한 유저가 없어요.
        </p>
      ) : (
        <div className="mt-5 space-y-2">
          {accounts.map((acc) => {
            const first = new Date(acc.firstSeen);
            const last = new Date(acc.lastSeen);
            return (
              <div
                key={acc.email}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
                  {(acc.name ?? acc.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1E1E1E] truncate">
                    {acc.name ?? acc.email}
                    {acc.name && (
                      <span className="ml-1.5 text-[11px] font-mono font-semibold text-gray-400">
                        {acc.email}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500 tabular-nums flex flex-wrap gap-x-2">
                    <span>
                      처음{" "}
                      {first.toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span>
                      최근{" "}
                      {last.toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {last.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3 text-[10px] font-bold">
                  <span className="inline-flex items-center gap-1 text-blue-500">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                    </svg>
                    로그인 {acc.loginCount}
                  </span>
                  {acc.submitCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      제출 {acc.submitCount}
                    </span>
                  )}
                  {acc.submitFailCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      실패 {acc.submitFailCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * Password-gated confirmation dialog for account mutations. The user must
 * type the ADMIN_APPROVAL_PASSWORD — we don't check it client-side, we just
 * forward to the backend which rejects with 401 on mismatch.
 */
function ApprovalPasswordDialog({
  kind,
  targetId,
  onCancel,
  onConfirm,
  onDone,
}: {
  kind: "approve" | "reject" | "delete";
  targetId: string;
  onCancel: () => void;
  onConfirm: (
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title =
    kind === "approve"
      ? `"${targetId}" 승인`
      : kind === "reject"
        ? `"${targetId}" 거부`
        : `"${targetId}" 삭제`;
  const ctaLabel =
    kind === "approve" ? "승인" : kind === "reject" ? "거부" : "삭제";
  const ctaColor =
    kind === "approve"
      ? "bg-[#B486F9] hover:bg-[#A070F0] shadow-sm shadow-[#B486F9]/25"
      : "bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/25";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError(null);
    const result = await onConfirm(password);
    setSubmitting(false);
    if (result.ok) {
      onDone();
    } else {
      setError(result.error ?? "실패");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 sm:p-8 space-y-5"
      >
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#B486F9] uppercase">
            Approval Password Required
          </p>
          <h2 className="mt-1 text-xl font-black text-[#1E1E1E]">{title}</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            계정 관리는 로그인 비밀번호와는 다른{" "}
            <span className="font-bold text-[#1E1E1E]">승인 전용 암호</span>
            를 알고 있어야만 가능해요. 암호는 서버에 저장된 환경변수예요.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wider">
            승인 암호
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#B486F9] focus:bg-white focus:ring-2 focus:ring-[#B486F9]/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "암호 숨기기" : "암호 보기"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-[#B486F9] hover:bg-[#B486F9]/10 transition-colors"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-semibold">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || !password}
            className={`flex-1 px-4 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${ctaColor}`}
          >
            {submitting ? "처리 중..." : ctaLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#F5F7FA] border border-gray-100 p-4">
      <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[#1E1E1E] tabular-nums">
        {value}
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
        active
          ? "bg-[#B486F9] text-white"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function CloseRoundDialog({
  applicationCount,
  onCancel,
  onConfirm,
}: {
  applicationCount: number;
  onCancel: () => void;
  onConfirm: (title: string, clearCurrent: boolean) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [clearCurrent, setClearCurrent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(title.trim(), clearCurrent);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 sm:p-8 space-y-5"
      >
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#B486F9] uppercase">
            Close Round
          </p>
          <h2 className="mt-1 text-xl font-black text-[#1E1E1E]">
            모집 종료·저장
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            지금 접수된 <span className="font-bold text-[#1E1E1E]">{applicationCount}</span>
            명의 지원자를 한 건의 기록으로 묶어 보관해요. 나중에 &quot;이전 모집&quot;
            탭에서 다시 볼 수 있어요.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2 tracking-wider">
            기록 제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: GOMS 1차 모집"
            autoFocus
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#B486F9] focus:bg-white focus:ring-2 focus:ring-[#B486F9]/20 transition-all"
          />
        </div>

        <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
          <input
            type="checkbox"
            checked={clearCurrent}
            onChange={(e) => setClearCurrent(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#B486F9] cursor-pointer shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-[#1E1E1E]">
              저장 후 현재 지원자 목록 비우기
            </p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              체크하면 다음 모집 라운드를 위해 지원자 목록이 깨끗하게
              비워져요. 스냅샷은 &quot;이전 모집&quot;에 안전하게 저장돼요.
            </p>
          </div>
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="flex-1 px-4 py-3 rounded-xl bg-[#B486F9] text-white text-sm font-bold hover:bg-[#A070F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-[#B486F9]/25"
          >
            {submitting ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ArchivesTab({
  batches,
  onDelete,
  onRestore,
  onRestoreOne,
}: {
  batches: ApplicationBatch[];
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onRestoreOne: (batchId: string, appId: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (batches.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto rounded-3xl bg-white border border-gray-100 p-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#B486F9]/10 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B486F9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-[#1E1E1E]">
            아직 보관된 모집이 없어요.
          </h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            지원자 탭에서 <span className="font-bold text-[#B486F9]">모집 종료·저장</span>을
            누르면 그 시점의 지원자들이 이곳에 기록돼요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => {
        const expanded = expandedId === batch.id;
        const closedAt = new Date(batch.closedAt);
        const counts: Record<string, number> = {};
        for (const app of batch.applications) {
          const k = app.role ?? "기타";
          counts[k] = (counts[k] ?? 0) + 1;
        }
        return (
          <div
            key={batch.id}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden"
          >
            <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
              <button
                onClick={() => setExpandedId(expanded ? null : batch.id)}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-[#B486F9]/10 text-[#B486F9] text-[10px] font-bold tracking-wider">
                    ARCHIVED
                  </span>
                  <span className="text-[11px] text-gray-400 tabular-nums">
                    {closedAt.toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    {closedAt.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <h3 className="mt-2 text-lg sm:text-xl font-black text-[#1E1E1E] truncate">
                  {batch.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>
                    총{" "}
                    <span className="font-bold text-[#1E1E1E] tabular-nums">
                      {batch.applications.length}
                    </span>
                    명
                  </span>
                  {Object.entries(counts).map(([label, count]) => (
                    <span key={label} className="inline-flex items-center gap-1">
                      <span className="text-gray-300">·</span>
                      {label}{" "}
                      <span className="font-bold text-[#1E1E1E] tabular-nums">
                        {count}
                      </span>
                    </span>
                  ))}
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onRestore(batch.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#B486F9] bg-[#B486F9]/10 hover:bg-[#B486F9]/15 transition-colors"
                  aria-label="복구"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <polyline points="3 4 3 10 9 10" />
                  </svg>
                  복구
                </button>
                <button
                  onClick={() => setExpandedId(expanded ? null : batch.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-[#B486F9] hover:bg-[#B486F9]/10 transition-colors"
                  aria-label={expanded ? "접기" : "펼치기"}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(batch.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="삭제"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {expanded && (
              <div className="border-t border-gray-100 bg-[#F9FAFB] p-5 sm:p-6 space-y-3">
                {batch.applications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    이 기록에는 지원자가 없어요.
                  </p>
                ) : (
                  batch.applications.map((app) => (
                    <ArchivedApplicationCard
                      key={app.id}
                      app={app}
                      onRestore={() => onRestoreOne(batch.id, app.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ArchivedApplicationCard({
  app,
  onRestore,
}: {
  app: Application;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const createdAt = new Date(app.createdAt);

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {app.role && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold tracking-wider uppercase">
                {app.role}
              </span>
            )}
            <span className="text-sm font-bold text-[#1E1E1E]">
              {app.name || "이름 없음"}
            </span>
            {app.generation && (
              <span className="text-xs text-gray-400">· {app.generation}</span>
            )}
            {app.studentId && (
              <span className="text-xs text-gray-400">· {app.studentId}</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-gray-400 tabular-nums">
            {createdAt.toLocaleString("ko-KR")}
          </p>
        </button>
        <button
          onClick={onRestore}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#B486F9] bg-[#B486F9]/10 hover:bg-[#B486F9]/15 transition-colors"
          aria-label={`${app.name ?? "지원자"} 복구`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <polyline points="3 4 3 10 9 10" />
          </svg>
          복구
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-[#B486F9] hover:bg-[#B486F9]/10 transition-colors"
          aria-label={open ? "접기" : "펼치기"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-3 text-sm">
          {app.email && (
            <ReadOnlyField label="이메일" value={app.email} />
          )}
          {app.github && <ReadOnlyField label="GitHub" value={app.github} />}
          {app.introduction && (
            <ReadOnlyField label="자기소개" value={app.introduction} multiline />
          )}
          {app.motivation && (
            <ReadOnlyField label="지원 동기" value={app.motivation} multiline />
          )}
          {app.wantedFeatures && (
            <ReadOnlyField
              label="만들고 싶은 기능"
              value={app.wantedFeatures}
              multiline
            />
          )}
          {app.portfolio && (
            <ReadOnlyField label="포트폴리오" value={app.portfolio} />
          )}
          {app.custom &&
            Object.entries(app.custom).map(([k, v]) => (
              <ReadOnlyField key={k} label={k} value={v} multiline />
            ))}
          {app.adminNote && (
            <div className="rounded-lg border border-[#B486F9]/20 bg-[#B486F9]/5 p-3">
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#B486F9] uppercase">
                Admin Memo
              </p>
              <p className="mt-1 text-sm text-[#1E1E1E] whitespace-pre-wrap leading-relaxed">
                {app.adminNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
        {label}
      </p>
      <p
        className={`mt-1 text-sm text-[#1E1E1E] ${
          multiline ? "whitespace-pre-wrap leading-relaxed" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Inline, per-application memo editor for interview / review notes.
 * Starts collapsed when there's nothing written, expands on click.
 * Dirty state is tracked so the admin can see when a save is pending.
 */
function ApplicationNoteEditor({
  value,
  onSave,
}: {
  value: string;
  onSave: (note: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(value.length > 0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // If the parent value changes (e.g. another tab edited it), sync the draft
  // when we're not mid-edit.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const dirty = draft !== value;

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) setSavedAt(Date.now());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#B486F9] transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        메모 추가
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[#B486F9]/20 bg-[#B486F9]/5 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="inline-flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B486F9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="text-[10px] font-bold tracking-[0.18em] text-[#B486F9] uppercase">
            Admin Memo
          </span>
          <span className="text-[10px] text-gray-400">· 관리자에게만 보여요</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          {dirty && !saving && (
            <span className="text-amber-500 font-semibold">저장 안 됨</span>
          )}
          {saving && <span className="text-gray-400">저장 중...</span>}
          {!dirty && savedAt && (
            <span className="text-emerald-500 font-semibold">✓ 저장됨</span>
          )}
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        placeholder="면접 때 기억해 둘 내용, 코멘트, 보충 질문 등을 자유롭게 적어주세요."
        rows={3}
        className="w-full resize-y px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#1E1E1E] placeholder:text-gray-400 focus:outline-none focus:border-[#B486F9] focus:ring-2 focus:ring-[#B486F9]/20 transition-all"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            if (draft.length === 0) setOpen(false);
            else setDraft(value);
          }}
          disabled={saving}
          className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          {draft.length === 0 ? "접기" : "취소"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="px-3 py-1.5 rounded-lg bg-[#B486F9] text-white text-[11px] font-bold hover:bg-[#A070F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function ApplicationsTab({
  applications,
  roles,
  onDelete,
  onCloseRound,
  onSaveNote,
}: {
  applications: Application[];
  roles: Role[];
  onDelete: (id: string) => void;
  onCloseRound: (title: string, clearCurrent: boolean) => Promise<boolean>;
  onSaveNote: (id: string, note: string) => Promise<boolean>;
}) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [genFilter, setGenFilter] = useState<string>("all");
  const [closeOpen, setCloseOpen] = useState(false);

  // Compute stats: only roles currently open (effective open considering schedule)
  const openRoles = roles.filter((r) => {
    if (!r.open) return false;
    const now = new Date();
    if (r.openAt && now < new Date(r.openAt)) return false;
    if (r.closeAt && now >= new Date(r.closeAt)) return false;
    return true;
  });

  const countsByLabel: Record<string, number> = {};
  for (const r of openRoles) countsByLabel[r.label] = 0;
  for (const app of applications) {
    const label = app.role;
    if (label && label in countsByLabel) {
      countsByLabel[label]++;
    }
  }
  const totalOpenApps = Object.values(countsByLabel).reduce((a, b) => a + b, 0);

  // Build the role filter chips: show roles that have at least one application
  // OR are currently open (so admins can browse empty buckets)
  const roleChips: { value: string; label: string; count: number; color?: string }[] = [
    { value: "all", label: "전체", count: applications.length },
  ];
  const seenRoles = new Set<string>();
  for (const app of applications) {
    if (app.role && !seenRoles.has(app.role)) {
      seenRoles.add(app.role);
    }
  }
  // Add open roles first (in defined order)
  for (const r of openRoles) {
    const cnt = applications.filter((a) => a.role === r.label).length;
    roleChips.push({
      value: r.label,
      label: r.label,
      count: cnt,
      color: r.color,
    });
    seenRoles.delete(r.label);
  }
  // Then any leftover roles from applications that aren't currently open
  for (const label of seenRoles) {
    const cnt = applications.filter((a) => a.role === label).length;
    const matched = roles.find((r) => r.label === label);
    roleChips.push({
      value: label,
      label,
      count: cnt,
      color: matched?.color,
    });
  }

  // Build generation chips from the applicants' generation strings
  // (지원자 기수 필드는 "7기", "10", "10기 3반" 등 자유 형식이므로 그대로 사용)
  const generationCounts: Record<string, number> = {};
  for (const a of applications) {
    const g = (a.generation ?? "").trim();
    if (!g) continue;
    generationCounts[g] = (generationCounts[g] ?? 0) + 1;
  }
  const generationValues = Object.keys(generationCounts).sort((a, b) => {
    // Try numeric comparison first (strip non-digits)
    const na = parseInt(a.replace(/[^\d]/g, ""), 10);
    const nb = parseInt(b.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return nb - na;
    return a.localeCompare(b, "ko");
  });

  // Apply filter + sort
  const filtered = applications.filter((a) => {
    if (roleFilter !== "all" && a.role !== roleFilter) return false;
    if (genFilter !== "all" && (a.generation ?? "").trim() !== genFilter)
      return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? tb - ta : ta - tb;
  });

  return (
    <div className="space-y-6">
      {/* Close-round action bar */}
      <div className="flex justify-end">
        <button
          onClick={() => setCloseOpen(true)}
          disabled={applications.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B486F9] text-white text-xs font-bold hover:bg-[#A070F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-[#B486F9]/25"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 10 12 15 7 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          모집 종료·저장
        </button>
      </div>

      {closeOpen && (
        <CloseRoundDialog
          applicationCount={applications.length}
          onCancel={() => setCloseOpen(false)}
          onConfirm={async (title, clearCurrent) => {
            const ok = await onCloseRound(title, clearCurrent);
            if (ok) setCloseOpen(false);
          }}
        />
      )}

      {/* Stats section */}
      {openRoles.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">
                STATS
              </p>
              <h3 className="mt-2 text-xl font-black text-[#1E1E1E]">
                직군별 지원 현황
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                현재 모집 중인 {openRoles.length}개 직군 기준 · 총{" "}
                <span className="font-bold text-[#1E1E1E]">{totalOpenApps}</span>명 지원
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {openRoles.map((role) => {
              const count = countsByLabel[role.label] ?? 0;
              const pct =
                totalOpenApps === 0 ? 0 : (count / totalOpenApps) * 100;
              return (
                <div key={role.slug}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: role.color }}
                      />
                      <span className="font-bold text-[#1E1E1E]">
                        {role.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 tabular-nums">
                      <span className="font-black text-[#1E1E1E]">
                        {count}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400">
                        명
                      </span>
                      <span className="text-[11px] font-bold text-gray-400 ml-1">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: role.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stacked single bar */}
          {totalOpenApps > 0 && (
            <div className="mt-7 pt-6 border-t border-dashed border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black tracking-[0.18em] text-gray-400 uppercase">
                  Total Distribution
                </p>
                <p className="text-[11px] font-bold text-gray-400 tabular-nums">
                  {totalOpenApps}명
                </p>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                {openRoles.map((role) => {
                  const count = countsByLabel[role.label] ?? 0;
                  if (count === 0) return null;
                  const pct = (count / totalOpenApps) * 100;
                  return (
                    <div
                      key={role.slug}
                      className="h-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: role.color,
                      }}
                      title={`${role.label} · ${count}명 (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {openRoles
                  .filter((r) => (countsByLabel[r.label] ?? 0) > 0)
                  .map((role) => {
                    const count = countsByLabel[role.label] ?? 0;
                    const pct = (count / totalOpenApps) * 100;
                    return (
                      <div
                        key={role.slug}
                        className="inline-flex items-center gap-1.5 text-[11px]"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: role.color }}
                        />
                        <span className="font-bold text-[#1E1E1E]">
                          {role.label}
                        </span>
                        <span className="text-gray-400 tabular-nums">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <p className="text-gray-500">아직 지원자가 없어요.</p>
        </div>
      ) : (
        <>
          {/* Filter & sort controls */}
          <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase mb-1.5">
                    직군
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleChips.map((chip) => {
                      const active = roleFilter === chip.value;
                      return (
                        <button
                          key={chip.value}
                          onClick={() => setRoleFilter(chip.value)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            active
                              ? "bg-[#1E1E1E] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {chip.color && (
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background: active ? "#fff" : chip.color,
                              }}
                            />
                          )}
                          {chip.label}
                          <span
                            className={`tabular-nums text-[10px] ${
                              active ? "text-white/70" : "text-gray-400"
                            }`}
                          >
                            {chip.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {generationValues.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase mb-1.5">
                      기수
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setGenFilter("all")}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          genFilter === "all"
                            ? "bg-[#1E1E1E] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        전체
                      </button>
                      {generationValues.map((g) => {
                        const active = genFilter === g;
                        return (
                          <button
                            key={g}
                            onClick={() => setGenFilter(g)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              active
                                ? "bg-[#1E1E1E] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {g}
                            <span
                              className={`tabular-nums text-[10px] ${
                                active ? "text-white/70" : "text-gray-400"
                              }`}
                            >
                              {generationCounts[g]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 p-1 rounded-full bg-gray-100 shrink-0">
                <button
                  onClick={() => setSortOrder("newest")}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                    sortOrder === "newest"
                      ? "bg-white text-[#1E1E1E] shadow-sm"
                      : "text-gray-500 hover:text-[#1E1E1E]"
                  }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => setSortOrder("oldest")}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                    sortOrder === "oldest"
                      ? "bg-white text-[#1E1E1E] shadow-sm"
                      : "text-gray-500 hover:text-[#1E1E1E]"
                  }`}
                >
                  오래된순
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              {roleFilter === "all" ? "전체" : roleFilter}
              {genFilter !== "all" && ` · ${genFilter}`} ·{" "}
              <span className="font-bold text-gray-600">{sorted.length}</span>
              명 표시
            </p>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <p className="text-gray-500">조건에 맞는 지원자가 없어요.</p>
            </div>
          ) : (
            sorted.map((app) => (
        <div
          key={app.id}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                  style={{ background: (app.role && ROLE_COLOR[app.role]) || "#6B7280" }}
                >
                  {app.role}
                </span>
                <h3 className="text-lg font-black text-[#1E1E1E]">{app.name}</h3>
                <span className="text-xs text-gray-500">{app.generation}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{app.studentId}</span>
              </div>
              {app.introduction && (
                <Section title="자기소개">
                  {app.introduction}
                </Section>
              )}
              {app.motivation && (
                <Section title="지원하게 된 계기">
                  {app.motivation}
                </Section>
              )}
              {app.wantedFeatures && (
                <Section title="만들고 싶은 기능">
                  {app.wantedFeatures}
                </Section>
              )}
              {app.custom &&
                Object.entries(app.custom).map(([k, v]) => (
                  <Section key={k} title={k}>
                    {v}
                  </Section>
                ))}
              <div className="mt-3 flex flex-wrap gap-3 text-xs items-center">
                <a
                  href={`https://github.com/${app.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B486F9] font-semibold hover:underline"
                >
                  @{app.github}
                </a>
                {app.email && (
                  <a
                    href={`mailto:${app.email}`}
                    className="text-[#1E1E1E] font-semibold hover:text-[#B486F9] transition-colors inline-flex items-center gap-1"
                  >
                    <span className="text-emerald-500">✓</span>
                    {app.email}
                  </a>
                )}
                {app.portfolio && (
                  <a
                    href={app.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B486F9] font-semibold hover:underline"
                  >
                    포트폴리오 →
                  </a>
                )}
                <span className="text-gray-400">
                  {new Date(app.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>
              {/* Admin-only note editor — for interview prep, review, etc. */}
              <ApplicationNoteEditor
                key={app.id}
                value={app.adminNote ?? ""}
                onSave={(note) => onSaveNote(app.id, note)}
              />
            </div>
            <button
              onClick={() => onDelete(app.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

function RolesTab({
  roles,
  onToggle,
  onSave,
  onCreate,
  onDelete,
}: {
  roles: Role[];
  onToggle: (slug: string, open: boolean) => void;
  onSave: (slug: string, patch: Partial<Role>) => void | Promise<void>;
  onCreate: (role: Role) => Promise<boolean>;
  onDelete: (slug: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          총 <span className="font-bold text-[#1E1E1E]">{roles.length}</span> 개 직군
        </p>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B486F9] text-white text-sm font-bold hover:bg-[#9A6FE0] transition-colors shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          직군 추가
        </button>
      </div>

      {roles.map((role) => (
        <RoleRow
          key={role.slug}
          role={role}
          editing={editing === role.slug}
          onStartEdit={() => setEditing(role.slug)}
          onCancelEdit={() => setEditing(null)}
          onToggle={(open) => onToggle(role.slug, open)}
          onSave={async (patch) => {
            await onSave(role.slug, patch);
            setEditing(null);
          }}
          onDelete={() => onDelete(role.slug)}
        />
      ))}

      {creating && (
        <RoleCreateModal
          onClose={() => setCreating(false)}
          onCreate={async (role) => {
            const ok = await onCreate(role);
            if (ok) setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function RoleRow({
  role,
  editing,
  onStartEdit,
  onCancelEdit,
  onToggle,
  onSave,
  onDelete,
}: {
  role: Role;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onToggle: (open: boolean) => void;
  onSave: (patch: Partial<Role>) => Promise<void>;
  onDelete: () => void;
}) {
  const effectiveOpen = computeEffectiveOpen(role);

  if (!editing) {
    return (
      <div
        className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm"
        style={{ borderLeftWidth: 4, borderLeftColor: role.color }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: role.color }}
              >
                {role.label}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                /apply/{role.slug}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  effectiveOpen
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {effectiveOpen ? "모집 중" : "모집 마감"}
              </span>
            </div>
            <h3 className="mt-1 text-base font-black text-[#1E1E1E]">
              {role.title || role.label}
            </h3>
            {role.subtitle && (
              <p className="mt-0.5 text-sm text-gray-500">{role.subtitle}</p>
            )}
            {role.stack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {role.stack.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {(role.openAt || role.closeAt) && (
              <p className="mt-2 text-[11px] text-gray-400">
                {role.openAt && (
                  <>오픈: {formatDateTime(role.openAt)} </>
                )}
                {role.closeAt && (
                  <>· 마감: {formatDateTime(role.closeAt)}</>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={() => onToggle(!role.open)}
              role="switch"
              aria-checked={role.open}
              title={role.open ? "수동 모집 OFF" : "수동 모집 ON"}
              className={`inline-flex items-center shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors ${
                role.open ? "bg-[#B486F9] justify-end" : "bg-gray-300 justify-start"
              }`}
            >
              <span className="block w-6 h-6 rounded-full bg-white shadow" />
            </button>
            <div className="flex gap-1">
              <button
                onClick={onStartEdit}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                편집
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleEditor
      role={role}
      onCancel={onCancelEdit}
      onSave={onSave}
      isCreate={false}
    />
  );
}

function RoleEditor({
  role,
  onCancel,
  onSave,
  isCreate,
}: {
  role: Role;
  onCancel: () => void;
  onSave: (patch: Partial<Role>) => Promise<void> | void;
  isCreate: boolean;
}) {
  const [slug, setSlug] = useState(role.slug);
  const [label, setLabel] = useState(role.label);
  const [color, setColor] = useState(role.color);
  const [title, setTitle] = useState(role.title);
  const [subtitle, setSubtitle] = useState(role.subtitle);
  const [intro, setIntro] = useState(role.intro);
  const [stack, setStack] = useState<string[]>(role.stack);
  const [stackInput, setStackInput] = useState("");
  const [talents, setTalents] = useState<RoleTalent[]>(role.talents);
  const [open, setOpen] = useState(role.open);
  const [openAt, setOpenAt] = useState(toLocalInput(role.openAt ?? null));
  const [closeAt, setCloseAt] = useState(toLocalInput(role.closeAt ?? null));
  const [saving, setSaving] = useState(false);

  function addStackTag() {
    const v = stackInput.trim();
    if (!v || stack.includes(v)) return;
    setStack([...stack, v]);
    setStackInput("");
  }

  function removeStackTag(s: string) {
    setStack(stack.filter((x) => x !== s));
  }

  function addTalent() {
    setTalents([...talents, { title: "", desc: "" }]);
  }

  function updateTalent(i: number, patch: Partial<RoleTalent>) {
    setTalents(talents.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function removeTalent(i: number) {
    setTalents(talents.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        ...(isCreate ? { slug } : {}),
        label,
        color,
        title,
        subtitle,
        intro,
        stack,
        talents,
        open,
        openAt: openAt ? fromLocalInput(openAt) : null,
        closeAt: closeAt ? fromLocalInput(closeAt) : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-5"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-[#1E1E1E]">
          {isCreate ? "새 직군 추가" : `${role.label} 편집`}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#B486F9] hover:bg-[#9A6FE0] disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="이름 (label)" hint="예: iOS, Backend, 디자인">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </Field>
        <Field label="Slug (URL)" hint="영문/숫자/하이픈만">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!isCreate}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="ios"
          />
        </Field>
        <Field label="제목 (title)" hint="상세 페이지 큰 헤딩">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            placeholder="iOS Developer"
          />
        </Field>
        <Field label="한 줄 소개 (subtitle)">
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            placeholder="Swift로 Apple 생태계의 앱을 만들어요."
          />
        </Field>
        <Field label="대표 색상" hint="HEX 값">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono"
            />
          </div>
        </Field>
        <Field label="모집 상태">
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              role="switch"
              aria-checked={open}
              className={`inline-flex items-center shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors ${
                open ? "bg-[#B486F9] justify-end" : "bg-gray-300 justify-start"
              }`}
            >
              <span className="block w-6 h-6 rounded-full bg-white shadow" />
            </button>
            <span className="text-sm font-semibold text-gray-600">
              {open ? "수동 모집 ON" : "수동 모집 OFF"}
            </span>
          </div>
        </Field>
      </div>

      <Field label="상세 설명 (intro)">
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none"
          placeholder="UIKit·SwiftUI·Combine으로 사용자가 오래 쓰고 싶어지는 앱을 만들어요..."
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="모집 시작 시간 (선택)" hint="이 시각 이전엔 자동 마감">
          <input
            type="datetime-local"
            value={openAt}
            onChange={(e) => setOpenAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </Field>
        <Field label="모집 마감 시간 (선택)" hint="이 시각 이후엔 자동 마감">
          <input
            type="datetime-local"
            value={closeAt}
            onChange={(e) => setCloseAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </Field>
      </div>

      <Field label="기술 스택 태그">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {stack.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-xs font-bold text-gray-700"
            >
              {s}
              <button
                type="button"
                onClick={() => removeStackTag(s)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={stackInput}
            onChange={(e) => setStackInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStackTag();
              }
            }}
            placeholder="태그 입력 후 Enter"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
          <button
            type="button"
            onClick={addStackTag}
            className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200"
          >
            추가
          </button>
        </div>
      </Field>

      <Field label="인재상 (talents)">
        <div className="space-y-2">
          {talents.map((t, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400">
                  0{i + 1}
                </span>
                <input
                  value={t.title}
                  onChange={(e) => updateTalent(i, { title: e.target.value })}
                  placeholder="제목"
                  className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-sm font-bold bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeTalent(i)}
                  className="text-gray-400 hover:text-red-500 text-lg"
                >
                  ×
                </button>
              </div>
              <textarea
                value={t.desc}
                onChange={(e) => updateTalent(i, { desc: e.target.value })}
                placeholder="설명"
                rows={2}
                className="w-full px-2 py-1.5 rounded border border-gray-300 text-xs bg-white resize-none"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addTalent}
            className="w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs font-bold text-gray-500 hover:border-[#B486F9] hover:text-[#B486F9]"
          >
            + 인재상 추가
          </button>
        </div>
      </Field>
    </div>
  );
}

function RoleCreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (role: Role) => void | Promise<void>;
}) {
  const blank: Role = {
    slug: "",
    label: "",
    color: "#B486F9",
    bg: "from-gray-50 to-gray-100",
    title: "",
    subtitle: "",
    intro: "",
    stack: [],
    talents: [],
    open: true,
    openAt: null,
    closeAt: null,
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#F5F7FA] p-2"
      >
        <RoleEditor
          role={blank}
          onCancel={onClose}
          onSave={async (patch) => {
            await onCreate({ ...blank, ...patch } as Role);
          }}
          isCreate
        />
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      {hint && <p className="text-[10px] text-gray-400 mb-1">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ---- helpers ----

function computeEffectiveOpen(role: Role): boolean {
  if (!role.open) return false;
  const now = new Date();
  if (role.openAt && now < new Date(role.openAt)) return false;
  if (role.closeAt && now >= new Date(role.closeAt)) return false;
  return true;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  // Treat the datetime-local value as the user's local timezone and convert to ISO
  const d = new Date(local);
  return d.toISOString();
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MembersTab({
  members,
  meta,
  onUpdate,
  onToggleHidden,
  onDeleteExtra,
  onAddExtra,
}: {
  members: Member[];
  meta: MembersMetaFile;
  onUpdate: (login: string, patch: { name?: string; role?: string; generation?: number | null; leader?: boolean }) => void;
  onToggleHidden: (login: string) => void;
  onDeleteExtra: (login: string) => void;
  onAddExtra: (form: { login: string; name: string; role: string; avatar: string; generation?: number; leader?: boolean }) => void;
}) {
  const extraLogins = new Set(meta.extra.map((e) => e.login.toLowerCase()));
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [generationFilter, setGenerationFilter] = useState<string>("all");
  const [leaderOnly, setLeaderOnly] = useState(false);

  // Build role chips
  const roleOrder = ["iOS", "Android", "Backend", "Flutter", "DevOps", "Design", "Member"];
  const countsByRole: Record<string, number> = {};
  for (const m of members) {
    countsByRole[m.role] = (countsByRole[m.role] ?? 0) + 1;
  }
  const chips: { value: string; label: string; count: number; color?: string }[] = [
    { value: "all", label: "전체", count: members.length },
  ];
  for (const r of roleOrder) {
    if (countsByRole[r]) {
      chips.push({
        value: r,
        label: r,
        count: countsByRole[r],
        color: ROLE_COLOR[r],
      });
    }
  }
  // Any other unexpected roles
  for (const [r, c] of Object.entries(countsByRole)) {
    if (!roleOrder.includes(r)) {
      chips.push({ value: r, label: r, count: c });
    }
  }

  // Build generation chips (only generations that exist in data)
  const generations = Array.from(
    new Set(
      members
        .map((m) => m.generation)
        .filter((g): g is number => typeof g === "number"),
    ),
  ).sort((a, b) => b - a);
  const leaderCount = members.filter((m) => m.leader).length;

  // Apply filter + search
  const q = query.trim().toLowerCase();
  const filtered = members.filter((m) => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (generationFilter !== "all") {
      const g = parseInt(generationFilter, 10);
      if (m.generation !== g) return false;
    }
    if (leaderOnly && !m.leader) return false;
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.github.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Controls card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">
              MEMBERS
            </p>
            <h3 className="mt-1 text-lg font-black text-[#1E1E1E]">
              총 {members.length}명
            </h3>
          </div>
          <AddExtraMemberForm onAdd={onAddExtra} />
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, GitHub 아이디, 직군으로 검색"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#B486F9] transition-colors"
          />
        </div>

        {/* Role chips */}
        <div>
          <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase mb-1.5">
            직군
          </p>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const active = roleFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => setRoleFilter(chip.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    active
                      ? "bg-[#1E1E1E] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {chip.color && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: active ? "#fff" : chip.color,
                      }}
                    />
                  )}
                  {chip.label}
                  <span
                    className={`tabular-nums text-[10px] ${
                      active ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generation chips */}
        {generations.length > 0 && (
          <div>
            <p className="text-[9px] font-black tracking-[0.18em] text-gray-400 uppercase mb-1.5">
              기수
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setGenerationFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  generationFilter === "all"
                    ? "bg-[#1E1E1E] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                전체
              </button>
              {generations.map((g) => {
                const active = generationFilter === String(g);
                const count = members.filter((m) => m.generation === g).length;
                return (
                  <button
                    key={g}
                    onClick={() => setGenerationFilter(String(g))}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      active
                        ? "bg-[#1E1E1E] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {g}기
                    <span
                      className={`tabular-nums text-[10px] ${
                        active ? "text-white/70" : "text-gray-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Leader toggle */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-dashed border-gray-200">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#B486F9">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-xs font-bold text-[#1E1E1E]">
              리더만 보기
            </span>
            <span className="text-[11px] text-gray-400 tabular-nums">
              {leaderCount}명
            </span>
          </div>
          <button
            onClick={() => setLeaderOnly(!leaderOnly)}
            role="switch"
            aria-checked={leaderOnly}
            className={`inline-flex items-center shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${
              leaderOnly
                ? "bg-[#B486F9] justify-end"
                : "bg-gray-300 justify-start"
            }`}
          >
            <span className="block w-5 h-5 rounded-full bg-white shadow" />
          </button>
        </div>
      </div>

      {/* Hidden members */}
      {meta.hidden.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-[10px] font-black tracking-[0.18em] text-gray-400 uppercase mb-3">
            Hidden ({meta.hidden.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {meta.hidden.map((login) => (
              <button
                key={login}
                onClick={() => onToggleHidden(login)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 hover:bg-[#B486F9]/10 hover:text-[#B486F9] transition-colors"
              >
                @{login}
                <span className="text-[10px] font-bold">↺ 복구</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Member list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm">조건에 맞는 멤버가 없어요.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {filtered.map((m) => (
            <MemberRow
              key={m.github}
              member={m}
              isExtra={extraLogins.has(m.github.toLowerCase())}
              onUpdate={onUpdate}
              onToggleHidden={onToggleHidden}
              onDeleteExtra={onDeleteExtra}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  isExtra,
  onUpdate,
  onToggleHidden,
  onDeleteExtra,
}: {
  member: Member;
  isExtra: boolean;
  onUpdate: (login: string, patch: { name?: string; role?: string; generation?: number | null; leader?: boolean }) => void;
  onToggleHidden: (login: string) => void;
  onDeleteExtra: (login: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [generation, setGeneration] = useState<string>(
    member.generation ? String(member.generation) : "",
  );
  const [leader, setLeader] = useState<boolean>(!!member.leader);

  function save() {
    onUpdate(member.github, {
      name,
      role,
      generation: generation === "" ? null : parseInt(generation, 10),
      leader,
    });
    setEditing(false);
  }

  const roleColor = ROLE_COLOR[member.role] ?? "#6B7280";

  return (
    <div className="flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.avatar}
          alt={member.name}
          className="w-11 h-11 rounded-full ring-2 ring-white"
        />
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
          style={{ background: roleColor }}
        />
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-black tracking-wider text-gray-400 uppercase mb-0.5">
                  이름
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-bold bg-white focus:outline-none focus:border-[#B486F9]"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black tracking-wider text-gray-400 uppercase mb-0.5">
                  직군
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#B486F9]"
                >
                  {["iOS", "Android", "Backend", "Flutter", "DevOps", "Design", "Member"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black tracking-wider text-gray-400 uppercase mb-0.5">
                  기수
                </label>
                <input
                  value={generation}
                  onChange={(e) => setGeneration(e.target.value)}
                  placeholder="예: 7"
                  inputMode="numeric"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#B486F9]"
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={leader}
                onChange={(e) => setLeader(e.target.checked)}
                className="w-4 h-4 accent-[#B486F9]"
              />
              <span className="text-xs font-bold text-[#1E1E1E]">리더</span>
            </label>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-black text-sm text-[#1E1E1E]">{member.name}</p>
              <span
                className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  color: roleColor,
                  background: `${roleColor}12`,
                }}
              >
                {member.role.toUpperCase()}
              </span>
              {member.generation != null && !member.leader && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                  {member.generation}기
                </span>
              )}
              {member.leader && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-[#B486F9]/10 text-[#B486F9] rounded-md">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {member.generation != null ? `${member.generation}기 리더` : "리더"}
                </span>
              )}
              {isExtra && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold">
                  EXTRA
                </span>
              )}
            </div>
            <a
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-block text-[11px] text-gray-400 font-mono hover:text-[#B486F9] transition-colors"
            >
              @{member.github}
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {editing ? (
          <>
            <button
              onClick={() => {
                setEditing(false);
                setName(member.name);
                setRole(member.role);
                setGeneration(
                  member.generation ? String(member.generation) : "",
                );
                setLeader(!!member.leader);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={save}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#B486F9] hover:bg-[#9A6FE0] transition-colors"
            >
              저장
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-white transition-colors"
            >
              수정
            </button>
            {isExtra ? (
              <button
                onClick={() => onDeleteExtra(member.github)}
                title="삭제"
                className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => onToggleHidden(member.github)}
                title="숨김"
                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#B486F9] flex items-center justify-center transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AddExtraMemberForm({
  onAdd,
}: {
  onAdd: (form: {
    login: string;
    name: string;
    role: string;
    avatar: string;
    generation?: number;
    leader?: boolean;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("iOS");
  const [avatar, setAvatar] = useState("");
  const [generation, setGeneration] = useState("");
  const [leader, setLeader] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      login,
      name,
      role,
      avatar,
      generation: generation === "" ? undefined : parseInt(generation, 10),
      leader: leader || undefined,
    });
    setLogin("");
    setName("");
    setRole("iOS");
    setAvatar("");
    setGeneration("");
    setLeader(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B486F9] text-white text-sm font-bold shadow-sm hover:bg-[#9A6FE0] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        멤버 추가
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full sm:w-auto p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3"
    >
      <p className="text-xs font-black tracking-wider text-gray-500 uppercase">
        외부 멤버 추가
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="GitHub login (예: xixn2)"
          required
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#B486F9]"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="한글 이름"
          required
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#B486F9]"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#B486F9]"
        >
          {["iOS", "Android", "Backend", "Flutter", "DevOps", "Design"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input
          value={generation}
          onChange={(e) => setGeneration(e.target.value)}
          placeholder="기수 (예: 7)"
          inputMode="numeric"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#B486F9]"
        />
        <input
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="아바타 URL (https://...)"
          required
          className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#B486F9]"
        />
      </div>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={leader}
          onChange={(e) => setLeader(e.target.checked)}
          className="w-4 h-4 accent-[#B486F9]"
        />
        <span className="text-xs font-bold text-[#1E1E1E]">리더</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#B486F9] text-white text-sm font-bold hover:bg-[#9A6FE0] transition-colors"
        >
          추가
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
        {title}
      </p>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-all">
        {children}
      </p>
    </div>
  );
}

function FormTab({
  config,
  reload,
}: {
  config: FormConfig;
  reload: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function toggleEmailAuth(value: boolean) {
    await fetch("/api/form-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requireEmailAuth: value }),
    });
    reload();
  }

  async function togglePrivacy(value: boolean) {
    await fetch("/api/form-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        privacyPolicy: { ...config.privacyPolicy, enabled: value },
      }),
    });
    reload();
  }

  async function updatePrivacy(summary: string, details: string) {
    await fetch("/api/form-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        privacyPolicy: { ...config.privacyPolicy, summary, details },
      }),
    });
    reload();
  }

  async function toggleFieldRequired(id: string, required: boolean) {
    await fetch(`/api/form-config/fields/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ required }),
    });
    reload();
  }

  async function toggleFieldHidden(id: string, hidden: boolean) {
    await fetch(`/api/form-config/fields/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    reload();
  }

  async function updateField(id: string, patch: Partial<FormField>) {
    const res = await fetch(`/api/form-config/fields/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "저장 실패");
      return;
    }
    reload();
  }

  async function deleteField(id: string) {
    if (!confirm("정말 삭제할까요?")) return;
    const res = await fetch(`/api/form-config/fields/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "삭제 실패");
      return;
    }
    reload();
  }

  async function duplicateField(id: string) {
    const res = await fetch(`/api/form-config/fields/${id}/duplicate`, {
      method: "POST",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "복제 실패");
      return;
    }
    reload();
  }

  async function moveField(id: string, dir: "up" | "down") {
    const ids = config.fields.map((f) => f.id);
    const idx = ids.indexOf(id);
    if (idx === -1) return;
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;
    [ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]];
    const res = await fetch("/api/form-config/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "순서 변경 실패");
      return;
    }
    reload();
  }

  async function addField(field: Partial<FormField> & { id: string; label: string; type: string }) {
    const res = await fetch("/api/form-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(field),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "추가 실패");
      return;
    }
    setAddOpen(false);
    reload();
  }

  return (
    <div className="space-y-8">
      {/* Settings */}
      <section className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8">
        <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">
          SETTINGS
        </p>
        <h3 className="mt-2 text-xl font-black text-[#1E1E1E]">폼 설정</h3>
        <div className="mt-5 space-y-3">
          <SettingRow
            label="학생 인증 필수"
            desc="Google 로그인은 항상 필수. 켜면 @gsm.hs.kr 계정만 허용해요."
            enabled={config.requireEmailAuth}
            onToggle={toggleEmailAuth}
          />
          <SettingRow
            label="개인정보 수집 동의"
            desc="지원서 제출 시 개인정보 수집 동의 체크박스 표시"
            enabled={config.privacyPolicy.enabled}
            onToggle={togglePrivacy}
          />
          <button
            onClick={() => setPrivacyOpen(true)}
            className="w-full text-left p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <p className="text-sm font-bold text-[#1E1E1E]">
              개인정보 방침 편집 →
            </p>
            <p className="mt-1 text-xs text-gray-500 line-clamp-1">
              {config.privacyPolicy.summary}
            </p>
          </button>
        </div>
      </section>

      {/* Fields */}
      <section className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">
              FIELDS
            </p>
            <h3 className="mt-2 text-xl font-black text-[#1E1E1E]">
              지원폼 필드 ({config.fields.length})
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              지원자가 작성하는 폼의 필드를 추가·수정·정렬할 수 있어요.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              미리보기
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B486F9] text-white text-sm font-bold hover:bg-[#9A6FE0] transition-colors shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              필드 추가
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {config.fields.map((field, idx) => (
            <FieldRow
              key={field.id}
              field={field}
              isFirst={idx === 0}
              isLast={idx === config.fields.length - 1}
              onToggleRequired={(v) => toggleFieldRequired(field.id, v)}
              onToggleHidden={(v) => toggleFieldHidden(field.id, v)}
              onUpdate={(patch) => updateField(field.id, patch)}
              onDelete={() => deleteField(field.id)}
              onDuplicate={() => duplicateField(field.id)}
              onMoveUp={() => moveField(field.id, "up")}
              onMoveDown={() => moveField(field.id, "down")}
            />
          ))}
        </div>
      </section>

      {addOpen && (
        <AddFieldModal onAdd={addField} onClose={() => setAddOpen(false)} />
      )}
      {privacyOpen && (
        <PrivacyEditModal
          summary={config.privacyPolicy.summary}
          details={config.privacyPolicy.details}
          onSave={(s, d) => {
            updatePrivacy(s, d);
            setPrivacyOpen(false);
          }}
          onClose={() => setPrivacyOpen(false)}
        />
      )}
      {previewOpen && (
        <FormPreviewModal
          config={config}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

function FormPreviewModal({
  config,
  onClose,
}: {
  config: FormConfig;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 shrink-0">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#B486F9]">
              PREVIEW
            </p>
            <h3 className="text-lg font-black text-[#1E1E1E]">
              지원폼 미리보기
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 bg-[#FFF8EE]">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-6">
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#F5A623]/10 text-[#F5A623] font-bold text-[10px] tracking-[0.18em]">
                APPLY
              </span>
              <h2 className="mt-3 text-2xl font-black text-[#1E1E1E]">
                지원서 작성
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                지원자가 보게 될 화면이에요
              </p>
            </div>

            {/* Google login indicator (always required) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-amber-200 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1E1E1E]">
                    Google 로그인 필요
                  </p>
                  <p className="text-xs text-gray-500">
                    {config.requireEmailAuth
                      ? "@gsm.hs.kr 계정으로 로그인 후 작성할 수 있어요"
                      : "Google 계정으로 로그인 후 작성할 수 있어요"}
                  </p>
                </div>
              </div>
            </div>

            {/* Field previews */}
            {config.fields
              .filter((f) => !f.hidden)
              .map((field) => (
                <PreviewField key={field.id} field={field} />
              ))}

            {/* Privacy consent */}
            {config.privacyPolicy.enabled && (
              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    disabled
                    className="mt-0.5 w-4 h-4 accent-[#F5A623]"
                  />
                  <div className="flex-1 text-sm text-gray-600">
                    <span className="font-semibold text-[#1E1E1E]">
                      개인정보 수집 및 이용에 동의합니다.
                    </span>{" "}
                    <span className="text-[#F5A623] font-semibold underline">
                      자세히 보기
                    </span>
                    {config.privacyPolicy.summary && (
                      <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                        {config.privacyPolicy.summary}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            )}

            <button
              type="button"
              disabled
              className="w-full px-6 py-4 rounded-2xl bg-[#F5A623] text-white text-base font-black opacity-80 cursor-not-allowed"
            >
              지원서 제출하기
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-white text-[11px] text-gray-400 text-center">
          이 미리보기는 실제로 제출되지 않아요. 닫기: ESC 또는 바깥 클릭
        </div>
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  const baseInput =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 cursor-not-allowed";

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2 tracking-wider">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      {field.helpText && (
        <p className="text-[11px] text-gray-400 mb-2">{field.helpText}</p>
      )}

      {field.type === "textarea" ? (
        <textarea
          disabled
          rows={4}
          placeholder={field.placeholder}
          className={`${baseInput} resize-none`}
        />
      ) : field.type === "role" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {["iOS", "Android", "Backend", "Flutter", "DevOps", "Design"].map(
            (r) => (
              <div
                key={r}
                className="px-4 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 text-center bg-white"
              >
                {r}
              </div>
            ),
          )}
        </div>
      ) : (
        <input
          disabled
          type={field.type === "url" ? "url" : "text"}
          placeholder={field.placeholder}
          className={baseInput}
        />
      )}

      {(field.minLength || field.maxLength) && (
        <p className="mt-1 text-[10px] text-gray-400">
          {field.minLength ?? 0} ~ {field.maxLength ?? "∞"}자
        </p>
      )}
    </div>
  );
}

function SettingRow({
  label,
  desc,
  enabled,
  onToggle,
}: {
  label: string;
  desc: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#1E1E1E]">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        role="switch"
        aria-checked={enabled}
        className={`inline-flex items-center shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors ${
          enabled ? "bg-[#B486F9] justify-end" : "bg-gray-300 justify-start"
        }`}
      >
        <span className="block w-6 h-6 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}

function FieldRow({
  field,
  isFirst,
  isLast,
  onToggleRequired,
  onToggleHidden,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  field: FormField;
  isFirst: boolean;
  isLast: boolean;
  onToggleRequired: (v: boolean) => void;
  onToggleHidden: (v: boolean) => void;
  onUpdate: (patch: Partial<FormField>) => void | Promise<void>;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-opacity ${
        field.hidden
          ? "bg-gray-100/50 border-gray-200 opacity-60"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* Summary row */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            title="위로"
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-[#B486F9] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            title="아래로"
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-[#B486F9] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-bold text-[#1E1E1E] hover:text-[#B486F9]"
            >
              {field.label}
            </button>
            <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-bold text-gray-500 border border-gray-200">
              {field.type}
            </span>
            {field.builtin && (
              <span className="px-2 py-0.5 rounded-md bg-[#B486F9]/10 text-[10px] font-bold text-[#B486F9]">
                builtin
              </span>
            )}
            {field.hidden && (
              <span className="px-2 py-0.5 rounded-md bg-gray-200 text-[10px] font-bold text-gray-600 inline-flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                숨김
              </span>
            )}
            {field.required && !field.hidden && (
              <span className="px-2 py-0.5 rounded-md bg-red-50 text-[10px] font-bold text-red-500">
                필수
              </span>
            )}
            {(field.minLength || field.maxLength) && (
              <span className="text-[10px] text-gray-400">
                {field.minLength ?? 0}~{field.maxLength ?? "∞"}자
              </span>
            )}
            {field.pattern && (
              <span className="text-[10px] text-gray-400 font-mono">
                /{field.pattern.slice(0, 12)}{field.pattern.length > 12 ? "..." : ""}/
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400 font-mono">{field.id}</p>
          {field.helpText && (
            <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">
              💡 {field.helpText}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-gray-500">필수</span>
          <button
            onClick={() => onToggleRequired(!field.required)}
            role="switch"
            aria-checked={field.required}
            className={`inline-flex items-center shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${
              field.required ? "bg-[#B486F9] justify-end" : "bg-gray-300 justify-start"
            }`}
          >
            <span className="block w-5 h-5 rounded-full bg-white shadow" />
          </button>
        </label>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "접기" : "편집"}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-white transition-colors"
          >
            {expanded ? "접기" : "편집"}
          </button>
          <button
            onClick={() => onToggleHidden(!field.hidden)}
            title={field.hidden ? "보이기" : "숨기기"}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              field.hidden
                ? "text-[#B486F9] bg-[#B486F9]/10 hover:bg-[#B486F9]/20"
                : "text-gray-500 hover:bg-white hover:text-[#B486F9]"
            }`}
          >
            {field.hidden ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          <button
            onClick={onDuplicate}
            title="복제"
            className="w-7 h-7 rounded-lg text-gray-500 hover:bg-white hover:text-[#B486F9] flex items-center justify-center transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
          {!field.builtin && (
            <button
              onClick={onDelete}
              title="삭제"
              className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <FieldEditor
          field={field}
          onCancel={() => setExpanded(false)}
          onSave={async (patch) => {
            await onUpdate(patch);
            setExpanded(false);
          }}
        />
      )}
    </div>
  );
}

function FieldEditor({
  field,
  onCancel,
  onSave,
}: {
  field: FormField;
  onCancel: () => void;
  onSave: (patch: Partial<FormField>) => Promise<void> | void;
}) {
  const [label, setLabel] = useState(field.label);
  const [type, setType] = useState<FormField["type"]>(field.type);
  const [placeholder, setPlaceholder] = useState(field.placeholder ?? "");
  const [helpText, setHelpText] = useState(field.helpText ?? "");
  const [pattern, setPattern] = useState(field.pattern ?? "");
  const [patternError, setPatternError] = useState(field.patternError ?? "");
  const [minLength, setMinLength] = useState(
    field.minLength != null ? String(field.minLength) : "",
  );
  const [maxLength, setMaxLength] = useState(
    field.maxLength != null ? String(field.maxLength) : "",
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const patch: Partial<FormField> = {
        label,
        placeholder,
        helpText,
        pattern,
        patternError,
        minLength: minLength ? parseInt(minLength, 10) : 0,
        maxLength: maxLength ? parseInt(maxLength, 10) : 0,
      };
      // Builtin fields can't change type
      if (!field.builtin) {
        patch.type = type;
      }
      await onSave(patch);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="라벨" hint="지원자에게 보이는 이름">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </Field>
        <Field label="타입" hint={field.builtin ? "builtin 필드는 변경 불가" : ""}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FormField["type"])}
            disabled={field.builtin}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="text">text — 한 줄 텍스트</option>
            <option value="textarea">textarea — 여러 줄</option>
            <option value="url">url — 링크</option>
            <option value="username">username — URL 금지 아이디</option>
            <option value="role">role — 직군 선택</option>
          </select>
        </Field>
      </div>

      <Field label="플레이스홀더" hint="입력 칸의 회색 안내 텍스트">
        <input
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          placeholder="예: 홍길동"
        />
      </Field>

      <Field label="도움말" hint="라벨 아래 작은 설명 (지원자에게 안내)">
        <input
          value={helpText}
          onChange={(e) => setHelpText(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          placeholder="예: GitHub 아이디만 입력해주세요 (URL 안 됨)"
        />
      </Field>

      {(type === "text" || type === "textarea" || type === "username") && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="최소 글자수" hint="0이면 제한 없음">
            <input
              type="number"
              min={0}
              value={minLength}
              onChange={(e) => setMinLength(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              placeholder="0"
            />
          </Field>
          <Field label="최대 글자수" hint="0이면 제한 없음">
            <input
              type="number"
              min={0}
              value={maxLength}
              onChange={(e) => setMaxLength(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              placeholder="0"
            />
          </Field>
        </div>
      )}

      <Field label="정규식 (선택)" hint="입력값을 정규식으로 검증 (예: ^[A-Z0-9]+$)">
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono"
          placeholder="^[a-zA-Z0-9_-]+$"
        />
      </Field>

      {pattern && (
        <Field label="정규식 오류 메시지" hint="검증 실패 시 표시되는 메시지">
          <input
            value={patternError}
            onChange={(e) => setPatternError(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            placeholder="형식이 올바르지 않아요."
          />
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-[#B486F9] hover:bg-[#9A6FE0] disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

function AddFieldModal({
  onAdd,
  onClose,
}: {
  onAdd: (f: Partial<FormField> & { id: string; label: string; type: string }) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FormField["type"]>("text");
  const [required, setRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [pattern, setPattern] = useState("");
  const [patternError, setPatternError] = useState("");
  const [minLength, setMinLength] = useState("");
  const [maxLength, setMaxLength] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      id,
      label,
      type,
      required,
      placeholder: placeholder || undefined,
      helpText: helpText || undefined,
      pattern: pattern || undefined,
      patternError: patternError || undefined,
      minLength: minLength ? parseInt(minLength, 10) : undefined,
      maxLength: maxLength ? parseInt(maxLength, 10) : undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8 space-y-5"
      >
        <div>
          <h3 className="text-xl font-black text-[#1E1E1E]">필드 추가</h3>
          <p className="mt-1 text-xs text-gray-500">
            지원자가 작성할 새로운 입력 필드를 만들어요.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ID (영문) *" hint="API에서 사용되는 키 — 변경 불가">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              placeholder="projectExperience"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono"
            />
          </Field>
          <Field label="라벨 *" hint="지원자에게 보이는 이름">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="프로젝트 경험"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </Field>
        </div>

        <Field label="타입">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FormField["type"])}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="text">text — 한 줄 텍스트</option>
            <option value="textarea">textarea — 여러 줄</option>
            <option value="url">url — 링크</option>
            <option value="username">username — URL 금지 아이디</option>
            <option value="role">role — 직군 선택</option>
          </select>
        </Field>

        <Field label="플레이스홀더">
          <input
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="예: 본인의 GitHub 프로젝트나 학교 과제 등"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </Field>

        <Field label="도움말" hint="라벨 아래 회색 안내 텍스트">
          <input
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="예: 가장 자랑하고 싶은 프로젝트 1개를 적어주세요."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </Field>

        {(type === "text" || type === "textarea" || type === "username") && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="최소 글자수" hint="비우면 제한 없음">
              <input
                type="number"
                min={0}
                value={minLength}
                onChange={(e) => setMinLength(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </Field>
            <Field label="최대 글자수" hint="비우면 제한 없음">
              <input
                type="number"
                min={0}
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </Field>
          </div>
        )}

        <Field label="정규식 (선택)" hint="입력값 검증용 정규식">
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="^[a-zA-Z0-9_-]+$"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono"
          />
        </Field>

        {pattern && (
          <Field label="정규식 오류 메시지">
            <input
              value={patternError}
              onChange={(e) => setPatternError(e.target.value)}
              placeholder="형식이 올바르지 않아요."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </Field>
        )}

        <label className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="w-4 h-4 accent-[#B486F9]"
          />
          <span className="text-sm font-bold text-[#1E1E1E]">필수 항목</span>
        </label>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#B486F9] text-white text-sm font-bold hover:bg-[#9A6FE0] transition-colors"
          >
            추가
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

function PrivacyEditModal({
  summary,
  details,
  onSave,
  onClose,
}: {
  summary: string;
  details: string;
  onSave: (s: string, d: string) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState(summary);
  const [d, setD] = useState(details);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8 space-y-4"
      >
        <h3 className="text-xl font-black text-[#1E1E1E]">개인정보 방침 편집</h3>
        <div>
          <label className="text-xs font-bold text-gray-500">요약 (체크박스 옆에 표시)</label>
          <textarea
            value={s}
            onChange={(e) => setS(e.target.value)}
            rows={2}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500">상세 (Markdown 지원)</label>
          <textarea
            value={d}
            onChange={(e) => setD(e.target.value)}
            rows={15}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono resize-none"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(s, d)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#B486F9] text-white text-sm font-bold"
          >
            저장
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
