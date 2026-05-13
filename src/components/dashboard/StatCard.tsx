import type { ReactNode } from "react";

export function StatCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "pending";
}) {
  const valueTone = tone === "pending" ? "text-amber-300" : "text-white/85";
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-purple-400/30 hover:bg-white/[0.04]">
      <div className="text-white/80">{icon}</div>
      <p className="mt-3 text-sm font-semibold tracking-wide text-white">
        {label}
      </p>
      <div className="mt-2 h-px w-full bg-gradient-to-r from-purple-500/30 via-white/10 to-transparent" />
      <p className={`mt-3 font-mono text-base italic ${valueTone}`}>{value}</p>
    </div>
  );
}

export function fmtUsdt(n: number, max = 5) {
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: max,
  })} USDT`;
}
