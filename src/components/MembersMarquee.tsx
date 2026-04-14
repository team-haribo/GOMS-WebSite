"use client";

import Image from "next/image";
import { useInView } from "@/hooks/useInView";
import type { Member } from "@/lib/getMembers";

const ROLE_STYLES: Record<
  string,
  { text: string; dot: string; ring: string; glow: string; bg: string }
> = {
  Backend: {
    text: "text-emerald-600",
    dot: "bg-emerald-500",
    ring: "group-hover:ring-emerald-400/40",
    glow: "group-hover:shadow-emerald-400/20",
    bg: "from-emerald-50",
  },
  Android: {
    text: "text-blue-600",
    dot: "bg-blue-500",
    ring: "group-hover:ring-blue-400/40",
    glow: "group-hover:shadow-blue-400/20",
    bg: "from-blue-50",
  },
  iOS: {
    text: "text-[#F5A623]",
    dot: "bg-[#F5A623]",
    ring: "group-hover:ring-[#F5A623]/40",
    glow: "group-hover:shadow-[#F5A623]/20",
    bg: "from-orange-50",
  },
  Flutter: {
    text: "text-cyan-600",
    dot: "bg-cyan-500",
    ring: "group-hover:ring-cyan-400/40",
    glow: "group-hover:shadow-cyan-400/20",
    bg: "from-cyan-50",
  },
  Design: {
    text: "text-pink-600",
    dot: "bg-pink-500",
    ring: "group-hover:ring-pink-400/40",
    glow: "group-hover:shadow-pink-400/20",
    bg: "from-pink-50",
  },
  Member: {
    text: "text-[#6B7280]",
    dot: "bg-gray-400",
    ring: "group-hover:ring-gray-300",
    glow: "group-hover:shadow-gray-300/20",
    bg: "from-gray-50",
  },
};

function MemberCard({ member }: { member: Member }) {
  const style = ROLE_STYLES[member.role] ?? ROLE_STYLES.Member;

  return (
    <a
      href={`https://github.com/${member.github}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-gray-100/80 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12)] ${style.glow} hover:-translate-y-1 hover:border-transparent transition-all duration-300 min-w-[240px] group overflow-hidden`}
    >
      {/* Subtle gradient accent on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${style.bg} via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="relative shrink-0">
        <Image
          src={member.avatar}
          alt={member.name}
          width={52}
          height={52}
          className={`rounded-full ring-2 ring-gray-100 ${style.ring} transition-all duration-300`}
        />
        {/* Role color dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${style.dot} ring-2 ring-white`}
        />
      </div>

      <div className="relative min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-[#1E1E1E] whitespace-nowrap tracking-tight">
            {member.name}
          </p>
          {member.leader && (
            <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[#F5A623] to-[#FF8C00] text-white text-[10px] font-bold whitespace-nowrap shadow-sm shadow-[#F5A623]/30">
              {member.leader}기 LEADER
            </span>
          )}
        </div>
        <p
          className={`text-xs font-semibold tracking-wider mt-0.5 ${style.text} whitespace-nowrap`}
        >
          {member.role}
        </p>
      </div>
    </a>
  );
}

function MarqueeRow({
  members,
  direction,
}: {
  members: Member[];
  direction: "left" | "right";
}) {
  const items = [...members, ...members, ...members, ...members];

  return (
    <div className="relative overflow-hidden py-3 group/marquee">
      {/* Wider, smoother fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FFF8EE] via-[#FFF8EE]/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FFF8EE] via-[#FFF8EE]/80 to-transparent z-10 pointer-events-none" />

      <div
        className={`flex gap-5 w-max ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        } group-hover/marquee:[animation-play-state:paused]`}
      >
        {items.map((member, i) => (
          <MemberCard key={`${member.github}-${i}`} member={member} />
        ))}
      </div>
    </div>
  );
}

export default function MembersMarquee({ members }: { members: Member[] }) {
  const { ref, visible } = useInView();

  // 두 줄 모두 전체 멤버 표시 — 두 번째 줄은 역할 순서를 첫 번째 줄과 반대로
  const row1 = members;
  const row2 = [...members].reverse();

  return (
    <div ref={ref} className="relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-[#FF8C00]/8 rounded-full blur-3xl pointer-events-none" />

      <div
        className={`relative text-center px-6 ${visible ? "animate-fade-in-up" : "opacity-0"}`}
      >
        {/* Decorative dividers around eyebrow */}
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#F5A623]/40" />
          <span className="text-[#F5A623] font-semibold text-sm uppercase tracking-[0.2em]">
            Team Members
          </span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#F5A623]/40" />
        </div>

        <h2 className="mt-5 text-4xl sm:text-5xl font-bold text-[#1E1E1E] tracking-tight">
          Team <span className="bg-gradient-to-r from-[#F5A623] to-[#FF8C00] bg-clip-text text-transparent">HARIBO</span>
        </h2>
        <p className="mt-4 text-[#6B7280] text-lg">
          GOMS를 함께 만들어가는 멤버들입니다
        </p>

        {/* Member count badge */}
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#F5A623]/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
          <span className="text-sm font-semibold text-[#1E1E1E]">
            {members.length} Members
          </span>
        </div>
      </div>

      <div
        className={`relative mt-14 space-y-4 ${visible ? "animate-fade-in-up delay-200" : "opacity-0"}`}
      >
        <MarqueeRow members={row1} direction="left" />
        {row2.length > 0 && <MarqueeRow members={row2} direction="right" />}
      </div>
    </div>
  );
}
