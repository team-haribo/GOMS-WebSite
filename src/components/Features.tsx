"use client";

import Image from "next/image";
import { useInView } from "@/hooks/useInView";

const FEATURES = [
  {
    label: "외출 인증",
    accent: "#F5A623",
    bgGradient: "from-orange-50 to-amber-50",
    title: "외출은 QR 한 번으로\n간편하게.",
    description:
      "복잡한 종이 외출증은 그만. 학생증 QR로 1초 만에 외출을 인증하고, 출입 기록은 자동으로 남아요.",
    bullets: [
      { label: "1초", text: "QR 인증 시간" },
      { label: "자동", text: "출입 기록 저장" },
    ],
    mockup: "/feature-qr.png",
    framed: true,
    layout: "image-right" as const,
  },
  {
    label: "외출 현황",
    accent: "#10B981",
    bgGradient: "from-emerald-50 to-teal-50",
    title: "외출자 명단,\n실시간으로 확인.",
    description:
      "지금 누가 외출 중인지 한눈에 볼 수 있어요. 외출 시작·복귀 알림에, 지각자는 자동으로 등록까지.",
    bullets: [
      { label: "푸시", text: "외출 시작·복귀 알림" },
      { label: "자동", text: "지각자 등록" },
    ],
    mockup: "/feature-list.png",
    framed: true,
    layout: "image-left" as const,
  },
];

function FeatureBlock({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  const { ref, visible } = useInView();
  const isImageRight = feature.layout === "image-right";

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${
        index > 0 ? "mt-24 sm:mt-32" : ""
      }`}
    >
      {/* Text */}
      <div
        className={`${visible ? "animate-fade-in-up" : "opacity-0"} ${
          isImageRight ? "md:order-1" : "md:order-2"
        }`}
      >
        <span
          className="text-sm font-bold tracking-[0.18em]"
          style={{ color: feature.accent }}
        >
          {feature.label.toUpperCase()}
        </span>
        <h3 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black text-[#1E1E1E] tracking-tight leading-[1.2] whitespace-pre-line">
          {feature.title}
        </h3>
        <p className="mt-5 text-gray-500 text-base sm:text-lg leading-relaxed max-w-md">
          {feature.description}
        </p>

        {/* Bullets */}
        <div className="mt-8 flex flex-wrap gap-8">
          {feature.bullets.map((b) => (
            <div key={b.text}>
              <p
                className="text-3xl sm:text-4xl font-black tracking-tight"
                style={{ color: feature.accent }}
              >
                {b.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-500">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mockup — floating naturally */}
      <div
        className={`relative flex items-center justify-center ${
          visible ? "animate-fade-in-up delay-200" : "opacity-0"
        } ${isImageRight ? "md:order-2 md:justify-end" : "md:order-1 md:justify-start"}`}
      >
        {/* Subtle blob behind */}
        <div
          className="absolute w-80 h-80 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: feature.accent }}
        />

        {feature.framed ? (
          /* iPhone frame wrapper */
          <div
            className={`relative drop-shadow-[0_50px_60px_rgba(0,0,0,0.3)] ${
              isImageRight ? "rotate-[-3deg]" : "rotate-[3deg]"
            } hover:rotate-0 transition-transform duration-700`}
          >
            <div className="relative rounded-[44px] bg-[#1a1a1a] p-[10px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <div className="relative w-[230px] sm:w-[260px] aspect-[9/19.5] rounded-[36px] overflow-hidden bg-black">
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[26px] rounded-full bg-black z-10" />
                <Image
                  src={feature.mockup}
                  alt={feature.label}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`relative drop-shadow-[0_30px_50px_rgba(0,0,0,0.25)] ${
              isImageRight ? "rotate-[-3deg]" : "rotate-[3deg]"
            } hover:rotate-0 transition-transform duration-700`}
          >
            <Image
              src={feature.mockup}
              alt={feature.label}
              width={280}
              height={500}
              className="w-auto h-[420px] sm:h-[500px] object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Features() {
  const { ref, visible } = useInView();

  return (
    <section id="features" className="py-24 sm:py-32" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div
          className={`max-w-2xl ${visible ? "animate-fade-in-up" : "opacity-0"}`}
        >
          <span className="text-[#F5A623] font-bold text-xs tracking-[0.2em]">
            MAIN FEATURES
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black text-[#1E1E1E] tracking-tight leading-[1.15]">
            외출 관리,
            <br />
            <span className="bg-gradient-to-r from-[#F5A623] to-[#FF8C00] bg-clip-text text-transparent">
              이렇게 쉬워질 수 있어요.
            </span>
          </h2>
          <p className="mt-5 text-gray-500 text-base sm:text-lg">
            GOMS가 만든 작은 변화가, 학교의 하루를 어떻게 바꾸는지 보여드릴게요.
          </p>
        </div>

        {/* Feature blocks */}
        <div className="mt-20">
          {FEATURES.map((f, i) => (
            <FeatureBlock key={f.label} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
