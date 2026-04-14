"use client";

import { useInView } from "@/hooks/useInView";

const VALUES = [
  {
    icon: "📱",
    title: "QR 기반 간편 인증",
    desc: "복잡한 외출 절차를 QR 코드 하나로 빠르고 정확하게 처리합니다.",
  },
  {
    icon: "⚡",
    title: "실시간 통합 관리",
    desc: "외출 현황을 실시간으로 파악하고, 학생과 교사 모두 편리하게 관리합니다.",
  },
  {
    icon: "🚀",
    title: "지속적인 개선",
    desc: "V1부터 V3까지, 매 세대를 거듭하며 더 나은 서비스를 만들어갑니다.",
  },
];

export default function Values() {
  const { ref, visible } = useInView();

  return (
    <section id="values" className="py-24 sm:py-32" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className={`text-center ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
          <span className="text-[#6C5CE7] font-semibold text-sm uppercase tracking-widest">
            Our Values
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-[#2D2B55]">
            GOMS가 추구하는 가치
          </h2>
        </div>

        <div className="mt-16 grid sm:grid-cols-3 gap-8">
          {VALUES.map((v, i) => (
            <div
              key={v.title}
              className={`group p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                visible ? `animate-fade-in-up delay-${(i + 2) * 100}` : "opacity-0"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {v.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#2D2B55]">{v.title}</h3>
              <p className="mt-3 text-[#64748B] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
