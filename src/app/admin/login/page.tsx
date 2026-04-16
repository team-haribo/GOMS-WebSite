"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AdminLogo from "@/components/AdminLogo";
import AdminBackdrop from "@/components/AdminBackdrop";

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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
