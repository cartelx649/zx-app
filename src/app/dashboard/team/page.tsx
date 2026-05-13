import Link from "next/link";
import { hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { mockDashboard } from "@/lib/mock-dashboard";

export default function TeamPage() {
  const d = mockDashboard;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/45">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold text-white">
            Team tree
          </h1>
        </div>
        <Link href="/dashboard" className={hudButtonClass("ghost")}>
          Back to overview
        </Link>
      </div>

      <HudPanel
        title="Your account root"
        subtitle="Sponsor relationship remains fixed"
        accent="cyan"
      >
        <p className="font-mono text-sm text-white/85">{d.walletAddress}</p>
        <p className="mt-2 text-sm text-white/55">
          Downlines shown with depth. ROI override income can trace up to 20
          levels when downline receives monthly ROI.
        </p>
      </HudPanel>

      <HudPanel title="Frontline and depth" accent="magenta">
        <div className="space-y-3">
          {(d.teamPreview ?? []).map((m) => (
            <div
              key={m.address}
              className="relative border-l-2 border-purple-500/30 pl-4"
              style={{ marginLeft: `${(m.depth - 1) * 16}px` }}
            >
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-purple-400/30 hover:bg-white/[0.04]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-white/85">
                    {m.address}
                  </span>
                  <span className="text-xs text-white/50">
                    Depth {m.depth}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-amber-300">
                  Package {m.packageUsdt} USDT
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-white/55">
          Live tree data will replace this preview when the indexer/API is
          connected.
        </p>
      </HudPanel>
    </div>
  );
}
