import Image from "next/image";
import Link from "next/link";
import { getRoles, isRoleEffectivelyOpen } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const ROLES = await getRoles();
  return (
    <main className="min-h-screen bg-[#FFF8EE] animate-page-in">
      {/* Simple header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2.5 px-2 py-1 -mx-2 -my-1 rounded-xl hover:bg-[#F5A623]/10 active:scale-95 transition-all duration-200"
          >
            <Image
              src="/goms-logo.svg"
              alt="GOMS"
              width={32}
              height={32}
              className="rounded-lg group-hover:scale-110 group-hover:rotate-[-6deg] group-hover:drop-shadow-[0_4px_12px_rgba(245,166,35,0.4)] transition-all duration-300"
            />
            <span className="text-xl font-bold text-[#1E1E1E] tracking-tight group-hover:text-[#F5A623] transition-colors">
              GOMS
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/apply/status"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5A623]/10 text-[#F5A623] text-xs font-bold hover:bg-[#F5A623]/15 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              내 지원 현황
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#F5A623] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              홈으로
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Gradient glow behind heading */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-gradient-to-br from-[#F5A623]/25 via-[#FF8C00]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <span className="inline-block px-4 py-2 rounded-full bg-white border border-[#F5A623]/30 text-[#F5A623] font-bold text-xs tracking-[0.18em] shadow-sm">
            JOIN US
          </span>
          <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-black text-[#1E1E1E] leading-[1.1] tracking-tight">
            함께
            <br />
            <span className="bg-gradient-to-r from-[#F5A623] to-[#FF8C00] bg-clip-text text-transparent">
              GOMS를 만들어요.
            </span>
          </h1>
          <p className="mt-7 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            5기부터 10기까지 6년째 이어지는 GOMS, 그 다음 한 페이지를{" "}
            <br className="hidden sm:block" />
            함께 써내려갈 사람을 기다리고 있어요.
          </p>

          {/* Status check CTA — small pill below the subtitle */}
          <div className="mt-8 flex justify-center">
            <Link
              href="/apply/status"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#F5A623]/30 text-[#F5A623] text-sm font-bold hover:bg-[#F5A623]/5 hover:border-[#F5A623]/50 transition-all shadow-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              이미 지원하셨다면? 지원 현황 확인
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="pb-24 sm:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#F5A623] font-bold text-xs tracking-[0.2em]">
              ROLES
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black text-[#1E1E1E] tracking-tight">
              어떤 자리가 열려 있어요?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ROLES.map((role) => {
              const isOpen = isRoleEffectivelyOpen(role);
              const slug = role.slug;
              const Wrapper = isOpen ? Link : "div";
              const wrapperProps = isOpen ? { href: `/apply/${slug}` } : {};
              return (
                <Wrapper
                  key={role.label}
                  {...(wrapperProps as { href: string })}
                  className={`block relative overflow-hidden rounded-3xl bg-gradient-to-br ${role.bg} border border-white p-8 sm:p-10 shadow-[0_15px_50px_-20px_rgba(0,0,0,0.15)] transition-all duration-500 group ${
                    isOpen
                      ? "hover:-translate-y-1 hover:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.2)] cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div
                    className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl group-hover:opacity-30 transition-opacity"
                    style={{ background: role.color }}
                  />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm font-bold tracking-[0.18em]"
                        style={{ color: role.color }}
                      >
                        {role.label.toUpperCase()}
                      </span>
                      {isOpen ? (
                        <span className="w-9 h-9 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={role.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M7 17l10-10M7 7h10v10" />
                          </svg>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">
                          모집 마감
                        </span>
                      )}
                    </div>

                    <h3 className="mt-5 text-3xl font-black text-[#1E1E1E] tracking-tight">
                      {role.title || role.label}
                    </h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                      {role.subtitle || role.intro}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {role.stack.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-lg bg-white/80 backdrop-blur-sm text-[11px] font-semibold text-gray-600 border border-white"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {(role.openAt || role.closeAt) && (
                      <RoleSchedule
                        openAt={role.openAt}
                        closeAt={role.closeAt}
                        color={role.color}
                      />
                    )}

                    {isOpen && (
                      <div className="mt-6 flex items-center gap-1.5 text-sm font-bold" style={{ color: role.color }}>
                        지원하러 가기
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="group-hover:translate-x-0.5 transition-transform"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 sm:pb-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1E1E1E] to-[#2a2a2a] p-10 sm:p-14 text-center">
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-[#F5A623]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-[#FF8C00]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                궁금한 점이 있다면,
                <br />
                <span className="bg-gradient-to-r from-[#F5A623] to-[#FFCB6B] bg-clip-text text-transparent">
                  편하게 문의하세요.
                </span>
              </h3>
              <p className="mt-5 text-gray-400 text-base sm:text-lg">
                Team HARIBO는 언제든 열려 있어요.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://github.com/team-haribo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#F5A623] text-white font-bold hover:bg-[#E8961A] hover:scale-[1.03] transition-all shadow-lg shadow-[#F5A623]/25"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub 보러가기
                </a>
                <a
                  href="https://discord.com/users/xixn2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-white/20 text-white font-bold hover:bg-white/10 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord @xixn2
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-[#F5A623]/10">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Team HARIBO · Made by{" "}
          <a
            href="https://github.com/Xixn2"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1E1E1E] hover:text-[#F5A623] transition-colors"
          >
            @Xixn2
          </a>
        </div>
      </footer>
    </main>
  );
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const yearPart = sameYear ? "" : `${d.getFullYear()}. `;
  const hour = d.getHours();
  const min = d.getMinutes();
  const ampm = hour < 12 ? "오전" : "오후";
  const h12 = hour % 12 || 12;
  const minStr = min.toString().padStart(2, "0");
  return `${yearPart}${month}월 ${day}일 (${weekday}) ${ampm} ${h12}:${minStr}`;
}

function relativeFromNow(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const absMs = Math.abs(diffMs);
  const future = diffMs > 0;
  const min = Math.round(absMs / 60000);
  const hr = Math.round(absMs / 3600000);
  const day = Math.round(absMs / 86400000);
  if (min < 1) return future ? "곧" : "방금 전";
  if (min < 60) return future ? `${min}분 후` : `${min}분 전`;
  if (hr < 24) return future ? `${hr}시간 후` : `${hr}시간 전`;
  return future ? `${day}일 후` : `${day}일 전`;
}

function RoleSchedule({
  openAt,
  closeAt,
  color,
}: {
  openAt?: string | null;
  closeAt?: string | null;
  color: string;
}) {
  const now = Date.now();
  const opens = openAt ? new Date(openAt).getTime() : null;
  const closes = closeAt ? new Date(closeAt).getTime() : null;

  let label: string;
  let value: string;
  let relative: string | null = null;

  if (opens && now < opens && openAt) {
    label = "OPENS";
    value = formatFullDate(openAt);
    relative = relativeFromNow(openAt);
  } else if (closes && now < closes && closeAt) {
    label = "CLOSES";
    value = formatFullDate(closeAt);
    relative = relativeFromNow(closeAt);
  } else if (closes && now >= closes && closeAt) {
    label = "CLOSED";
    value = formatFullDate(closeAt);
  } else if (openAt) {
    label = "OPENED";
    value = formatFullDate(openAt);
  } else {
    return null;
  }

  return (
    <div
      className="mt-5 inline-flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm border border-white shadow-sm"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-[9px] font-black tracking-[0.18em] text-gray-400">
          {label}
        </p>
        <p className="text-[12px] font-bold text-[#1E1E1E]">
          {value}
          {relative && (
            <span className="ml-1.5 font-semibold" style={{ color }}>
              · {relative}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
