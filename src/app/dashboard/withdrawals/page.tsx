"use client";

import Link from "next/link";
import { RoiWithdrawCard } from "@/components/dashboard/RoiWithdrawCard";
import { WithdrawableIncomeCard } from "@/components/dashboard/WithdrawableIncomeCard";
import { hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { useDashboard } from "@/hooks/useDashboard";
import { statusPillClass } from "@/lib/withdrawals";

export default function WithdrawalsPage() {
  const { data, withdrawals, isLoading, error } = useDashboard();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/45">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold text-white">
            Withdrawal history
          </h1>
        </div>
        <Link href="/dashboard" className={hudButtonClass("ghost")}>
          Back to overview
        </Link>
      </div>

      <RoiWithdrawCard />

      <WithdrawableIncomeCard />

      <HudPanel
        title="Withdrawal window"
        subtitle={data.withdrawalWindowNote || "Schedule pending"}
        accent="amber"
      >
        <p className="text-sm leading-relaxed text-white/65">
          Monthly processing totals ROI, direct income, and level overrides.
          Liquidity is moved to the payout wallet; users withdraw when the
          window is open and caps allow.
        </p>
      </HudPanel>

      <HudPanel title="Ledger" accent="cyan">
        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : isLoading && withdrawals.length === 0 ? (
          <p className="text-sm text-white/55">Loading…</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-white/55">No withdrawals yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {withdrawals.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-display text-sm text-white/85">
                    {r.date}
                  </p>
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="font-mono text-lg font-semibold text-amber-300">
                  +{r.amountUsdt.toLocaleString()} USDT
                </p>
              </li>
            ))}
          </ul>
        )}
      </HudPanel>
    </div>
  );
}
