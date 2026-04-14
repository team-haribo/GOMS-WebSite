import Image from "next/image";
import Link from "next/link";
import { getFormConfig } from "@/lib/storage";

export const dynamic = "force-dynamic";

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-bold text-[#1E1E1E]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="text-base text-gray-700 leading-relaxed space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-xl font-black text-[#1E1E1E] mt-8">
              {renderInline(line.slice(3))}
            </h2>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p
              key={i}
              className="pl-5 text-gray-600 before:content-['•'] before:mr-2 before:text-[#F5A623]"
            >
              {renderInline(line.slice(2))}
            </p>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return (
          <p key={i} className="text-gray-600">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

export default async function PrivacyPage() {
  const config = await getFormConfig();
  return (
    <main className="min-h-screen bg-[#FFF8EE]">
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
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#F5A623] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            홈으로
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <span className="inline-block px-3 py-1.5 rounded-full bg-white border border-[#F5A623]/30 text-[#F5A623] font-bold text-[10px] tracking-[0.18em] shadow-sm">
          LEGAL
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl font-black text-[#1E1E1E] leading-tight tracking-tight">
          개인정보 수집 · 이용
        </h1>
        <p className="mt-4 text-gray-500">{config.privacyPolicy.summary}</p>

        <div className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10">
          <Markdown text={config.privacyPolicy.details} />
        </div>
      </section>
    </main>
  );
}
