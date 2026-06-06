"use client";

import Link from "next/link";
import { LedgerPanel } from "@/components/dashboard/LedgerPanel";
import { RoiWithdrawCard } from "@/components/dashboard/RoiWithdrawCard";
import { WithdrawableIncomeCard } from "@/components/dashboard/WithdrawableIncomeCard";
import { hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { useDashboard } from "@/hooks/useDashboard";

export default function WithdrawalsPage() {
  const { data } = useDashboard();

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

      <LedgerPanel />
    </div>
  );
}
