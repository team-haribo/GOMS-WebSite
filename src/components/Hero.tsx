"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6C5CE7]/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#00CEC9]/20 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A29BFE]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] text-sm font-medium mb-8">
          <Image
            src="https://avatars.githubusercontent.com/u/128011223?v=4"
            alt="HARIBO"
            width={24}
            height={24}
            className="rounded-full"
          />
          team.HARIBO
        </div>

        <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-[#6C5CE7] via-[#5A4BD1] to-[#00CEC9] bg-clip-text text-transparent">
            GOMS
          </span>
        </h1>

        <p className="animate-fade-in-up delay-200 mt-4 text-lg sm:text-xl text-[#64748B] max-w-2xl mx-auto">
          광주소프트웨어마이스터고등학교
          <br />
          외출제 통합 관리 시스템
        </p>

        <p className="animate-fade-in-up delay-300 mt-6 text-2xl sm:text-3xl font-bold text-[#2D2B55]">
          외출제를 QR로 간편하게.
        </p>

        <div className="animate-fade-in-up delay-400 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#about"
            className="px-8 py-3.5 rounded-full bg-[#6C5CE7] text-white font-semibold hover:bg-[#5A4BD1] transition-all hover:shadow-lg hover:shadow-[#6C5CE7]/25"
          >
            더 알아보기
          </a>
          <a
            href="https://github.com/team-haribo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 rounded-full border-2 border-[#6C5CE7]/20 text-[#6C5CE7] font-semibold hover:bg-[#6C5CE7]/5 transition-all"
          >
            GitHub 방문
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#64748B]">
          <path
            d="M12 5v14M5 12l7 7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
