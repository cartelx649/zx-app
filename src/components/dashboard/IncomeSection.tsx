"use client";

import { StatCard, fmtUsdt } from "@/components/dashboard/StatCard";

function CoinsIcon() {
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
      <circle cx="9" cy="9" r="6" />
      <path d="M15 15a6 6 0 1 0-4.24-10.24" />
    </svg>
  );
}

function HandshakeIcon() {
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
      <path d="M11 17 7.5 13.5a2.12 2.12 0 0 1 3-3l1.5 1.5 1.5-1.5a2.12 2.12 0 0 1 3 3L13 17" />
      <path d="m6 11 4-4" />
      <path d="m18 11-4-4" />
      <path d="M3 11h2l2 7" />
      <path d="M21 11h-2l-2 7" />
    </svg>
  );
}

function LayersIcon() {
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
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

function TrendingUpIcon() {
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
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

function CheckCircleIcon() {
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
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

function HourglassIcon() {
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
      <path d="M6 3h12" />
      <path d="M6 21h12" />
      <path d="M6 3c0 5 6 4 6 9 0 5-6 4-6 9" />
      <path d="M18 3c0 5-6 4-6 9 0 5 6 4 6 9" />
    </svg>
  );
}

export function IncomeSection({
  direct,
  level,
  totalEarned,
  claimed,
  toBeClaimed,
  onClaim,
}: {
  direct: number;
  level: number;
  totalEarned: number;
  claimed: number;
  toBeClaimed?: number;
  onClaim?: () => void;
}) {
  const toBeClaimedDisplay = toBeClaimed ?? Math.max(0, totalEarned - claimed);
  const canClaim = toBeClaimedDisplay > 0 && Boolean(onClaim);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-white/[0.025] p-6 shadow-[0_0_40px_-12px_rgba(93,169,255,0.2)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/8 blur-3xl" />

      <header className="relative flex items-center gap-2 text-cyan-400">
        <CoinsIcon />
        <h2 className="font-display text-sm font-bold tracking-widest text-cyan-400">
          INCOME
        </h2>
      </header>

      <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={<HandshakeIcon />}
          label="Direct Income"
          value={fmtUsdt(direct)}
        />
        <StatCard
          icon={<LayersIcon />}
          label="Level Income"
          value={fmtUsdt(level)}
        />
        <StatCard
          icon={<TrendingUpIcon />}
          label="Total Income Earned"
          value={fmtUsdt(totalEarned)}
        />
        <StatCard
          icon={<CheckCircleIcon />}
          label="Total Income Claimed"
          value={fmtUsdt(claimed)}
        />
        <StatCard
          icon={<HourglassIcon />}
          label="To Be Claimed"
          value={fmtUsdt(toBeClaimedDisplay)}
          tone="pending"
        />
      </div>

      <div className="relative mt-6 flex justify-center">
        <button
          type="button"
          onClick={onClaim}
          disabled={!canClaim}
          className="rounded-full bg-cyan-400 px-10 py-2.5 text-sm font-bold text-black shadow-[0_0_24px_-4px_rgba(93,169,255,0.55)] transition hover:bg-cyan-300 hover:shadow-[0_0_32px_-2px_rgba(93,169,255,0.8)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Claim Income
        </button>
      </div>
    </section>
  );
}
