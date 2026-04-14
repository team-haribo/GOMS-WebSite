"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

const VERSIONS = [
  {
    version: "V1",
    label: "FIRST RELEASE",
    status: "운영 종료",
    period: "2023.06",
    title: "수기 관리에서\n디지털로.",
    description:
      "수기로 관리하던 외출제를 QR 코드 기반 디지털 시스템으로 전환한 첫 번째 버전.",
    features: [
      "QR 코드 기반 외출 인증",
      "외출 학생 실시간 조회",
      "지각 학생 자동 블랙리스트",
    ],
    tech: ["iOS UIKit", "Android XML", "Spring Boot"],
    ios: "https://apps.apple.com/kr/app/goms/id6449974156",
    android:
      "https://play.google.com/store/apps/details?id=com.goms.presentation&hl=en-KR",
    mockups: ["/v1-screen-1.png", "/v1-screen-2.png"] as string[],
    accent: "#9CA3AF", // gray
    bgGradient: "from-gray-50 to-gray-100",
    chipBg: "bg-gray-200",
    chipText: "text-gray-700",
  },
  {
    version: "V2",
    label: "CURRENT VERSION",
    status: "현재 운영 중",
    period: "2024.06",
    title: "더 빠르게,\n더 안정적으로.",
    description:
      "V1의 경험을 바탕으로 UI/UX·푸시 알림·관리자 기능을 전면 개선한 운영 버전.",
    features: [
      "개선된 UI/UX 디자인",
      "외출제 푸시 알림",
      "관리자 전용 기능 강화",
      "학생 권한 관리 시스템",
    ],
    tech: ["UIKit + Combine", "Jetpack Compose", "Spring Boot"],
    ios: "https://apps.apple.com/kr/app/goms/id6502936560",
    android:
      "https://play.google.com/store/apps/details?id=com.goms.goms_android_v2",
    mockups: ["/v2-mockup-1.png", "/v2-mockup-2.png"],
    accent: "#3B82F6", // blue
    bgGradient: "from-[#EEF4FF] to-[#F8FAFF]",
    chipBg: "bg-blue-100",
    chipText: "text-blue-700",
  },
  {
    version: "V3",
    label: "NEXT GENERATION",
    status: "개발 중",
    period: "2026.01 ~",
    title: "차세대 GOMS,\n곧 만나요.",
    description:
      "새로운 기술 스택과 아키텍처로 더욱 빠르고 안정적인 서비스를 목표로 개발 중.",
    features: [
      "지도 기반 외출 위치 확인",
      "자주 가는 장소 추천",
      "장소 후기 공유",
      "아키텍처 전면 개선",
    ],
    tech: ["iOS UIKit", "Android (New)", "Spring Boot"],
    ios: null,
    android: null,
    mockups: ["/v3-screen-1.png", "/v3-screen-2.png"] as string[],
    accent: "#F5A623", // orange
    bgGradient: "from-orange-50 to-amber-50",
    chipBg: "bg-[#F5A623]/15",
    chipText: "text-[#F5A623]",
  },
];

type Version = (typeof VERSIONS)[number];

