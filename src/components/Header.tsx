"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "versions", label: "Versions" },
  { id: "values", label: "Values" },
  { id: "members", label: "Members" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      // 새로고침 복원용 — 스크롤 위치 저장
      sessionStorage.setItem("goms:scrollY", String(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll spy: 화면 상단(40%) 기준으로 가장 보이는 섹션 찾기
  useEffect(() => {
    const sections = NAV_ITEMS.map((item) =>
      document.getElementById(item.id),
    ).filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 보이는 섹션 중 가장 위에 있는 것 선택
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0,
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href="#"
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
        </a>
        <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`relative px-3 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "text-[#F5A623] font-semibold"
                    : "text-[#6B7280] hover:text-[#1E1E1E]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-0 -z-10 rounded-full bg-[#F5A623]/10" />
                )}
              </a>
            );
          })}
        </nav>
        <a
          href="https://github.com/team-haribo"
          target="_blank"
          rel="noopener noreferrer"
          className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 hover:shadow-lg hover:shadow-black/20 active:scale-95 transition-all duration-200 ${
            scrolled
              ? "bg-[#24292f] text-white hover:bg-[#F5A623]"
              : "bg-[#24292f]/90 text-white hover:bg-[#F5A623]"
          }`}
        >
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </header>
  );
}
