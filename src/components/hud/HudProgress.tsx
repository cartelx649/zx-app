"use client";

import { useEffect, useState } from "react";

type Props = {
  label: string;
  current: number;
  target: number;
  unit?: string;
  tone?: "cyan" | "magenta";
  footnote?: string;
};

export function HudProgress({
  label,
  current,
  target,
  unit = "USDT",
  tone = "magenta",
  footnote,
}: Props) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const barClass =
    tone === "cyan"
      ? "bg-gradient-to-r from-purple-500 to-fuchsia-400 shadow-[0_0_18px_-2px_rgba(168,85,247,0.55)]"
      : "bg-gradient-to-r from-violet-500 to-purple-300 shadow-[0_0_18px_-2px_rgba(168,85,247,0.45)]";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-white/60">{label}</span>
        <span className="font-mono text-white/85">
          {current.toLocaleString()} / {target.toLocaleString()} {unit}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-out ${barClass}`}
          style={{ width: mounted ? `${pct}%` : "0%" }}
        />
      </div>
      {footnote ? (
        <p className="text-sm leading-snug text-white/50">{footnote}</p>
      ) : null}
    </div>
  );
}
