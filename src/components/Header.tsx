"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="text-xl font-bold text-[#2D2B55] tracking-tight">
          GOMS
        </a>
        <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-[#64748B]">
          <a href="#about" className="hover:text-[#6C5CE7] transition-colors">
            소개
          </a>
          <a href="#values" className="hover:text-[#6C5CE7] transition-colors">
            가치
          </a>
          <a href="#members" className="hover:text-[#6C5CE7] transition-colors">
            멤버
          </a>
        </nav>
        <a
          href="https://github.com/team-haribo"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-full bg-[#6C5CE7] text-white text-sm font-medium hover:bg-[#5A4BD1] transition-colors"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
