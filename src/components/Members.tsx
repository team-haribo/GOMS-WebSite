"use client";

import Image from "next/image";
import { useState } from "react";
import { useInView } from "@/hooks/useInView";

interface Member {
  name: string;
  github: string;
  role: string;
  avatar: string;
}

const MEMBERS: Member[] = [
  { name: "엄지성", github: "Umjiseung", role: "Backend", avatar: "https://avatars.githubusercontent.com/u/127853946?v=4" },
  { name: "김태은", github: "snowykte0426", role: "Backend", avatar: "https://avatars.githubusercontent.com/u/140694064?v=4" },
  { name: "박성현", github: "Cjsghkd", role: "Android", avatar: "https://avatars.githubusercontent.com/u/84944098?v=4" },
  { name: "임가람", github: "ImGaram", role: "Android", avatar: "https://avatars.githubusercontent.com/u/84944117?v=4" },
  { name: "류수연", github: "ryusuye0n", role: "Android", avatar: "https://avatars.githubusercontent.com/u/204673419?v=4" },
  { name: "서지완", github: "Xixn2", role: "iOS", avatar: "https://avatars.githubusercontent.com/u/116987917?v=4" },
  { name: "선민재", github: "minaje0917", role: "iOS", avatar: "https://avatars.githubusercontent.com/u/81280223?v=4" },
  { name: "김준표", github: "juunpy0", role: "iOS", avatar: "https://avatars.githubusercontent.com/u/183229150?v=4" },
];

const ROLE_COLORS: Record<string, string> = {
  Backend: "bg-emerald-100 text-emerald-700",
  Android: "bg-blue-100 text-blue-700",
  iOS: "bg-orange-100 text-orange-700",
};

export default function Members() {
  const { ref, visible } = useInView();
  const [filter, setFilter] = useState("All");

  const roles = ["All", ...Array.from(new Set(MEMBERS.map((m) => m.role)))];
  const filtered = filter === "All" ? MEMBERS : MEMBERS.filter((m) => m.role === filter);

  return (
    <section id="members" className="py-24 sm:py-32 bg-[#FFF8EE]" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className={`text-center ${visible ? "animate-fade-in-up" : "opacity-0"}`}>
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

        <div className={`mt-10 flex justify-center gap-3 flex-wrap ${visible ? "animate-fade-in-up delay-200" : "opacity-0"}`}>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                filter === role
                  ? "bg-[#F5A623] text-white shadow-md shadow-[#F5A623]/25"
                  : "bg-white text-[#6B7280] hover:bg-[#F5A623]/5 hover:text-[#F5A623] border border-gray-200"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((member, i) => (
            <a
              key={member.github}
              href={`https://github.com/${member.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center ${
                visible ? `animate-fade-in-up delay-${Math.min((i + 3) * 100, 800)}` : "opacity-0"
              }`}
            >
              <Image
                src={member.avatar}
                alt={member.name}
                width={80}
                height={80}
                className="mx-auto rounded-full ring-2 ring-gray-100 group-hover:ring-[#F5A623]/30 transition-all"
              />
              <p className="mt-4 font-bold text-[#1E1E1E] group-hover:text-[#F5A623] transition-colors">
                {member.name}
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">@{member.github}</p>
              <span className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                {member.role}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
