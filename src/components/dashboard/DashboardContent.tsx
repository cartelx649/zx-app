"use client";

import Link from "next/link";
import { useState } from "react";
import { HudButton, hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { HudProgress } from "@/components/hud/HudProgress";
import { HudStat } from "@/components/hud/HudStat";
import { DepositActions } from "@/components/dashboard/DepositActions";
import { useDashboardMock } from "@/hooks/useDashboardMock";
import { parseDepositAddress } from "@/hooks/useUsdtDeposit";
import type { PackageTier } from "@/lib/types/dashboard";

const PACKAGES: PackageTier[] = [1, 100, 500, 1000];

export function DashboardContent() {
  const d = useDashboardMock();
  const [selectedPackage, setSelectedPackage] = useState<PackageTier | null>(
    d.currentPackageUsdt,
  );
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(d.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const depositEnv = process.env.NEXT_PUBLIC_DEPOSIT_CONTRACT;
  const depositAddress = parseDepositAddress(depositEnv);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-hud-dim">Dashboard</p>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Overview</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/team" className={hudButtonClass("ghost")}>
            Team tree
          </Link>
          <Link href="/dashboard/withdrawals" className={hudButtonClass("ghost")}>
            Withdrawals
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HudPanel
          title="Active cycle"
          subtitle={d.activeCycleLabel}
          accent="amber"
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-hud-amber/30 bg-amber-50 px-3 py-1 text-sm font-medium text-hud-amber">
              Cycle {d.currentCycle}
            </span>
            <span
              className={
                d.accountActive
                  ? "text-sm font-medium text-hud-cyan"
                  : "text-sm font-medium text-hud-danger"
              }
            >
              {d.accountActive ? "Account active" : "Account inactive"}
            </span>
          </div>
          {d.needsReTopUp ? (
            <div className="mt-4 rounded-md border border-hud-danger/30 bg-red-50 p-3">
              <p className="text-sm text-foreground">
                3X cap reached. Re-top up with the same or a higher package to
                start a new cycle.
              </p>
              <HudButton className="mt-3" variant="danger">
                Re-top up
              </HudButton>
            </div>
          ) : (
            <HudButton className="mt-4" variant="ghost" disabled>
              Re-top up (not required)
            </HudButton>
          )}
        </HudPanel>

      <HudPanel title="Treasury note" accent="magenta">
          <p className="text-sm leading-relaxed text-hud-dim">
            Deposits route to the treasury wallet for deployment. Payouts use a
            separate payout wallet funded on the monthly window.
          </p>
        </HudPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HudPanel title="ROI progress (2X)" subtitle={d.roiSlabLabel}>
          <HudProgress
            label="Toward ROI stop"
            current={d.roiEarnedUsdt}
            target={d.roiTargetUsdt}
            tone="cyan"
            footnote="Monthly ROI applies until 2X of your deposit is reached."
          />
        </HudPanel>
        <HudPanel title="Total income cap (3X)" subtitle="All income streams">
          <HudProgress
            label="Toward global cap"
            current={d.capEarnedUsdt}
            target={d.capMaxUsdt}
            tone="magenta"
            footnote="ROI + direct (5%) + level overrides count toward 3X."
          />
        </HudPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <HudStat
          variant="score"
          label="Total earned"
          value={`${d.totalEarnedUsdt.toLocaleString()} USDT`}
          hint="Sum of ROI, direct, and overrides to date"
        />
        <HudStat
          label="Direct income (5%)"
          value={`${d.directIncomeUsdt.toLocaleString()} USDT`}
          hint="Instant credit on referral deposits"
        />
        <HudStat
          label="Remaining cap"
          value={`${(d.capMaxUsdt - d.capEarnedUsdt).toLocaleString()} USDT`}
          hint="Headroom before all income stops"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel title="Deposit packages" subtitle="USDT BEP-20 · BSC">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {PACKAGES.map((tier) => {
              const active = selectedPackage === tier;
              const isTest = tier === 1;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedPackage(tier)}
                  className={`rounded-sm border px-3 py-4 text-left transition ${
                    active
                      ? "border-hud-cyan/40 bg-blue-50"
                      : "border-hud-stroke bg-white hover:border-hud-cyan/30"
                  }`}
                >
                  <p className="text-lg font-semibold text-hud-cyan">
                    {tier} USDT
                    {isTest ? (
                      <span className="ml-2 rounded-sm bg-hud-amber/15 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-hud-amber">
                        Test
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[11px] text-hud-dim">
                    {isTest
                      ? "$1 sandbox tier for end-to-end testing."
                      : "Approve spending, then deposit to activate."}
                  </p>
                </button>
              );
            })}
          </div>
          {!depositEnv ? (
            <p className="mt-4 text-xs text-hud-dim">
              Set{" "}
              <code className="text-hud-cyan">NEXT_PUBLIC_DEPOSIT_CONTRACT</code>{" "}
              in <code className="text-hud-cyan">.env.local</code> to enable
              on-chain actions.
            </p>
          ) : !depositAddress ? (
            <p className="mt-4 text-xs text-hud-danger">
              <code className="text-hud-cyan">NEXT_PUBLIC_DEPOSIT_CONTRACT</code>{" "}
              is not a valid address.
            </p>
          ) : (
            <DepositActions
              depositAddress={depositAddress}
              selectedPackage={selectedPackage}
            />
          )}
        </HudPanel>

        <HudPanel title="Referral link" subtitle="Sponsor link is permanent">
          <p className="mb-2 font-mono text-xs break-all text-hud-cyan">
            {d.referralLink}
          </p>
          <HudButton onClick={copyLink}>
            {copied ? "Copied" : "Copy invite link"}
          </HudButton>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-hud-dim">
            <div>
              <dt className="text-hud-dim">Referral ID</dt>
              <dd className="font-mono text-foreground">{d.referralId}</dd>
            </div>
            <div>
              <dt className="text-hud-dim">Sponsor</dt>
              <dd className="truncate font-mono text-foreground">
                {d.sponsorAddress}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-hud-dim">Joined</dt>
              <dd className="text-foreground">{d.joiningDate}</dd>
            </div>
          </dl>
        </HudPanel>
      </div>

      <HudPanel title="Withdrawal window" subtitle={d.withdrawalWindowNote}>
        <p className="text-sm text-hud-dim">
          Payout wallet is funded before user withdrawals each cycle.
        </p>
        <Link
          href="/dashboard/withdrawals"
          className={`${hudButtonClass("ghost")} mt-3 inline-flex`}
        >
          View withdrawal history
        </Link>
      </HudPanel>
    </div>
  );
}
