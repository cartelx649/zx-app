import Link from "next/link";
import { hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { getMockWithdrawals, mockDashboard } from "@/lib/mock-dashboard";

export default function WithdrawalsPage() {
  const rows = getMockWithdrawals();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-hud-dim">Dashboard</p>
          <h1 className="text-2xl font-semibold">Withdrawal history</h1>
        </div>
        <Link href="/dashboard" className={hudButtonClass("ghost")}>
          Back to overview
        </Link>
      </div>

      <HudPanel
        title="Withdrawal window"
        subtitle={mockDashboard.withdrawalWindowNote}
        accent="amber"
      >
        <p className="text-sm leading-relaxed text-hud-dim">
          Monthly processing totals ROI, direct income, and level overrides.
          Liquidity is moved to the payout wallet; users withdraw when the window is
          open and caps allow.
        </p>
      </HudPanel>

      <HudPanel title="Ledger" accent="cyan">
        <ul className="divide-y divide-hud-stroke/40">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div>
                <p className="font-display text-sm text-hud-cyan">{r.date}</p>
                <p className="text-xs text-hud-dim">
                  {r.status}
                </p>
              </div>
              <p className="text-lg font-semibold text-hud-amber">
                +{r.amountUsdt.toLocaleString()} USDT
              </p>
            </li>
          ))}
        </ul>
      </HudPanel>
    </div>
  );
}
