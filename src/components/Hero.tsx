"use client";

import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#1E1E1E]">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#F5A623]/15 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#FF8C00]/15 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F5A623]/5 rounded-full blur-3xl" />
      </div>

      {/* GOMS logo watermark — offset to side, partially clipped */}
      <div className="absolute -right-32 -bottom-32 sm:-right-48 sm:-bottom-48 pointer-events-none select-none">
        <Image
          src="/goms-logo.svg"
          alt=""
          width={700}
          height={700}
          priority={false}
          className="w-[420px] sm:w-[600px] md:w-[700px] h-auto opacity-[0.04] invert -rotate-12"
        />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Team badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/15 text-[#F5A623] text-sm font-medium mb-8">
          <Image
            src="https://avatars.githubusercontent.com/u/128011223?v=4"
            alt="HARIBO"
            width={24}
            height={24}
            className="rounded-full"
          />
          team.HARIBO
        </div>

        {/* Main heading */}
        <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-[#F5A623] via-[#FF8C00] to-[#FFCB6B] bg-clip-text text-transparent">
            GOMS
          </span>
        </h1>

        <p className="animate-fade-in-up delay-200 mt-4 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
          광주소프트웨어마이스터고등학교
          <br />
          외출제 통합 관리 시스템
        </p>

        {/* Slogan */}
        <p className="animate-fade-in-up delay-300 mt-6 text-2xl sm:text-3xl font-bold text-white">
          외출제를 QR로 간편하게.
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up delay-400 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/apply"
            prefetch
            className="group px-8 py-3.5 rounded-full bg-[#F5A623] text-white font-semibold hover:bg-[#E8961A] hover:scale-[1.03] transition-all hover:shadow-lg hover:shadow-[#F5A623]/25 inline-flex items-center gap-2"
          >
            지원하기
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:translate-x-0.5 transition-transform"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href="https://github.com/team-haribo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 rounded-full border-2 border-[#F5A623]/30 text-[#F5A623] font-semibold hover:bg-[#F5A623]/10 transition-all"
          >
            GitHub 방문
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-500">
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
