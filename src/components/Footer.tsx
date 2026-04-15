import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1E1E1E] text-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold">GOMS</h3>
            <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-xs">
              광주소프트웨어마이스터고등학교
              <br />
              외출제 통합 관리 시스템
            </p>
            <p className="mt-4 text-white/40 text-xs leading-relaxed max-w-xs">
              학생회와 팀 HARIBO가 함께 만들어가는, 더 편리한 학교 생활을 위한
              오픈소스 프로젝트입니다.
            </p>
            <a
              href="https://map.naver.com/p/search/광주광역시 광산구 상무대로 312"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-start gap-2 text-white/40 hover:text-[#F5A623] transition-colors text-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>광주광역시 광산구 상무대로 312</span>
            </a>

            {/* App download buttons */}
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="https://apps.apple.com/kr/app/goms/id6502936560"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.41-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                iOS 앱
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.goms.goms_android_v2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.201 12l2.497-2.49zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                </svg>
                Android 앱
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.18em] text-white/40 uppercase">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="#about"
                  className="text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  소개
                </a>
              </li>
              <li>
                <a
                  href="#members"
                  className="text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  멤버
                </a>
              </li>
              <li>
                <a
                  href="#versions"
                  className="text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  버전 히스토리
                </a>
              </li>
              <li>
                <Link
                  href="/apply"
                  className="text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  지원하기
                </Link>
              </li>
              <li>
                <Link
                  href="/apply/status"
                  className="text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  지원 현황 확인
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  어드민 페이지
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact + Legal */}
          <div>
            <h4 className="text-xs font-bold tracking-[0.18em] text-white/40 uppercase">
              Contact
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/team-haribo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  team-haribo
                </a>
              </li>
              <li>
                <a
                  href="mailto:developer.seojiwan@gmail.com"
                  className="flex items-center gap-2 text-white/60 hover:text-[#F5A623] transition-colors break-all"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  developer.seojiwan@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://discord.com/users/xixn2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="shrink-0">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  @xixn2
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/team-haribo/GOMS-WebSite/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  버그 제보
                </a>
              </li>
            </ul>

            <h4 className="mt-8 text-xs font-bold tracking-[0.18em] text-white/40 uppercase">
              Legal
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-white/60 hover:text-[#F5A623] transition-colors"
                >
                  개인정보 수집 · 이용
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p>&copy; {new Date().getFullYear()} team.HARIBO. All rights reserved.</p>
            <span className="hidden sm:inline text-white/20">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </span>
          </div>
          <p>
            Made by{" "}
            <a
              href="https://github.com/Xixn2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-[#F5A623] transition-colors font-medium"
            >
              @Xixn2
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
