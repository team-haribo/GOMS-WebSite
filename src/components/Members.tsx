"use client";

import Image from "next/image";
import { useInView } from "@/hooks/useInView";

interface Member {
  name: string;
  github: string;
  role: string;
  avatar: string;
}

const MEMBERS_ROW1: Member[] = [
  { name: "엄지성", github: "Umjiseung", role: "Backend", avatar: "https://avatars.githubusercontent.com/u/127853946?v=4" },
  { name: "김태은", github: "snowykte0426", role: "Backend", avatar: "https://avatars.githubusercontent.com/u/140694064?v=4" },
  { name: "박성현", github: "Cjsghkd", role: "Android", avatar: "https://avatars.githubusercontent.com/u/84944098?v=4" },
  { name: "임가람", github: "ImGaram", role: "Android", avatar: "https://avatars.githubusercontent.com/u/84944117?v=4" },
];

const MEMBERS_ROW2: Member[] = [
  { name: "류수연", github: "ryusuye0n", role: "Android", avatar: "https://avatars.githubusercontent.com/u/204673419?v=4" },
  { name: "서지완", github: "Xixn2", role: "iOS", avatar: "https://avatars.githubusercontent.com/u/116987917?v=4" },
  { name: "선민재", github: "minaje0917", role: "iOS", avatar: "https://avatars.githubusercontent.com/u/81280223?v=4" },
  { name: "김준표", github: "juunpy0", role: "iOS", avatar: "https://avatars.githubusercontent.com/u/183229150?v=4" },
];

const ROLE_COLORS: Record<string, string> = {
  Backend: "text-emerald-500",
  Android: "text-blue-500",
  iOS: "text-[#F5A623]",
};

function MemberCard({ member }: { member: Member }) {
  return (
    <a
      href={`https://github.com/${member.github}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-6 py-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#F5A623]/20 transition-all duration-300 min-w-[220px] group"
    >
      <Image
        src={member.avatar}
        alt={member.name}
        width={48}
        height={48}
        className="rounded-full ring-2 ring-gray-100 group-hover:ring-[#F5A623]/30 transition-all shrink-0"
      />
      <div>
        <p className="font-bold text-[#1E1E1E] group-hover:text-[#F5A623] transition-colors whitespace-nowrap">
          {member.name}
        </p>
        <p className={`text-sm font-medium ${ROLE_COLORS[member.role]} whitespace-nowrap`}>
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
  // Duplicate items for seamless loop
  const items = [...members, ...members, ...members, ...members];

  return (
    <div className="relative overflow-hidden py-2 group/marquee">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#FFF8EE] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#FFF8EE] to-transparent z-10 pointer-events-none" />

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

export default function Members() {
  const { ref, visible } = useInView();

  return (
    <section id="members" className="py-24 sm:py-32 bg-[#FFF8EE]" ref={ref}>
      <div className={`text-center px-6 ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
        <span className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest">
          Team Members
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-[#1E1E1E]">
          팀 HARIBO
        </h2>
        <p className="mt-4 text-[#6B7280] text-lg">
          GOMS를 함께 만들어가는 멤버들입니다
        </p>
      </div>

      <div className={`mt-12 space-y-5 ${visible ? "animate-fade-in-up delay-200" : "opacity-0"}`}>
        <MarqueeRow members={MEMBERS_ROW1} direction="left" />
        <MarqueeRow members={MEMBERS_ROW2} direction="right" />
      </div>
    </section>
  );
}
