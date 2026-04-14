"use client";

import Image from "next/image";
import { useInView } from "@/hooks/useInView";

const STEPS = [
  {
    step: "01",
    title: "QR 발급",
    desc: "학생회가 외출 시간에 맞춰 일회용 QR 코드를 생성해요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h2v2h-2zM18 14h3M14 18h3M18 18v3" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "스캔 인증",
    desc: "학생이 학생증 QR을 스캔하면 1초 만에 외출이 인증돼요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "자동 기록",
    desc: "외출 현황과 복귀 시간이 자동 기록되고, 지각자도 알아서 등록돼요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
];

export default function About() {
  const { ref, visible } = useInView();

  return (
    <section id="about" className="py-24 sm:py-32 bg-[#FFF8EE] overflow-hidden" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Top: text + logo */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className={visible ? "animate-fade-in-up" : "opacity-0"}>
            <span className="text-[#F5A623] font-bold text-xs tracking-[0.2em]">
              ABOUT GOMS
            </span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-black text-[#1E1E1E] leading-[1.15] tracking-tight">
              외출제를
              <br />
              <span className="bg-gradient-to-r from-[#F5A623] to-[#FF8C00] bg-clip-text text-transparent">
                더 스마트하게.
              </span>
            </h2>
            <p className="mt-6 text-[#6B7280] text-base sm:text-lg leading-relaxed">
              GOMS는 광주소프트웨어마이스터고등학교의 외출제를 QR 코드 기반으로
              간편하게 관리하는 통합 시스템입니다. 학생은 QR 코드로 빠르게 외출
              인증을 하고, 학생회는 실시간으로 외출 현황을 관리할 수 있습니다.
            </p>
            <p className="mt-4 text-[#6B7280] text-base sm:text-lg leading-relaxed">
              Android, iOS, Backend를 아우르는{" "}
              <span className="font-bold text-[#1E1E1E]">Team HARIBO</span>가
              V1부터 V3까지 꾸준히 발전시켜온 프로젝트입니다.
            </p>
            <p className="mt-4 text-[#6B7280] text-base sm:text-lg leading-relaxed">
              <span className="font-bold text-[#F5A623]">5기</span>부터 시작된
              GOMS는 지금{" "}
              <span className="font-bold text-[#F5A623]">10기</span>까지, 선배가
              만든 코드 위에 후배가 새 기능을 얹으며 6년째 이어지고 있어요.
            </p>

            {/* Tag chips */}
            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "QR 인증",
                "실시간 동기화",
                "푸시 알림",
                "지각 자동 등록",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#F5A623]/20 text-[#1E1E1E] text-xs font-semibold shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`flex justify-center ${visible ? "animate-fade-in-up delay-200" : "opacity-0"}`}
          >
            <div className="relative group [perspective:1200px]">
              {/* Soft glow halo */}
              <div className="absolute inset-0 -m-8 bg-gradient-to-br from-[#F5A623]/30 to-[#FF8C00]/20 rounded-full blur-3xl pointer-events-none" />

              {/* 3D logo */}
              <div className="relative animate-float [transform-style:preserve-3d] group-hover:[transform:rotateY(-10deg)_rotateX(8deg)] transition-transform duration-700 ease-out">
                <Image
                  src="/goms-logo.svg"
                  alt="GOMS"
                  width={320}
                  height={320}
                  className="relative w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-[0_30px_50px_rgba(245,166,35,0.45)] drop-shadow-[0_15px_25px_rgba(245,166,35,0.35)] drop-shadow-[0_5px_10px_rgba(0,0,0,0.15)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: how it works (3 steps) */}
        <div
          className={`mt-20 sm:mt-24 ${visible ? "animate-fade-in-up delay-300" : "opacity-0"}`}
        >
          <div className="text-center mb-10">
            <span className="text-[#F5A623] font-bold text-xs tracking-[0.2em]">
              HOW IT WORKS
            </span>
            <h3 className="mt-3 text-2xl sm:text-3xl font-black text-[#1E1E1E] tracking-tight">
              외출, 단 세 단계로 끝.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {STEPS.map((step, i) => (
              <div key={step.step} className="relative group">
                <div className="relative h-full p-7 rounded-2xl bg-white border border-[#F5A623]/10 shadow-[0_8px_30px_-12px_rgba(245,166,35,0.15)] hover:shadow-[0_18px_40px_-15px_rgba(245,166,35,0.3)] hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#FF8C00] text-white flex items-center justify-center shadow-lg shadow-[#F5A623]/30">
                      {step.icon}
                    </div>
                    <span className="text-3xl font-black text-[#F5A623]/15 tracking-tight">
                      {step.step}
                    </span>
                  </div>
                  <h4 className="mt-5 text-lg font-bold text-[#1E1E1E] tracking-tight">
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Connector arrow (between cards on desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 items-center justify-center z-10">
                    <div className="w-6 h-6 rounded-full bg-white border border-[#F5A623]/20 flex items-center justify-center shadow-sm">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
