"use client";

import { useInView } from "@/hooks/useInView";

const VALUES = [
  {
    number: "01",
    title: "QR 하나로\n간편하게.",
    desc: "복잡한 외출 절차를 QR 코드 하나로 빠르고 정확하게.",
    accent: "#F5A623",
    bgGradient: "from-orange-50 to-amber-50",
    metric: "1초",
    metricLabel: "인증 시간",
  },
  {
    number: "02",
    title: "실시간으로,\n빠짐없이.",
    desc: "외출 현황을 실시간으로 파악하고 학생·학생회 모두 편리하게.",
    accent: "#10B981",
    bgGradient: "from-emerald-50 to-teal-50",
    metric: "100%",
    metricLabel: "실시간 동기화",
  },
  {
    number: "03",
    title: "끊임없이\n발전합니다.",
    desc: "V1부터 V3까지, 매 세대를 거듭하며 더 나은 서비스로.",
    accent: "#3B82F6",
    bgGradient: "from-blue-50 to-indigo-50",
    metric: "3+",
    metricLabel: "메이저 버전",
  },
];

export default function Values() {
  const { ref, visible } = useInView();

  return (
    <section id="values" className="py-24 sm:py-32 bg-gray-50/50" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div
          className={`${visible ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <span className="text-[#F5A623] font-bold text-xs tracking-[0.2em]">
            OUR VALUES
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black text-[#1E1E1E] tracking-tight leading-[1.15]">
            GOMS는 이런 것을
            <br />
            <span className="bg-gradient-to-r from-[#F5A623] to-[#FF8C00] bg-clip-text text-transparent">
              가장 중요하게 생각해요.
            </span>
          </h2>
          <p className="mt-5 text-gray-500 text-base sm:text-lg max-w-xl">
            우리가 매일 코드를 쓰는 이유는 결국 사용하는 사람들 때문이에요.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
          {VALUES.map((v, i) => (
            <div
              key={v.number}
              className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${v.bgGradient} border border-white p-8 sm:p-9 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.15)] hover:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.2)] hover:-translate-y-1.5 transition-all duration-500 group ${
                visible ? `animate-fade-in-up delay-${(i + 2) * 100}` : "opacity-0"
              }`}
            >
              {/* Decorative blob */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl group-hover:opacity-30 transition-opacity"
                style={{ background: v.accent }}
              />

              {/* Number badge */}
              <div className="relative flex items-center justify-between">
                <span
                  className="text-sm font-black tracking-[0.18em]"
                  style={{ color: v.accent }}
                >
                  {v.number}
                </span>
                <span className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={v.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17l10-10M7 7h10v10" />
                  </svg>
                </span>
              </div>

              {/* Title */}
              <h3 className="relative mt-8 text-2xl sm:text-3xl font-black text-[#1E1E1E] tracking-tight leading-snug whitespace-pre-line">
                {v.title}
              </h3>

              {/* Description */}
              <p className="relative mt-4 text-sm text-gray-600 leading-relaxed">
                {v.desc}
              </p>

              {/* Metric */}
              <div className="relative mt-8 pt-6 border-t border-white/60">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl font-black tracking-tight"
                    style={{ color: v.accent }}
                  >
                    {v.metric}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {v.metricLabel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
