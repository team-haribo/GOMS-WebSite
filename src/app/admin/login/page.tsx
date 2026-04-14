"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="min-h-screen bg-[#FFF8EE] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 text-gray-500 hover:text-[#F5A623] transition-colors text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          홈으로
        </Link>

        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] border border-white">
          <div className="flex items-center gap-2.5 mb-6">
            <Image src="/goms-logo.svg" alt="GOMS" width={36} height={36} className="rounded-lg" />
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#F5A623]">ADMIN</p>
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
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#F5A623] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#F5A623] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 transition-all text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 font-semibold">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-6 py-3.5 rounded-xl bg-[#F5A623] text-white font-bold hover:bg-[#E8961A] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F5A623]/25"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
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
