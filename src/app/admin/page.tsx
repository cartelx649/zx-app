import Link from "next/link";
import { HudButton, hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { HudStat } from "@/components/hud/HudStat";

const kpis = [
  { label: "Total users", value: "12,480" },
  { label: "Active users", value: "6,902" },
  { label: "Inactive users", value: "5,578" },
  { label: "Total deposits", value: "4.2M USDT" },
  { label: "Total withdrawals", value: "1.1M USDT" },
  { label: "Total payouts", value: "1.08M USDT" },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-hud-stroke bg-hud-base px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-hud-dim">Operations</p>
            <h1 className="text-2xl font-semibold">Control center</h1>
          </div>
          <Link href="/dashboard" className={hudButtonClass("ghost")}>
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <p className="text-sm text-hud-dim">
          Placeholder metrics and controls for Section 14 of the business model.
          Connect this page to backend APIs and access control.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <HudStat key={k.label} label={k.label} value={k.value} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <HudPanel title="Treasury wallet" subtitle="Receive deposits">
            <p className="text-sm text-hud-dim">
              Status: <span className="text-hud-cyan">placeholder</span>
            </p>
            <p className="mt-2 font-mono text-xs break-all text-foreground">
              0x0000000000000000000000000000000000000000
            </p>
          </HudPanel>
          <HudPanel title="Payout wallet" subtitle="Monthly liquidity">
            <p className="text-sm text-hud-dim">
              Status: <span className="text-hud-amber">placeholder</span>
            </p>
            <p className="mt-2 font-mono text-xs break-all text-foreground">
              0x0000000000000000000000000000000000000000
            </p>
          </HudPanel>
        </div>

        <HudPanel title="ROI slabs" accent="cyan">
          <p className="text-sm text-hud-dim">
              Configure 100–499, 500–999, 1000+ monthly ROI bands.
          </p>
          <HudButton className="mt-3" variant="ghost" disabled>
            Edit slabs (coming soon)
          </HudButton>
        </HudPanel>

        <HudPanel title="Level percentages" accent="magenta">
          <p className="text-sm text-hud-dim">
            Manage 20-level ROI override percentages.
          </p>
          <HudButton className="mt-3" variant="ghost" disabled>
            Edit levels (coming soon)
          </HudButton>
        </HudPanel>

        <HudPanel title="Withdrawal window" accent="amber">
          <p className="text-sm text-hud-dim">
            Opens every month on the 4th — toggle dates when backend is ready.
          </p>
          <HudButton className="mt-3" variant="ghost" disabled>
            Configure window (coming soon)
          </HudButton>
        </HudPanel>

        <HudPanel title="Re-top users">
          <p className="text-sm text-hud-dim">
            List of accounts awaiting re-top after 3X cap.
          </p>
          <HudButton className="mt-3" variant="ghost" disabled>
            View queue (coming soon)
          </HudButton>
        </HudPanel>
      </div>
    </div>
  );
}
