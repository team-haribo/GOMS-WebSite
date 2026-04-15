"use client";

import Link from "next/link";
import { useState } from "react";
import AdminLogo from "@/components/AdminLogo";

export default function AdminRegisterPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 해요.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호 확인이 일치하지 않아요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "가입 실패");
        return;
      }
      setDone(true);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#FFF8EE] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] border border-white text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#B486F9]/10 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B486F9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-[#1E1E1E]">
              가입 신청이 접수됐어요.
            </h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              기존 관리자가 승인하면 로그인할 수 있어요.
              <br />
              승인 전에는 로그인이 차단돼요.
            </p>
            <Link
              href="/admin/login"
              className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#B486F9] text-white text-sm font-bold hover:bg-[#A070F0] transition-colors shadow-sm shadow-[#B486F9]/25"
            >
              로그인 화면으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF8EE] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 mb-8 text-gray-500 hover:text-[#B486F9] transition-colors text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          로그인으로
        </Link>

        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] border border-white">
          <div className="flex items-center gap-2.5 mb-6">
            <AdminLogo size={36} />
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#B486F9]">
                ADMIN
              </p>
              <p className="text-lg font-black text-[#1E1E1E] tracking-tight">
                관리자 가입 신청
              </p>
            </div>
          </div>

          <p className="mb-5 text-xs text-gray-500 leading-relaxed">
            신청 후 기존 관리자의 승인을 받아야 로그인할 수 있어요.
          </p>

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
                minLength={3}
                maxLength={31}
                placeholder="영문으로 시작, 3~31자"
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="8자 이상"
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
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                비밀번호 확인
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#B486F9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B486F9]/20 transition-all text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 font-semibold">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-6 py-3.5 rounded-xl bg-[#B486F9] text-white font-bold hover:bg-[#9A6FE0] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#B486F9]/25"
            >
              {loading ? "신청 중..." : "가입 신청"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