function VersionCard({ v, isActive }: { v: Version; isActive: boolean }) {
  return (
    <div className="snap-center shrink-0 w-[88%] sm:w-[78%] md:w-[68%] lg:w-[60%] px-3 sm:px-4">
      <div
        className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${v.bgGradient} border border-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] transition-all duration-700 ease-out origin-center ${
          isActive ? "scale-100 opacity-100" : "scale-[0.94] opacity-60"
        }`}
      >
        {/* Decorative blob */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: v.accent }}
        />

        <div className="relative p-7 sm:p-10">
          {/* Eyebrow label */}
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold tracking-[0.18em]"
              style={{ color: v.accent }}
            >
              {v.label}
            </span>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] font-semibold text-gray-500">
              {v.period}
            </span>
          </div>

          {/* Big version + status */}
          <div className="mt-3 flex items-baseline gap-3">
            <h3 className="text-6xl sm:text-7xl font-black text-[#1E1E1E] tracking-tight leading-none">
              {v.version}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${v.chipBg} ${v.chipText}`}
            >
              {v.status}
            </span>
          </div>

          {/* Title — Toss-style big bold heading */}
          <h4 className="mt-5 text-2xl sm:text-3xl font-bold text-[#1E1E1E] tracking-tight leading-snug whitespace-pre-line">
            {v.title}
          </h4>

          {/* Description */}
          <p className="mt-3 text-sm sm:text-base text-gray-500 leading-relaxed max-w-md">
            {v.description}
          </p>

          {/* Body grid: features (left) + mockup (right) */}
          <div className="mt-7 flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="flex-1 min-w-0">
              {/* Features with check icons */}
              <ul className="space-y-2">
                {v.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm font-medium text-gray-700"
                  >
                    <span
                      className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                      style={{ background: `${v.accent}22` }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={v.accent}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Tech Stack */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {v.tech.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg bg-white/70 backdrop-blur-sm text-[11px] font-semibold text-gray-600 border border-white"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Store Links */}
              {(v.ios || v.android) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {v.ios && (
                    <a
                      href={v.ios}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E1E1E] text-white hover:scale-[1.03] transition-transform"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      <span className="text-xs font-bold">App Store</span>
                    </a>
                  )}
                  {v.android && (
                    <a
                      href={v.android}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E1E1E] text-white hover:scale-[1.03] transition-transform"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z" fill="#4285F4" />
                        <path d="M17.556 8.246L5.048.97a1.002 1.002 0 0 0-1.44.844L13.793 12l3.763-3.754z" fill="#EA4335" />
                        <path d="M17.556 15.754L13.793 12 3.609 22.186a1 1 0 0 0 1.439.844l12.508-7.276z" fill="#34A853" />
                        <path d="M21.395 12c0-.375-.132-.749-.395-1.065l-3.444-2.689L13.793 12l3.763 3.754 3.444-2.689c.263-.316.395-.69.395-1.065z" fill="#FBBC05" />
                      </svg>
                      <span className="text-xs font-bold">Google Play</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Floating mockup */}
            {v.mockups.length > 0 && (
              <div className="flex justify-center sm:justify-end shrink-0">
                <div className="relative flex gap-3">
                  {v.mockups.map((src, si) => (
                    <div
                      key={si}
                      className={`shrink-0 rounded-2xl overflow-hidden bg-[#1E1E1E] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-transform duration-500 ${
                        si === 0 ? "rotate-[-4deg]" : "rotate-[4deg] -ml-4 mt-4"
                      }`}
                    >
                      <Image
                        src={src}
                        alt={`${v.version} mockup ${si + 1}`}
                        width={140}
                        height={250}
                        className="w-auto h-[220px] object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* V3: Coming soon placeholder */}
            {v.mockups.length === 0 && (
              <div
                className="hidden sm:flex shrink-0 sm:w-[180px] h-[220px] rounded-2xl items-center justify-center text-center"
                style={{
                  background: `${v.accent}10`,
                  border: `2px dashed ${v.accent}40`,
                }}
              >
                <span
                  className="text-2xl font-black"
                  style={{ color: v.accent }}
                >
                  {v.version === "V3" ? "✦" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Versions() {
  const { ref, visible } = useInView();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(1); // V2 default (현재 운영중)
  const activeRef = useRef(1);
  const lockRef = useRef(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const goTo = (i: number, behavior: ScrollBehavior = "smooth") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const clamped = Math.max(0, Math.min(VERSIONS.length - 1, i));
    const slide = scroller.children[clamped] as HTMLElement | undefined;
    if (!slide) return;
    const target =
      slide.offsetLeft - (scroller.clientWidth - slide.offsetWidth) / 2;
    scroller.scrollTo({ left: target, behavior });
    setActive(clamped);
    activeRef.current = clamped;
  };

  // 한 번에 1슬라이드만 이동 (lock으로 빠른 입력 차단)
  const advance = (dir: 1 | -1) => {
    if (lockRef.current) return;
    const next = activeRef.current + dir;
    if (next < 0 || next >= VERSIONS.length) return;
    lockRef.current = true;
    goTo(next);
    setTimeout(() => {
      lockRef.current = false;
    }, 600);
  };

  // wheel: 가로 입력만 캐러셀로 변환, 세로는 페이지 스크롤에 양보
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onWheel = (e: WheelEvent) => {
      // 가로 성분이 세로보다 명확히 클 때만 가로 이동
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaX) < 10) return;
      e.preventDefault();
      advance(e.deltaX > 0 ? 1 : -1);
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // touch: 스와이프 방향만 보고 1슬라이드 이동
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    advance(dx < 0 ? 1 : -1);
  };

  // 초기 위치를 V2로
  useEffect(() => {
    goTo(1, "instant" as ScrollBehavior);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="versions" className="py-20 sm:py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div
          className={`text-center ${visible ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <span className="text-[#F5A623] font-bold text-xs tracking-[0.2em]">
            VERSION HISTORY
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black text-[#1E1E1E] tracking-tight">
            한 걸음 한 걸음,
            <br />
            <span className="bg-gradient-to-r from-[#F5A623] to-[#FF8C00] bg-clip-text text-transparent">
              GOMS의 발자취
            </span>
          </h2>
          <p className="mt-5 text-gray-500 text-base sm:text-lg">
            매 버전 더 나은 서비스를 만들어갑니다.
          </p>
        </div>
      </div>

      {/* Carousel */}
      <div className={`mt-10 relative ${visible ? "animate-fade-in-up delay-200" : "opacity-0"}`}>
        <div
          ref={scrollerRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="flex overflow-x-hidden scroll-smooth scrollbar-hide touch-pan-y"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {VERSIONS.map((v, i) => (
            <VersionCard key={v.version} v={v} isActive={i === active} />
          ))}
        </div>

        {/* Fade edges — hint at more content */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white via-white/70 to-transparent pointer-events-none transition-opacity duration-300 ${
            active === 0 ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          className={`absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-white via-white/70 to-transparent pointer-events-none transition-opacity duration-300 ${
            active === VERSIONS.length - 1 ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Arrows */}
        <button
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="이전 버전"
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-[#1E1E1E] hover:bg-[#F5A623] hover:text-white hover:border-transparent transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1E1E1E]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={() => goTo(Math.min(VERSIONS.length - 1, active + 1))}
          disabled={active === VERSIONS.length - 1}
          aria-label="다음 버전"
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-[#1E1E1E] hover:bg-[#F5A623] hover:text-white hover:border-transparent transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1E1E1E]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Dots */}
      <div className="mt-8 flex items-center justify-center gap-3">
        {VERSIONS.map((v, i) => (
          <button
            key={v.version}
            onClick={() => goTo(i)}
            aria-label={`${v.version}로 이동`}
            className={`transition-all duration-300 rounded-full ${
              active === i
                ? "w-8 h-2 bg-[#F5A623]"
                : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
