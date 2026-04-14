"use client";

import { useInView } from "@/hooks/useInView";

export default function About() {
  const { ref, visible } = useInView();

  return (
    <section id="about" className="py-24 sm:py-32 bg-[#F4F2FF]" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className={visible ? "animate-fade-in-up" : "opacity-0"}>
            <span className="text-[#6C5CE7] font-semibold text-sm uppercase tracking-widest">
              About GOMS
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-[#2D2B55] leading-snug">
              외출제를
              <br />
              <span className="text-[#6C5CE7]">더 스마트하게</span>
            </h2>
            <p className="mt-6 text-[#64748B] text-lg leading-relaxed">
              GOMS는 광주소프트웨어마이스터고등학교의 외출제를 QR 코드 기반으로
              간편하게 관리하는 통합 시스템입니다. 학생은 QR 코드로 빠르게 외출
              인증을 하고, 교사는 실시간으로 외출 현황을 관리할 수 있습니다.
            </p>
            <p className="mt-4 text-[#64748B] text-lg leading-relaxed">
              Android, iOS, Backend를 아우르는 팀 HARIBO가 V1부터 V3까지 꾸준히
              발전시켜온 프로젝트입니다.
            </p>
          </div>

          <div className={`flex justify-center ${visible ? "animate-fade-in-up delay-200" : "opacity-0"}`}>
            <div className="relative">
              <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] p-1 animate-pulse-glow">
                <div className="w-full h-full rounded-3xl bg-white flex flex-col items-center justify-center gap-4">
                  <div className="text-6xl">📱</div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#2D2B55]">QR</p>
                    <p className="text-[#64748B] text-sm mt-1">Scan & Go</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 px-3 py-1.5 bg-white rounded-full shadow-lg text-sm font-medium text-emerald-600 animate-float">
                Backend
              </div>
              <div className="absolute -bottom-4 -left-4 px-3 py-1.5 bg-white rounded-full shadow-lg text-sm font-medium text-blue-600 animate-float delay-200">
                Android
              </div>
              <div className="absolute top-1/2 -right-8 px-3 py-1.5 bg-white rounded-full shadow-lg text-sm font-medium text-orange-600 animate-float delay-400">
                iOS
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
