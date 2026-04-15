import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ApplyForm from "@/components/ApplyForm";
import RoleScheduleBanner from "@/components/RoleScheduleBanner";
import {
  getRoleBySlug,
  getRoleStatus,
  isRoleEffectivelyOpen,
  type RoleKey,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function ApplyRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role: slug } = await params;
  const role = await getRoleBySlug(slug);
  if (!role) notFound();

  const status = await getRoleStatus();
  const isOpen = isRoleEffectivelyOpen(role);
  const now = new Date();
  const opensAt = role.openAt ? new Date(role.openAt) : null;
  const closesAt = role.closeAt ? new Date(role.closeAt) : null;
  let blockReason: "notYet" | "ended" | "closed" | null = null;
  if (!isOpen) {
    if (opensAt && now < opensAt) blockReason = "notYet";
    else if (closesAt && now >= closesAt) blockReason = "ended";
    else blockReason = "closed";
  }

  return (
    <>
    <main className="min-h-screen bg-[#FFF8EE] animate-page-in relative">
      {/* Header */}
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
          <Link
            href="/apply"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#F5A623] transition-colors"
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
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            직군 선택으로
          </Link>
        </div>
      </header>

      <div
        className={
          blockReason
            ? "blur-xl saturate-50 pointer-events-none select-none"
            : ""
        }
        aria-hidden={blockReason ? true : undefined}
      >
      {/* Hero */}
      <section
        className={`relative pt-20 pb-16 sm:pt-28 sm:pb-20 overflow-hidden bg-gradient-to-br ${role.bg}`}
      >
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: role.color }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: role.color }}
        />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span
            className="text-xs font-bold tracking-[0.2em]"
            style={{ color: role.color }}
          >
            {role.label.toUpperCase()}
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-black text-[#1E1E1E] leading-[1.15] tracking-tight">
            {role.title}
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-gray-600 font-medium">
            {role.subtitle}
          </p>
          <p className="mt-6 text-sm sm:text-base text-gray-500 leading-relaxed max-w-2xl mx-auto">
            {role.intro}
          </p>

          <div className="mt-6 flex items-center justify-center flex-wrap gap-2">
            {role.stack.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm text-xs font-semibold text-gray-700 border border-white shadow-sm"
              >
                {s}
              </span>
            ))}
          </div>

          {(role.openAt || role.closeAt) && (
            <RoleScheduleBanner
              openAt={role.openAt}
              closeAt={role.closeAt}
              color={role.color}
            />
          )}
        </div>
      </section>

      {/* Talents (인재상) */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span
              className="text-xs font-bold tracking-[0.2em]"
              style={{ color: role.color }}
            >
              WHO WE WANT
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-[#1E1E1E] tracking-tight">
              이런 사람과 함께하고 싶어요.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {role.talents.map((talent, i) => (
              <div
                key={talent.title}
                className="relative p-7 rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-15px_rgba(0,0,0,0.15)] transition-all duration-500"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-black tracking-[0.18em]"
                    style={{ color: role.color }}
                  >
                    0{i + 1}
                  </span>
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: `${role.color}15` }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={role.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-black text-[#1E1E1E] tracking-tight">
                  {talent.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {talent.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="pb-24 sm:pb-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <span
              className="text-xs font-bold tracking-[0.2em]"
              style={{ color: role.color }}
            >
              APPLY NOW
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-[#1E1E1E] tracking-tight">
              지원서를 작성해주세요.
            </h2>
            <p className="mt-3 text-gray-500">
              검토 후 Team HARIBO에서 개별 연락드릴게요.
            </p>
          </div>

          <ApplyForm status={status} lockedRole={role.label} />
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
      </div>
    </main>

    {blockReason && (
      <ClosedOverlay
        reason={blockReason}
        role={{
          label: role.label,
          color: role.color,
          openAt: role.openAt ?? null,
          closeAt: role.closeAt ?? null,
        }}
      />
    )}
    </>
  );
}

function ClosedOverlay({
  reason,
  role,
}: {
  reason: "notYet" | "ended" | "closed";
  role: {
    label: string;
    color: string;
    openAt: string | null;
    closeAt: string | null;
  };
}) {
  const formatDateTime = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    const yearPart = sameYear ? "" : `${d.getFullYear()}년 `;
    const hour = d.getHours();
    const min = d.getMinutes();
    const ampm = hour < 12 ? "오전" : "오후";
    const h12 = hour % 12 || 12;
    const minStr = min.toString().padStart(2, "0");
    return `${yearPart}${month}월 ${day}일 (${weekday}) ${ampm} ${h12}:${minStr}`;
  };

  const subtitles: Record<typeof reason, string> = {
    notYet: "아쉽게도 아직 지원폼이 열리지 않았어요.",
    ended: "아쉽게도 이번 모집은 이미 끝났어요.",
    closed: `아쉽게도 ${role.label} 직군은 지금 모집 중이 아니에요.`,
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 bg-white/55 backdrop-blur-md">
      <div className="w-full max-w-lg text-center animate-fade-in-up">
        <p
          className="text-[10px] font-black tracking-[0.22em]"
          style={{ color: role.color }}
        >
          {role.label.toUpperCase()}
        </p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#1E1E1E] tracking-tight leading-snug">
          이런 식의 URL 접근은
          <br />
          흥미롭네요...
        </h2>
        <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
          {subtitles[reason]}
        </p>

        {(role.openAt || role.closeAt) && (
          <div className="mt-6 inline-flex items-center gap-4 text-[11px] text-gray-500">
            {role.openAt && (
              <span>
                <span className="text-gray-400">오픈 </span>
                <span className="font-bold text-[#1E1E1E]">
                  {formatDateTime(role.openAt)}
                </span>
              </span>
            )}
            {role.openAt && role.closeAt && (
              <span className="text-gray-300">·</span>
            )}
            {role.closeAt && (
              <span>
                <span className="text-gray-400">마감 </span>
                <span className="font-bold text-[#1E1E1E]">
                  {formatDateTime(role.closeAt)}
                </span>
              </span>
            )}
          </div>
        )}

        <div className="mt-7">
          <Link
            href="/apply"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E1E1E] hover:gap-2.5 transition-all"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            다른 직군 보러가기
          </Link>
        </div>
      </div>
    </div>
  );
}

