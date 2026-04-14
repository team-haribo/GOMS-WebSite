"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  leader?: number;
}

interface MembersMetaFile {
  byLogin: Record<string, { name: string; role: string; leader?: number }>;
  extra: { login: string; name: string; role: string; avatar: string; leader?: number }[];
  hidden: string[];
}

type RoleKey = "iOS" | "Android" | "Backend" | "Flutter" | "DevOps" | "Design";
type RoleStatus = Record<RoleKey, boolean>;

const ROLE_KEYS: RoleKey[] = ["iOS", "Android", "Backend", "Flutter", "DevOps", "Design"];
const ROLE_COLOR: Record<string, string> = {
  iOS: "#F5A623",
  Android: "#3B82F6",
  Backend: "#10B981",
  Flutter: "#06B6D4",
  DevOps: "#8B5CF6",
  Design: "#EC4899",
  Member: "#6B7280",
};

type Tab = "applications" | "members" | "roles" | "form";

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<MembersMetaFile | null>(null);
  const [roleStatus, setRoleStatus] = useState<RoleStatus | null>(null);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m, r, f] = await Promise.all([
        fetch("/api/applications").then((r) => r.json()),
        fetch("/api/members").then((r) => r.json()),
        fetch("/api/roles").then((r) => r.json()),
        fetch("/api/form-config").then((r) => r.json()),
      ]);
      setApplications(a.applications ?? []);
      setMembers(m.members ?? []);
      setMeta(m.meta ?? null);
      setRoleStatus(r.status ?? null);
      setFormConfig(f.config ?? null);
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

  async function toggleRole(role: RoleKey, open: boolean) {
    await fetch("/api/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, open }),
    });
    load();
  }

  async function updateMember(
    login: string,
    patch: { name?: string; role?: string; leader?: number | null },
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
    leader?: number;
  }) {
    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    load();
  }

  return (
    <main className="min-h-screen bg-[#FFF8EE]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/goms-logo.svg" alt="GOMS" width={32} height={32} className="rounded-lg" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#F5A623] leading-none">ADMIN</p>
              <p className="text-base font-black text-[#1E1E1E] tracking-tight leading-tight">GOMS</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white shadow-sm border border-gray-100 w-fit mb-8">
          {(
            [
              { key: "applications", label: `지원자 ${applications.length}` },
              { key: "members", label: `멤버 ${members.length}` },
              { key: "roles", label: "직군 모집" },
              { key: "form", label: "지원폼" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === key
                  ? "bg-[#F5A623] text-white shadow-md shadow-[#F5A623]/30"
                  : "text-gray-500 hover:text-[#1E1E1E]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-center text-gray-500 py-20">불러오는 중...</p>
        )}

        {!loading && tab === "applications" && (
          <ApplicationsTab
            applications={applications}
            onDelete={deleteApp}
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
        {!loading && tab === "roles" && roleStatus && (
          <RolesTab status={roleStatus} onToggle={toggleRole} />
        )}
        {!loading && tab === "form" && formConfig && (
          <FormTab config={formConfig} reload={load} />
        )}
      </div>
    </main>
  );
}

function ApplicationsTab({
  applications,
  onDelete,
}: {
  applications: Application[];
  onDelete: (id: string) => void;
}) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
        <p className="text-gray-500">아직 지원자가 없어요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
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
                  className="text-[#F5A623] font-semibold hover:underline"
                >
                  @{app.github}
                </a>
                {app.email && (
                  <a
                    href={`mailto:${app.email}`}
                    className="text-[#1E1E1E] font-semibold hover:text-[#F5A623] transition-colors inline-flex items-center gap-1"
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
                    className="text-[#F5A623] font-semibold hover:underline"
                  >
                    포트폴리오 →
                  </a>
                )}
                <span className="text-gray-400">
                  {new Date(app.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>
            </div>
            <button
              onClick={() => onDelete(app.id)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RolesTab({
  status,
  onToggle,
}: {
  status: RoleStatus;
  onToggle: (role: RoleKey, open: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {ROLE_KEYS.map((role) => {
        const open = status[role];
        return (
          <div
            key={role}
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
          >
            <div>
              <p
                className="text-xs font-bold tracking-[0.18em]"
                style={{ color: ROLE_COLOR[role] }}
              >
                {role.toUpperCase()}
              </p>
              <p className="mt-1.5 text-sm font-bold text-[#1E1E1E]">
                {open ? "모집 중" : "모집 마감"}
              </p>
            </div>
            <button
              onClick={() => onToggle(role, !open)}
              role="switch"
              aria-checked={open}
              className={`inline-flex items-center shrink-0 w-12 h-7 rounded-full p-0.5 transition-colors ${
                open ? "bg-[#F5A623] justify-end" : "bg-gray-300 justify-start"
              }`}
            >
              <span className="block w-6 h-6 rounded-full bg-white shadow" />
            </button>
          </div>
        );
      })}
    </div>
  );
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
  onUpdate: (login: string, patch: { name?: string; role?: string; leader?: number | null }) => void;
  onToggleHidden: (login: string) => void;
  onDeleteExtra: (login: string) => void;
  onAddExtra: (form: { login: string; name: string; role: string; avatar: string; leader?: number }) => void;
}) {
  const extraLogins = new Set(meta.extra.map((e) => e.login.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Add extra member */}
      <AddExtraMemberForm onAdd={onAddExtra} />

      {/* Hidden members */}
      {meta.hidden.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">
            숨김 처리된 멤버 ({meta.hidden.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {meta.hidden.map((login) => (
              <button
                key={login}
                onClick={() => onToggleHidden(login)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600 hover:bg-[#F5A623]/20 hover:text-[#F5A623] transition-colors"
              >
                {login} · 복구
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visible members */}
      <div className="space-y-2">
        {members.map((m) => (
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
  onUpdate: (login: string, patch: { name?: string; role?: string; leader?: number | null }) => void;
  onToggleHidden: (login: string) => void;
  onDeleteExtra: (login: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [leader, setLeader] = useState<string>(member.leader ? String(member.leader) : "");

  function save() {
    onUpdate(member.github, {
      name,
      role,
      leader: leader === "" ? null : parseInt(leader, 10),
    });
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.avatar}
        alt={member.name}
        className="w-10 h-10 rounded-full"
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="px-2 py-1 rounded border border-gray-300 text-sm w-24"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-2 py-1 rounded border border-gray-300 text-sm"
            >
              {["iOS", "Android", "Backend", "Flutter", "DevOps", "Design", "Member"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input
              value={leader}
              onChange={(e) => setLeader(e.target.value)}
              placeholder="기수 Leader"
              className="px-2 py-1 rounded border border-gray-300 text-sm w-20"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-[#1E1E1E]">{member.name}</p>
            <span
              className="text-[11px] font-bold"
              style={{ color: ROLE_COLOR[member.role] ?? "#6B7280" }}
            >
              {member.role}
            </span>
            {member.leader && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F5A623]/15 text-[#F5A623] rounded">
                {member.leader}기 Leader
              </span>
            )}
            {isExtra && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-semibold">
                extra
              </span>
            )}
            <span className="text-xs text-gray-400">@{member.github}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <button
              onClick={save}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#F5A623]"
            >
              저장
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setName(member.name);
                setRole(member.role);
                setLeader(member.leader ? String(member.leader) : "");
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              수정
            </button>
            {isExtra ? (
              <button
                onClick={() => onDeleteExtra(member.github)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            ) : (
              <button
                onClick={() => onToggleHidden(member.github)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50"
              >
                숨김
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
  onAdd: (form: { login: string; name: string; role: string; avatar: string; leader?: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("iOS");
  const [avatar, setAvatar] = useState("");
  const [leader, setLeader] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      login,
      name,
      role,
      avatar,
      leader: leader === "" ? undefined : parseInt(leader, 10),
    });
    setLogin("");
    setName("");
    setRole("iOS");
    setAvatar("");
    setLeader("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-[#F5A623] text-white text-sm font-bold shadow-md shadow-[#F5A623]/25 hover:bg-[#E8961A] transition-colors"
      >
        + 멤버 추가 (org 외)
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="p-5 rounded-2xl bg-white border border-gray-100 space-y-3"
    >
      <p className="text-xs font-bold text-gray-500">외부 멤버 추가 (GitHub org 멤버가 아닌 사람)</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="login (ex: xixn2)"
          required
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="한글명"
          required
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          {["iOS", "Android", "Backend", "Flutter", "DevOps", "Design"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input
          value={leader}
          onChange={(e) => setLeader(e.target.value)}
          placeholder="기수 Leader (숫자)"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
        <input
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="avatar URL (https://...)"
          required
          className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#F5A623] text-white text-sm font-bold"
        >
          추가
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500"
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

  async function updateFieldLabel(id: string, label: string) {
    await fetch(`/api/form-config/fields/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
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

  async function addField(field: {
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
  }) {
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
        <p className="text-xs font-bold tracking-[0.18em] text-[#F5A623]">
          SETTINGS
        </p>
        <h3 className="mt-2 text-xl font-black text-[#1E1E1E]">폼 설정</h3>
        <div className="mt-5 space-y-3">
          <SettingRow
            label="이메일 인증"
            desc="@gsm.hs.kr Google 로그인 필수 여부"
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#F5A623]">
              FIELDS
            </p>
            <h3 className="mt-2 text-xl font-black text-[#1E1E1E]">
              지원폼 필드 ({config.fields.length})
            </h3>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#F5A623] text-white text-sm font-bold hover:bg-[#E8961A] transition-colors"
          >
            + 필드 추가
          </button>
        </div>
        <div className="space-y-2">
          {config.fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              onToggleRequired={(v) => toggleFieldRequired(field.id, v)}
              onUpdateLabel={(label) => updateFieldLabel(field.id, label)}
              onDelete={() => deleteField(field.id)}
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
          enabled ? "bg-[#F5A623] justify-end" : "bg-gray-300 justify-start"
        }`}
      >
        <span className="block w-6 h-6 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}

function FieldRow({
  field,
  onToggleRequired,
  onUpdateLabel,
  onDelete,
}: {
  field: FormField;
  onToggleRequired: (v: boolean) => void;
  onUpdateLabel: (label: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(field.label);

  function save() {
    if (label.trim() && label !== field.label) onUpdateLabel(label.trim());
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setLabel(field.label);
                setEditing(false);
              }
            }}
            autoFocus
            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-bold bg-white"
          />
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-bold text-[#1E1E1E] hover:text-[#F5A623]"
            >
              {field.label}
            </button>
            <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-bold text-gray-500 border border-gray-200">
              {field.type}
            </span>
            {field.builtin && (
              <span className="px-2 py-0.5 rounded-md bg-[#F5A623]/10 text-[10px] font-bold text-[#F5A623]">
                builtin
              </span>
            )}
            {(field.minLength || field.maxLength) && (
              <span className="text-[10px] text-gray-400">
                {field.minLength ?? 0}~{field.maxLength ?? "∞"}자
              </span>
            )}
          </div>
        )}
        <p className="mt-0.5 text-[11px] text-gray-400 font-mono">{field.id}</p>
      </div>
      <label className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-gray-500">필수</span>
        <button
          onClick={() => onToggleRequired(!field.required)}
          role="switch"
          aria-checked={field.required}
          className={`inline-flex items-center shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${
            field.required ? "bg-[#F5A623] justify-end" : "bg-gray-300 justify-start"
          }`}
        >
          <span className="block w-5 h-5 rounded-full bg-white shadow" />
        </button>
      </label>
      {!field.builtin && (
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 shrink-0"
        >
          삭제
        </button>
      )}
    </div>
  );
}

function AddFieldModal({
  onAdd,
  onClose,
}: {
  onAdd: (f: {
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
  }) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("text");
  const [required, setRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
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
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 space-y-4"
      >
        <h3 className="text-xl font-black text-[#1E1E1E]">필드 추가</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500">
              ID (영문) <span className="text-red-500">*</span>
            </label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              placeholder="myField"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">
              라벨 <span className="text-red-500">*</span>
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="프로젝트 경험"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">타입</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option value="text">text (한 줄)</option>
              <option value="textarea">textarea (여러 줄)</option>
              <option value="url">url (링크)</option>
              <option value="username">username (아이디, URL 금지)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">플레이스홀더</label>
            <input
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>
          {type === "textarea" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-500">최소 글자수</label>
                <input
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">최대 글자수</label>
                <input
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 accent-[#F5A623]"
            />
            <span className="text-sm font-bold text-[#1E1E1E]">필수 항목</span>
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#F5A623] text-white text-sm font-bold"
          >
            추가
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500"
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#F5A623] text-white text-sm font-bold"
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
