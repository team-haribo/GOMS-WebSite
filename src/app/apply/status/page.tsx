"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

// The `Window.google` global is declared in src/components/ApplyForm.tsx.
// Both files render the Google Identity Services button so they share the
// same shape — augmenting it again here would conflict with that decl.

type ApplicationStatus =
  | "new"
  | "reviewing"
  | "passed"
  | "rejected"
  | "hired";

interface MyApplication {
  id: string;
  name?: string;
  role?: string;
  status: ApplicationStatus;
  createdAt: string;
  statusUpdatedAt?: string;
  source: "live" | "archive";
  batchTitle?: string;
  batchClosedAt?: string;
}

// ────────────────────────────────────────────────────────────────────
// Toss-style design tokens
// ────────────────────────────────────────────────────────────────────
// Toss uses very few colors with strong contrast — light gray bg, white
// cards, near-black headings, flat status accents. No gradients, no orbs,
// minimal shadows, generous padding, large bold headings.

// Toss-style structure (clean white cards, gray bg, big bold typography)
// but with GOMS brand colors as the primary accent — orange instead of
// Toss blue. Status pills still use distinct per-stage colors so they
// stay readable independently of the brand accent.
const TOSS = {
  bg: "#F2F4F6",
  card: "#FFFFFF",
  border: "#F2F4F6",
  borderStrong: "#E5E8EB",
  textPrimary: "#191F28",
  textSecondary: "#4E5968",
  textTertiary: "#8B95A1",
  brand: "#F5A623",
  brandDeep: "#E8961A",
  brandWeak: "#FFF4E0",
  brandSoft: "#FFE8C2",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "접수 완료",
  reviewing: "검토 중",
  passed: "서류 통과",
  rejected: "불합격",
  hired: "최종 합격",
};

const STATUS_COLORS: Record<
  ApplicationStatus,
  { fg: string; bg: string; dot: string }
> = {
  new: { fg: "#1B64DA", bg: "#E8F3FF", dot: "#3182F6" },
  reviewing: { fg: "#C66F00", bg: "#FFF4E0", dot: "#F2A03D" },
  passed: { fg: "#7C3AED", bg: "#F3EDFF", dot: "#8B5CF6" },
  rejected: { fg: "#D14C4C", bg: "#FFEBEB", dot: "#F04452" },
  hired: { fg: "#059862", bg: "#E5FFF3", dot: "#00C73C" },
};

const STATUS_MESSAGES: Record<ApplicationStatus, string> = {
  new: "지원서를 정상적으로 접수했어요. 곧 검토가 시작될 거예요.",
  reviewing:
    "Team HARIBO가 지원서를 검토 중이에요. 결과까지 조금만 기다려주세요.",
  passed:
    "축하해요. 서류 전형을 통과했어요. 면접 일정 안내가 곧 따로 갈 거예요.",
  rejected:
    "이번에는 함께하기 어려워졌어요. 보내주신 시간과 관심 진심으로 감사해요.",
  hired:
    "최종 합격하셨어요. Team HARIBO에서 합류 안내를 곧 보내드릴게요.",
};

// Linear pipeline (rejected diverges)
const PIPELINE: { key: ApplicationStatus; label: string }[] = [
  { key: "new", label: "접수" },
  { key: "reviewing", label: "검토" },
  { key: "passed", label: "통과" },
  { key: "hired", label: "합격" },
];
const STATUS_INDEX: Record<ApplicationStatus, number> = {
  new: 0,
  reviewing: 1,
  passed: 2,
  rejected: -1,
  hired: 3,
};

interface ApplicantSession {
  authenticated: boolean;
  email?: string;
  name?: string;
  picture?: string;
}

interface RoleSummary {
  label: string;
  title: string;
}

