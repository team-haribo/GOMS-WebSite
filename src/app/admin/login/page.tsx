"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AdminLogo from "@/components/AdminLogo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인 실패");
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#F5F7FA] flex items-center justify-center px-6 overflow-hidden">
      {/* Decorative blurred admin dashboard backdrop */}
      <AdminBackdrop />

      {/* Soft fade overlay to push the backdrop further behind the card
          without washing it out completely */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-white/20 to-[#B486F9]/15" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 text-gray-500 hover:text-[#B486F9] transition-colors text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          홈으로
        </Link>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_-20px_rgba(180,134,249,0.3)] border border-white">
          <div className="flex items-center gap-2.5 mb-6">
            <AdminLogo size={36} />
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">ADMIN</p>
              <p className="text-lg font-black text-[#1E1E1E] tracking-tight">관리자 로그인</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                아이디
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                autoComplete="username"
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#B486F9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B486F9]/20 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#B486F9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B486F9]/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-6 py-3.5 rounded-xl bg-[#B486F9] text-white font-bold hover:bg-[#9A6FE0] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#B486F9]/25"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              처음이신가요?{" "}
              <Link
                href="/admin/register"
                className="font-bold text-[#B486F9] hover:underline"
              >
                관리자 가입 신청
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Decorative, non-interactive clone of the admin dashboard layout used as
 * a heavily-blurred backdrop on the login screen. Nothing here is real —
 * labels and numbers are static, no data fetching, nothing clickable. The
 * entire tree is `pointer-events-none` and sits behind the login card.
 */
function AdminBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 select-none"
      aria-hidden="true"
      style={{ filter: "blur(14px) saturate(1.1)" }}
    >
      {/* Outer canvas — same background tint as the real admin page */}
      <div className="absolute inset-0 bg-[#F5F7FA]" />

      {/* Sidebar */}
      <aside className="absolute top-0 left-0 bottom-0 w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <AdminLogo size={32} />
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#B486F9] leading-none">
                ADMIN
              </p>
              <p className="text-base font-black text-[#1E1E1E] tracking-tight leading-tight">
                GOMS
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-4">
          <FakeNavSection title="General">
            <FakeNavItem label="소개" active />
            <FakeNavItem label="멤버" badge="27" />
          </FakeNavSection>
          <FakeNavSection title="Recruiting">
            <FakeNavItem label="직군 모집" />
            <FakeNavItem label="지원폼" />
            <FakeNavItem label="지원자" badge="3" />
            <FakeNavItem label="이전 모집" />
          </FakeNavSection>
          <FakeNavSection title="System">
            <FakeNavItem label="마이페이지" />
            <FakeNavItem label="계정 관리" />
            <FakeNavItem label="로그" />
          </FakeNavSection>
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-2">
          <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#B486F9] to-[#8B5CF6]" />
            <div className="flex-1">
              <div className="h-2.5 w-20 rounded bg-gray-200" />
              <div className="mt-1 h-1.5 w-14 rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-9 rounded-lg bg-gray-100" />
        </div>
      </aside>

      {/* Main content — overview hero */}
      <div className="absolute top-0 right-0 bottom-0 left-60 p-10">
        <div className="relative h-full rounded-3xl bg-white border border-gray-100 shadow-[0_20px_60px_-30px_rgba(180,134,249,0.25)] overflow-hidden flex items-center justify-center">
          {/* Purple gradient orbs */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#B486F9]/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#C4B5FD]/30 rounded-full blur-3xl" />

          {/* Hero content */}
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B486F9]/10 text-[#B486F9] text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-[#B486F9]" />
              GOMS Admin
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-[#B486F9] via-[#8B5CF6] to-[#C4B5FD] bg-clip-text text-transparent">
                GOMS
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
              Team HARIBO의 운영 콘솔
              <br />
              사이트의 모든 것을 여기서 관리해요
            </p>
            <p className="mt-6 text-3xl font-bold text-[#1E1E1E]">
              멤버 · 직군 · 지원자 한 곳에서.
            </p>
            <div className="mt-8 inline-flex items-center gap-10 px-6 py-4 rounded-2xl bg-[#F5F7FA] border border-gray-100">
              <FakeStat label="멤버" value="27" />
              <div className="w-px h-10 bg-gray-200" />
              <FakeStat label="직군" value="6" />
              <div className="w-px h-10 bg-gray-200" />
              <FakeStat label="지원자" value="3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FakeNavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="px-3 py-2 text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function FakeNavItem({
  label,
  badge,
  active,
}: {
  label: string;
  badge?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
        active ? "bg-[#B486F9]/10 text-[#B486F9]" : "text-gray-600"
      }`}
    >
      <div
        className={`w-4 h-4 rounded ${
          active ? "bg-[#B486F9]/30" : "bg-gray-200"
        }`}
      />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            active ? "bg-[#B486F9] text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function FakeStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[#1E1E1E] tabular-nums">
        {value}
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
