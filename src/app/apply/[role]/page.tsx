import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ApplyForm from "@/components/ApplyForm";
import { getRoleStatus, type RoleKey } from "@/lib/storage";
import { getRoleBySlug, APPLY_ROLES } from "@/lib/applyRoles";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return APPLY_ROLES.map((r) => ({ role: r.slug }));
}

export default async function ApplyRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role: slug } = await params;
  const role = getRoleBySlug(slug);
  if (!role) notFound();

  const status = await getRoleStatus();
  const isOpen = (status as Record<string, boolean>)[role.label] ?? true;

  return (
    <main className="min-h-screen bg-[#FFF8EE] animate-page-in">
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

          {isOpen ? (
            <ApplyForm
              status={status as Record<RoleKey, boolean>}
              lockedRole={role.label as RoleKey}
            />
          ) : (
            <div className="rounded-[32px] bg-white border border-gray-100 p-10 sm:p-14 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-5">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-[#1E1E1E]">
                아쉽게도 지금은 모집 마감이에요.
              </h3>
              <p className="mt-3 text-gray-500">
                다음 모집 시즌에 다시 만나요.
              </p>
              <Link
                href="/apply"
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-bold text-[#F5A623] hover:underline"
              >
                다른 직군 보기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
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
