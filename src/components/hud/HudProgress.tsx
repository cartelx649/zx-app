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
      ? "bg-gradient-to-r from-hud-cyan to-blue-400"
      : "bg-gradient-to-r from-hud-magenta to-violet-400";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-hud-dim">
          {label}
        </span>
        <span className="font-medium text-foreground">
          {current.toLocaleString()} / {target.toLocaleString()} {unit}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-hud-stroke bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-out ${barClass}`}
          style={{ width: mounted ? `${pct}%` : "0%" }}
        />
      </div>
      {footnote ? (
        <p className="text-sm leading-snug text-hud-dim">{footnote}</p>
      ) : null}
    </div>
  );
}
