"use client";

import { StatCard, fmtUsdt } from "@/components/dashboard/StatCard";

function PlantIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 21v-9" />
      <path d="M12 12c-3 0-6-2-6-6 4 0 6 3 6 6Z" />
      <path d="M12 12c3 0 6-2 6-6-4 0-6 3-6 6Z" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M3 21h18" />
      <path d="M7 17V9" />
      <path d="M12 17V5" />
      <path d="M17 17v-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M4 12.5 10 18l10-12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function InvestmentsSection({
  invested,
  roiEarned,
  claimed,
  remaining,
  onClaim,
}: {
  invested: number;
  roiEarned: number;
  claimed: number;
  remaining?: number;
  onClaim?: () => void;
}) {
  const remainingDisplay = remaining ?? Math.max(0, roiEarned - claimed);
  const canClaim = remainingDisplay > 0 && Boolean(onClaim);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-[#080410] p-6 shadow-[0_0_40px_-12px_rgba(124,58,237,0.45)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl" />

      <header className="relative flex items-center gap-2 text-cyan-300">
        <PlantIcon />
        <h2 className="font-display text-lg font-semibold tracking-wide">
          Investments
        </h2>
      </header>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<LightningIcon />}
          label="Total Invested Value"
          value={fmtUsdt(invested, 2)}
        />
        <StatCard
          icon={<BarChartIcon />}
          label="ROI Earned (to date)"
          value={fmtUsdt(roiEarned)}
        />
        <StatCard
          icon={<CheckIcon />}
          label="Claimed ROI"
          value={fmtUsdt(claimed)}
        />
        <StatCard
          icon={<ClockIcon />}
          label="Remaining ROI"
          value={fmtUsdt(remainingDisplay)}
          tone="pending"
        />
      </div>

      <div className="relative mt-6 flex justify-center">
        <button
          type="button"
          onClick={onClaim}
          disabled={!canClaim}
          className="rounded-full bg-white px-10 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_-4px_rgba(255,255,255,0.25)] transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Claim
        </button>
      </div>
    </section>
  );
}