export default function ApplyStatusPage() {
  const [session, setSession] = useState<ApplicantSession | null>(null);
  const [applications, setApplications] = useState<MyApplication[] | null>(
    null,
  );
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ authenticated: false }));
  }, []);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then((d: { roles?: RoleSummary[] }) => setRoles(d.roles ?? []))
      .catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    if (!session?.authenticated) return;
    setLoading(true);
    setError(null);
    fetch("/api/applications/me")
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || "조회 실패");
        }
        return r.json();
      })
      .then((d: { applications: MyApplication[] }) => {
        setApplications(d.applications ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session?.authenticated]);

  useEffect(() => {
    if (session?.authenticated) return;
    if (!gsiReady || !clientId) return;
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      ux_mode: "popup",
    });
    if (btnRef.current) {
      btnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(btnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        logo_alignment: "left",
        width: 280,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gsiReady, clientId, session?.authenticated]);

  async function handleCredential(response: { credential: string }) {
    setAuthError(null);
    try {
      // purpose: "status" tells the backend to skip the @gsm.hs.kr
      // domain restriction so any Google account can sign in here just
      // to view their own application status.
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          purpose: "status",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Google 로그인 실패");
        return;
      }
      setSession({
        authenticated: true,
        email: data.email,
        name: data.name,
        picture: data.picture,
      });
    } catch {
      setAuthError("네트워크 오류가 발생했어요.");
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false });
    setApplications(null);
    window.google?.accounts?.id?.disableAutoSelect();
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ color: TOSS.textPrimary }}
    >
      {/* Background — soft top-to-bottom gradient + faint orange orb */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #FFFCF6 0%, #F2F4F6 260px, #F2F4F6 100%)",
        }}
      />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[420px] pointer-events-none">
        <div
          className="w-full h-full rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, #FFE8C2 0%, transparent 70%)",
          }}
        />
      </div>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
        onReady={() => setGsiReady(true)}
      />

      {/* Top nav — minimal */}
      <header className="relative sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-[#F2F4F6]">
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold"
            style={{ color: TOSS.textSecondary }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            홈으로
          </Link>
          {session?.authenticated && (
            <button
              onClick={signOut}
              className="text-xs font-bold hover:underline"
              style={{ color: TOSS.textTertiary }}
            >
              로그아웃
            </button>
          )}
        </div>
      </header>

      <div className="relative max-w-xl mx-auto px-5 pt-10 pb-24">
        {/* Page title — bold black + subtle blue gradient accent */}
        <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight leading-[1.25]">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #F5A623 0%, #FF8C00 50%, #FFCB6B 100%)",
            }}
          >
            지원 현황
          </span>
          을
          <br />
          확인해 볼까요?
        </h1>
        <p
          className="mt-4 text-[15px] leading-[1.65]"
          style={{ color: TOSS.textSecondary }}
        >
          지원서를 제출할 때 사용한 Google 계정으로 로그인하면, 본인이 낸
          모든 지원서의 진행 상황을 한눈에 볼 수 있어요. 접수부터 검토,
          서류 통과, 면접, 최종 합격까지 어느 단계에 있는지 실시간으로
          알려드릴게요.
        </p>

        {/* Not authenticated */}
        {session && !session.authenticated && (
          <div className="mt-8">
            <div
              className="rounded-2xl bg-white p-7"
              style={{ border: `1px solid ${TOSS.border}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: TOSS.brandWeak }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TOSS.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <p className="text-[16px] font-bold leading-tight">
                    Google 로그인이 필요해요
                  </p>
                  <p
                    className="mt-1 text-[13px]"
                    style={{ color: TOSS.textTertiary }}
                  >
                    지원서 제출 때 쓴 Google 계정으로 로그인해 주세요.
                  </p>
                </div>
              </div>

              {!clientId && (
                <p className="mt-5 text-[12px] font-semibold text-[#F04452]">
                  관리자에게 문의하세요: GOOGLE_CLIENT_ID가 설정되지 않았어요.
                </p>
              )}
              {clientId && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div ref={btnRef} className="flex justify-center" />
                  {!gsiReady && (
                    <p
                      className="text-[12px]"
                      style={{ color: TOSS.textTertiary }}
                    >
                      Google 로그인 버튼 불러오는 중...
                    </p>
                  )}
                </div>
              )}
              {authError && (
                <p className="mt-4 text-[12px] font-semibold text-[#F04452]">
                  {authError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Authenticated */}
        {session?.authenticated && (
          <div className="mt-8 space-y-4">
            {/* User identity row — avatar + name/email + compact change btn */}
            <div
              className="rounded-2xl bg-white p-4 flex items-center gap-3"
              style={{ border: `1px solid ${TOSS.border}` }}
            >
              {session.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.picture}
                  alt={session.name || session.email || ""}
                  className="w-11 h-11 rounded-full shrink-0 ring-2"
                  style={{ ["--tw-ring-color" as string]: TOSS.brandWeak }}
                />
              ) : (
                <span
                  className="w-11 h-11 rounded-full shrink-0"
                  style={{ background: TOSS.brandWeak }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold leading-tight truncate">
                  {session.name ?? session.email}
                </p>
                <p
                  className="mt-0.5 text-[12px] truncate"
                  style={{ color: TOSS.textTertiary }}
                >
                  {session.email}
                </p>
              </div>
              <button
                onClick={signOut}
                title="다른 계정으로 변경"
                aria-label="다른 Google 계정으로 변경"
                className="shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-white text-[12px] font-bold text-[#3C4043] hover:bg-gray-50 transition-colors"
                style={{ border: "1px solid #DADCE0" }}
              >
                {/* Official Google "G" logo */}
                <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="hidden sm:inline">계정 변경</span>
              </button>
            </div>

            {loading && (
              <div
                className="rounded-2xl bg-white p-12 text-center"
                style={{ border: `1px solid ${TOSS.border}` }}
              >
                <div
                  className="inline-block w-7 h-7 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: TOSS.borderStrong,
                    borderTopColor: TOSS.brand,
                  }}
                />
                <p
                  className="mt-3 text-[13px]"
                  style={{ color: TOSS.textTertiary }}
                >
                  불러오는 중
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl text-[14px] font-semibold text-[#D14C4C] bg-[#FFEBEB]">
                {error}
              </div>
            )}

            {!loading && applications && applications.length === 0 && (
              <div
                className="rounded-2xl bg-white py-14 px-6 text-center"
                style={{ border: `1px solid ${TOSS.border}` }}
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                  style={{ background: TOSS.bg }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TOSS.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-[18px] font-bold">아직 지원 기록이 없어요</p>
                <p
                  className="mt-2 text-[13px]"
                  style={{ color: TOSS.textTertiary }}
                >
                  이 Google 계정으로 제출된 지원서를 찾을 수 없어요
                </p>
                <Link
                  href="/apply"
                  className="mt-6 inline-flex items-center justify-center w-full max-w-[240px] h-12 rounded-xl text-[15px] font-bold text-white shadow-lg shadow-[#F5A623]/25 hover:scale-[1.02] transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${TOSS.brand} 0%, ${TOSS.brandDeep} 100%)`,
                  }}
                >
                  지원하러 가기
                </Link>
              </div>
            )}

            {!loading && applications && applications.length > 0 && (
              <div className="space-y-3">
                {applications.map((app) => (
                  <ApplicationStatusCard
                    key={`${app.source}-${app.id}`}
                    app={app}
                    roles={roles}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Single submission card — Toss style: clean white, status pill at top,
 * big role title, friendly message, simple stepper at the bottom.
 */
function ApplicationStatusCard({
  app,
  roles,
}: {
  app: MyApplication;
  roles: RoleSummary[];
}) {
  const isArchive = app.source === "archive";
  // Archived round is *closed* — anyone not explicitly hired at close
  // time didn't make the cut. Display those as 불합격 regardless of what
  // their in-flight status happened to be (new / reviewing / passed).
  // Raw data on disk is left untouched; this is purely a display coercion.
  const displayStatus: ApplicationStatus =
    isArchive && app.status !== "hired" ? "rejected" : app.status;
  const c = STATUS_COLORS[displayStatus];
  const created = new Date(app.createdAt);
  const roleTitle =
    roles.find((r) => r.label === app.role)?.title ?? app.role ?? null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-7"
      style={{ border: `1px solid ${TOSS.border}` }}
    >
      {/* Top gradient hairline */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${c.dot} 0%, ${c.dot}40 100%)`,
        }}
      />
      {/* Subtle corner glow */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(closest-side, ${c.bg}, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* Status pill */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold"
          style={{
            background: `linear-gradient(135deg, ${c.bg} 0%, ${c.bg}80 100%)`,
            color: c.fg,
            border: `1px solid ${c.dot}20`,
          }}
        >
          <span className="relative flex items-center justify-center w-1.5 h-1.5">
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: c.dot, opacity: 0.6 }}
            />
            <span
              className="relative w-1.5 h-1.5 rounded-full"
              style={{ background: c.dot }}
            />
          </span>
          {STATUS_LABELS[displayStatus]}
        </span>
        {isArchive && (
          <span
            className="text-[11px] font-bold tracking-wide"
            style={{ color: TOSS.textTertiary }}
          >
            {app.batchTitle ?? "이전 모집"} 기록
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="mt-4 text-[22px] sm:text-[24px] font-extrabold tracking-tight leading-tight">
        {roleTitle ?? "지원서"}
      </h2>

      {/* Timestamps — submission + (optional) last status change */}
      <div className="mt-2 flex flex-col gap-1">
        <div
          className="flex items-center gap-1.5 text-[12px] tabular-nums"
          style={{ color: TOSS.textTertiary }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {created.toLocaleString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          제출
        </div>
        {app.statusUpdatedAt && (
          <div
            className="flex items-center gap-1.5 text-[12px] font-bold tabular-nums"
            style={{ color: c.fg }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {new Date(app.statusUpdatedAt).toLocaleString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            상태 업데이트
          </div>
        )}
      </div>

      {/* Status message */}
      <p
        className="mt-5 text-[15px] leading-relaxed"
        style={{ color: TOSS.textSecondary }}
      >
        {isArchive && displayStatus === "rejected" && app.status !== "rejected"
          ? `${app.batchTitle ?? "이전 모집"}이 종료됐어요. 이번에는 함께하기 어려워졌지만, 보내주신 시간과 관심 진심으로 감사해요.`
          : STATUS_MESSAGES[displayStatus]}
      </p>

      {/* Pipeline stepper */}
      <div
        className="mt-6 pt-6"
        style={{ borderTop: `1px solid ${TOSS.border}` }}
      >
        <PipelineProgress status={displayStatus} />
      </div>
    </div>
  );
}

/**
 * Compact horizontal stepper. Toss style: gray dots, blue/colored when
 * reached, current stage gets a slight emphasis. Rejected splits into a
 * dedicated red row instead of continuing the linear path.
 */
function PipelineProgress({ status }: { status: ApplicationStatus }) {
  const isRejected = status === "rejected";
  const currentIdx = STATUS_INDEX[status];

  if (isRejected) {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: STATUS_COLORS.rejected.dot }}
        />
        <span
          className="text-[12px] font-bold"
          style={{ color: STATUS_COLORS.rejected.fg }}
        >
          전형 종료
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Track */}
      <div
        className="absolute top-[10px] left-3 right-3 h-[2px]"
        style={{ background: TOSS.borderStrong }}
      >
        {currentIdx > 0 && (
          <div
            className="h-full"
            style={{
              width: `${(currentIdx / (PIPELINE.length - 1)) * 100}%`,
              background: STATUS_COLORS[status].dot,
              transition: "width 600ms ease-out",
            }}
          />
        )}
      </div>

      {/* Stops */}
      <div className="relative flex justify-between">
        {PIPELINE.map((stage, i) => {
          const reached = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const dotColor = reached ? STATUS_COLORS[status].dot : "#D1D6DB";
          return (
            <div
              key={stage.key}
              className="flex flex-col items-center gap-2 min-w-0"
            >
              <div
                className="relative w-[22px] h-[22px] rounded-full flex items-center justify-center"
                style={{
                  background: dotColor,
                  boxShadow: isCurrent
                    ? `0 0 0 4px ${STATUS_COLORS[status].bg}`
                    : undefined,
                  transition: "background 300ms ease-out, box-shadow 300ms",
                }}
              >
                {/* Animated pulse ring on the current step */}
                {isCurrent && (
                  <>
                    <span
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: dotColor, opacity: 0.45 }}
                    />
                    <span
                      className="absolute -inset-1 rounded-full animate-pulse"
                      style={{
                        background: dotColor,
                        opacity: 0.18,
                      }}
                    />
                  </>
                )}
                {reached && !isCurrent && (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="relative"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                {isCurrent && (
                  <span className="relative w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span
                className="text-[11px] font-bold"
                style={{
                  color: reached ? TOSS.textPrimary : TOSS.textTertiary,
                }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
