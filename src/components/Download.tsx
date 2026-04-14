"use client";

import { useInView } from "@/hooks/useInView";

export default function Download() {
  const { ref, visible } = useInView();

  return (
    <section className="py-24 sm:py-32 bg-[#1E1E1E]" ref={ref}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className={visible ? "animate-fade-in-up" : "opacity-0"}>
          <span className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest">
            Download
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
            지금 바로 GOMS를 사용해보세요
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            GOMS V2는 App Store와 Google Play에서 무료로 다운로드할 수 있습니다
          </p>
        </div>

        <div
          className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 ${visible ? "animate-fade-in-up delay-200" : "opacity-0"}`}
        >
          <a
            href="https://apps.apple.com/kr/app/goms/id6502936560"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-[#1E1E1E] font-medium hover:bg-gray-100 transition-colors min-w-[200px]"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 leading-none">
                Download on the
              </p>
              <p className="text-lg font-semibold leading-tight">App Store</p>
            </div>
          </a>

          <a
            href="https://play.google.com/store/apps/details?id=com.goms.goms_android_v2"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-[#1E1E1E] font-medium hover:bg-gray-100 transition-colors min-w-[200px]"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92z"
                fill="#4285F4"
              />
              <path
                d="M17.556 8.246L5.048.97a1.002 1.002 0 0 0-1.44.844L13.793 12l3.763-3.754z"
                fill="#EA4335"
              />
              <path
                d="M17.556 15.754L13.793 12 3.609 22.186a1 1 0 0 0 1.439.844l12.508-7.276z"
                fill="#34A853"
              />
              <path
                d="M21.395 12c0-.375-.132-.749-.395-1.065l-3.444-2.689L13.793 12l3.763 3.754 3.444-2.689c.263-.316.395-.69.395-1.065z"
                fill="#FBBC05"
              />
            </svg>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 leading-none">GET IT ON</p>
              <p className="text-lg font-semibold leading-tight">Google Play</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
