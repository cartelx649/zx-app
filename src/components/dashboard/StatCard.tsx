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
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-green-400/20 hover:bg-white/[0.04]">
      <div className="text-white/60">{icon}</div>
      <p className="mt-3 text-xs font-medium tracking-wide text-white/45">
        {label}
      </p>
      <div className="mt-2 h-px w-full bg-gradient-to-r from-green-400/25 via-white/8 to-transparent" />
      <p className={`mt-3 font-mono text-base font-semibold ${valueTone}`}>{value}</p>
    </div>
  );
}

export function fmtUsdt(n: number, max = 5) {
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: max,
  })} USDT`;
}
