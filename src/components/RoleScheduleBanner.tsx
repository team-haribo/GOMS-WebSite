"use client";

import { useEffect, useState } from "react";

interface Props {
  openAt?: string | null;
  closeAt?: string | null;
  color: string;
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diffParts(targetMs: number, nowMs: number): CountdownParts {
  let total = Math.max(0, targetMs - nowMs);
  const days = Math.floor(total / 86400000);
  total -= days * 86400000;
  const hours = Math.floor(total / 3600000);
  total -= hours * 3600000;
  const minutes = Math.floor(total / 60000);
  total -= minutes * 60000;
  const seconds = Math.floor(total / 1000);
  return { days, hours, minutes, seconds };
}

function formatFullDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const yearPart = sameYear ? "" : `${d.getFullYear()}. `;
  const dateStr = `${yearPart}${month}월 ${day}일 (${weekday})`;
  const hour = d.getHours();
  const min = d.getMinutes();
  const ampm = hour < 12 ? "오전" : "오후";
  const h12 = hour % 12 || 12;
  const minStr = min.toString().padStart(2, "0");
  return { date: dateStr, time: `${ampm} ${h12}:${minStr}` };
}

export default function RoleScheduleBanner({ openAt, closeAt, color }: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const opensAtMs = openAt ? new Date(openAt).getTime() : null;
  const closesAtMs = closeAt ? new Date(closeAt).getTime() : null;

  // Determine state + countdown target (server-rendered fallback uses the
  // openAt/closeAt diff as if "now" were the target itself — i.e. zero).
  const currentNow = now ?? 0;
  const notYet = opensAtMs != null && currentNow > 0 && currentNow < opensAtMs;
  const ended = closesAtMs != null && currentNow > 0 && currentNow >= closesAtMs;

  let statusLabel: string;
  let statusBg: string;
  let statusDot: string;
  let countdownLabel: string;
  let targetMs: number | null;

  if (notYet) {
    statusLabel = "모집 예정";
    statusBg = "bg-blue-500";
    statusDot = "bg-blue-400";
    countdownLabel = "오픈까지";
    targetMs = opensAtMs;
  } else if (ended) {
    statusLabel = "모집 마감";
    statusBg = "bg-gray-400";
    statusDot = "bg-gray-300";
    countdownLabel = "지원이 종료됐어요";
    targetMs = null;
  } else {
    statusLabel = "모집 중";
    statusBg = "bg-emerald-500";
    statusDot = "bg-emerald-400";
    countdownLabel = closesAtMs ? "마감까지" : "지원 가능";
    targetMs = closesAtMs;
  }

  const parts: CountdownParts | null =
    now !== null && targetMs !== null
      ? diffParts(targetMs, now)
      : null;

  const opens = openAt ? formatFullDate(openAt) : null;
  const closes = closeAt ? formatFullDate(closeAt) : null;

  return (
    <div className="mt-10 max-w-2xl mx-auto">
      {/* Status header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="relative flex w-2 h-2">
            <span
              className={`absolute inline-flex w-full h-full rounded-full ${statusDot} opacity-75 animate-ping`}
            />
            <span
              className={`relative inline-flex w-2 h-2 rounded-full ${statusBg}`}
            />
          </span>
          <span className="text-[11px] font-black tracking-wider text-[#1E1E1E]">
            {statusLabel}
          </span>
        </div>
        <span className="text-[10px] font-black tracking-[0.18em] text-gray-400 uppercase">
          {countdownLabel}
        </span>
      </div>

      {/* Countdown */}
      {parts && targetMs ? (
        <div className="mt-5 flex items-baseline justify-center gap-2 sm:gap-5">
          <CountUnit value={parts.days} label="DAYS" color={color} />
          <Sep />
          <CountUnit value={parts.hours} label="HOURS" color={color} />
          <Sep />
          <CountUnit value={parts.minutes} label="MINUTES" color={color} />
          <Sep />
          <CountUnit value={parts.seconds} label="SECONDS" color={color} pulse />
        </div>
      ) : (
        <p className="mt-5 text-center text-gray-400 text-sm font-bold py-8">
          {countdownLabel}
        </p>
      )}

      {/* Footer: opens left / closes right */}
      {(opens || closes) && (
        <div className="mt-7 pt-5 border-t border-dashed border-gray-300/60 grid grid-cols-2 gap-4">
          <div className="text-left">
            <p className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase">
              Opens
            </p>
            {opens ? (
              <p className="mt-1 text-[11px] text-gray-600 leading-relaxed">
                <span className="font-bold text-[#1E1E1E]">{opens.date}</span>
                <br />
                <span className="tabular-nums text-gray-500">{opens.time}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-300">—</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase">
              Closes
            </p>
            {closes ? (
              <p className="mt-1 text-[11px] text-gray-600 leading-relaxed">
                <span className="font-bold text-[#1E1E1E]">{closes.date}</span>
                <br />
                <span className="tabular-nums text-gray-500">{closes.time}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-300">—</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CountUnit({
  value,
  label,
  color,
  pulse,
}: {
  value: number;
  label: string;
  color: string;
  pulse?: boolean;
}) {
  const display = value.toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <p
        className="text-5xl sm:text-7xl font-black text-[#1E1E1E] tabular-nums tracking-tight leading-none"
        style={{
          textShadow: pulse ? `0 0 28px ${color}55` : undefined,
        }}
      >
        {display}
      </p>
      <p
        className="mt-2 text-[9px] sm:text-[10px] font-black tracking-[0.2em]"
        style={{ color }}
      >
        {label}
      </p>
    </div>
  );
}

function Sep() {
  return (
    <span className="text-4xl sm:text-6xl font-black text-gray-300 leading-none self-baseline pb-1">
      :
    </span>
  );
}
