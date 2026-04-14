"use client";

import Image from "next/image";
import { useInView } from "@/hooks/useInView";

const VERSIONS = [
  {
    version: "V1",
    status: "운영 종료",
    statusColor: "bg-gray-200 text-gray-600",
    period: "2023",
    description:
      "GOMS의 시작. 수기로 관리하던 외출제를 QR 코드 기반 디지털 시스템으로 전환한 첫 번째 버전입니다.",
    features: [
      "QR 코드 기반 외출 인증",
      "외출 학생 실시간 조회",
      "지각 학생 자동 블랙리스트",
    ],
    tech: ["Android (XML)", "iOS (UIKit)", "Spring Boot"],
    ios: "https://apps.apple.com/kr/app/goms/id6449974156",
    android:
      "https://play.google.com/store/apps/details?id=com.goms.presentation&hl=en-KR",
    mockups: [] as string[],
    screenshots: [
      "https://github.com/team-goms/GOMS-Android/assets/84944098/d3b3cd2f-1233-4abe-9f79-3af32ab36f97",
      "https://github.com/team-goms/GOMS-Android/assets/84944098/d5b743b8-1ed7-4aea-9584-acd4a1cb7a42",
      "https://github.com/team-goms/GOMS-Android/assets/84944098/e7e214bb-e9ba-4ddd-8a65-239f60475c4c",
    ],
  },
  {
    version: "V2",
    status: "현재 운영 중",
    statusColor: "bg-green-100 text-green-700",
    period: "2024",
    description:
      "V1의 경험을 바탕으로 전면 리뉴얼. UI/UX 개선, 푸시 알림, 관리자 기능을 강화한 안정적인 운영 버전입니다.",
    features: [
      "개선된 UI/UX 디자인",
      "외출제 푸시 알림",
      "관리자 전용 기능 강화",
      "학생 권한 관리 시스템",
    ],
    tech: ["Android (Jetpack Compose)", "iOS (UIKit + Combine)", "Spring Boot"],
    ios: "https://apps.apple.com/kr/app/goms/id6502936560",
    android:
      "https://play.google.com/store/apps/details?id=com.goms.goms_android_v2",
    screenshots: [],
    mockups: ["/v2-mockup-1.png", "/v2-mockup-2.png"],
  },
  {
    version: "V3",
    status: "개발 중",
    statusColor: "bg-[#F5A623]/15 text-[#F5A623]",
    period: "2025 ~",
    description:
      "차세대 GOMS. 새로운 기술 스택과 아키텍처로 더욱 빠르고 안정적인 서비스를 목표로 개발 중입니다.",
    features: [
      "새로운 기술 스택 도입",
      "아키텍처 전면 개선",
      "더 빠른 성능",
      "Coming Soon...",
    ],
    tech: ["Android (New)", "iOS (SwiftUI)", "Spring Boot"],
    ios: null,
    android: null,
    mockups: [] as string[],
    screenshots: [],
  },
];

export default function Versions() {
  const { ref, visible } = useInView();

  return (
    <section id="versions" className="py-24 sm:py-32" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div
          className={`text-center ${visible ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <span className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest">
            Version History
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-[#1E1E1E]">
            GOMS의 발자취
          </h2>
          <p className="mt-4 text-[#6B7280] text-lg">
            매 버전 더 나은 서비스를 만들어갑니다
          </p>
        </div>

        {/* Timeline */}
        <div className="mt-16 relative">
          {/* Center line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />

          {VERSIONS.map((v, i) => (
            <div
              key={v.version}
              className={`relative mb-16 last:mb-0 ${visible ? `animate-fade-in-up delay-${(i + 2) * 100}` : "opacity-0"}`}
            >
              {/* Timeline dot */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#F5A623] items-center justify-center text-white font-bold text-sm z-10 shadow-lg shadow-[#F5A623]/25">
                {v.version}
              </div>

              <div
                className={`md:w-[calc(50%-40px)] ${i % 2 === 0 ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"}`}
              >
                <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="md:hidden text-2xl font-bold text-[#F5A623]">
                      {v.version}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${v.statusColor}`}
                    >
                      {v.status}
                    </span>
                    <span className="text-sm text-[#6B7280]">{v.period}</span>
                  </div>

                  <p className="text-[#6B7280] leading-relaxed">
                    {v.description}
                  </p>

                  {/* Features */}
                  <div className="mt-4">
                    <ul className="space-y-1.5">
                      {v.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-[#6B7280]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech Stack */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {v.tech.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-md bg-gray-50 text-xs font-medium text-[#6B7280]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Mockup Images (V2) */}
                  {v.mockups.length > 0 && (
                    <div className="mt-5 flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                      {v.mockups.map((src, si) => (
                        <div
                          key={si}
                          className="shrink-0 rounded-xl overflow-hidden bg-[#1E1E1E] shadow-lg"
                        >
                          <Image
                            src={src}
                            alt={`${v.version} mockup ${si + 1}`}
                            width={280}
                            height={500}
                            className="w-auto h-[280px] object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Screenshots (V1) */}
                  {v.screenshots.length > 0 && (
                    <div className="mt-5 flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                      {v.screenshots.map((src, si) => (
                        <div
                          key={si}
                          className="shrink-0 w-24 h-48 rounded-xl overflow-hidden bg-gray-100 shadow-sm"
                        >
                          <Image
                            src={src}
                            alt={`${v.version} screenshot ${si + 1}`}
                            width={96}
                            height={192}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Store Links */}
                  {(v.ios || v.android) && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {v.ios && (
                        <a
                          href={v.ios}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E1E1E] text-white text-sm font-medium hover:bg-black transition-colors"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                          </svg>
                          App Store
                        </a>
                      )}
                      {v.android && (
                        <a
                          href={v.android}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E1E1E] text-white text-sm font-medium hover:bg-black transition-colors"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17.523 2.276l1.837-1.837a.5.5 0 0 0-.707-.707L16.7 1.685A8.948 8.948 0 0 0 12 .5a8.948 8.948 0 0 0-4.7 1.185L5.347-.268a.5.5 0 0 0-.707.707L6.477 2.276A9 9 0 0 0 3 9h18a9 9 0 0 0-3.477-6.724zM9 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM3 10v8a2 2 0 0 0 2 2h1v3a1.5 1.5 0 0 0 3 0v-3h6v3a1.5 1.5 0 0 0 3 0v-3h1a2 2 0 0 0 2-2v-8H3zm-2.5 0a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 3 0v-5a1.5 1.5 0 0 0-1.5-1.5zm23 0a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 3 0v-5a1.5 1.5 0 0 0-1.5-1.5z" />
                          </svg>
                          Play Store
                        </a>
                      )}
                    </div>
                  )}

                  {/* V3 Coming Soon */}
                  {!v.ios && !v.android && v.screenshots.length === 0 && (
                    <div className="mt-5 py-8 rounded-xl bg-gradient-to-br from-[#F5A623]/5 to-[#FF8C00]/5 border border-dashed border-[#F5A623]/30 flex items-center justify-center">
                      <p className="text-[#F5A623] font-medium text-sm">
                        🚧 Coming Soon...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
