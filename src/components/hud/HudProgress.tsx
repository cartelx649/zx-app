"use client";

import { useEffect, useState } from "react";

type Props = {
  label: string;
  current: number;
  target: number;
  unit?: string;
  tone?: "green" | "cyan" | "purple" | "amber";
  footnote?: string;
};

const barStyles: Record<NonNullable<Props["tone"]>, string> = {
  green:  "bg-gradient-to-r from-green-500 to-green-300 shadow-[0_0_16px_-2px_rgba(74,222,128,0.6)]",
  cyan:   "bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_16px_-2px_rgba(93,169,255,0.6)]",
  purple: "bg-gradient-to-r from-purple-500 to-purple-300 shadow-[0_0_16px_-2px_rgba(155,140,255,0.6)]",
  amber:  "bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_16px_-2px_rgba(245,158,11,0.6)]",
};

export function HudProgress({
  label,
  current,
  target,
  unit = "USDT",
  tone = "green",
  footnote,
}: Props) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-white/55">{label}</span>
        <span className="font-mono text-white/80">
          {current.toLocaleString()} / {target.toLocaleString()} {unit}
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full border border-white/8 bg-white/5">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-out ${barStyles[tone]}`}
          style={{ width: mounted ? `${pct}%` : "0%" }}
        />
      </div>
      {footnote ? (
        <p className="text-xs leading-snug text-white/40">{footnote}</p>
      ) : null}
    </div>
  );
}
