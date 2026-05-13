"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { HudButton, hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { HudProgress } from "@/components/hud/HudProgress";
import { InvestmentsSection } from "@/components/dashboard/InvestmentsSection";
import { IncomeSection } from "@/components/dashboard/IncomeSection";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth, type SignInStatus } from "@/hooks/useAuth";

const DASH = "—";

function StatusBadge({
  isConnected,
  hasToken,
  signInStatus,
  isFetching,
  error,
}: {
  isConnected: boolean;
  hasToken: boolean;
  signInStatus: SignInStatus;
  isFetching: boolean;
  error: string | null;
}) {
  let label = "Live";
  let dot = "bg-emerald-400";
  let cls =
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (!isConnected) {
    label = "Wallet disconnected";
    dot = "bg-amber-400";
    cls = "border-amber-400/30 bg-amber-500/10 text-amber-300";
  } else if (!hasToken) {
    if (signInStatus === "preparing") {
      label = "Waking server…";
      dot = "bg-amber-400 animate-pulse";
      cls = "border-amber-400/30 bg-amber-500/10 text-amber-300";
    } else if (signInStatus === "awaitingSignature") {
      label = "Approve in wallet";
      dot = "bg-cyan-400 animate-pulse";
      cls = "border-cyan-400/30 bg-cyan-500/10 text-cyan-200";
    } else if (signInStatus === "verifying") {
      label = "Verifying…";
      dot = "bg-cyan-400 animate-pulse";
      cls = "border-cyan-400/30 bg-cyan-500/10 text-cyan-200";
    } else {
      label = "Signing in…";
      dot = "bg-amber-400 animate-pulse";
      cls = "border-amber-400/30 bg-amber-500/10 text-amber-300";
    }
  } else if (error) {
    label = "Error";
    dot = "bg-red-400";
    cls = "border-red-400/30 bg-red-500/10 text-red-300";
  } else if (isFetching) {
    label = "Refreshing…";
    dot = "bg-cyan-400 animate-pulse";
    cls = "border-cyan-400/30 bg-cyan-500/10 text-cyan-200";
  }
  return (
    <span
      title={error ?? label}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function DashboardContent() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { token, signInStatus } = useAuth();
  const {
    data: d,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDashboard();
  const [copied, setCopied] = useState<"link" | "wallet" | null>(null);

  const copyToClipboard = async (text: string, kind: "link" | "wallet") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const goToWithdrawals = () => router.push("/dashboard/withdrawals");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/45">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
            Overview
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            isConnected={isConnected}
            hasToken={Boolean(token)}
            signInStatus={signInStatus}
            isFetching={isFetching}
            error={error}
          />
          <Link
            href="/dashboard/deposit"
            className={hudButtonClass("primary")}
          >
            Deposit
          </Link>
          <HudButton variant="ghost" onClick={() => void refetch()}>
            {isLoading ? "Refreshing…" : "Refresh"}
          </HudButton>
          <Link
            href="/dashboard/withdrawals"
            className={hudButtonClass("ghost")}
          >
            Withdrawals
          </Link>
        </div>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <InvestmentsSection
        invested={d.totalInvestedUsdt}
        roiEarned={d.roiEarnedToDateUsdt}
        claimed={d.claimedRoiUsdt}
        remaining={d.remainingRoiUsdt}
        onClaim={goToWithdrawals}
      />

      <IncomeSection
        direct={d.directIncomeUsdt}
        level={d.levelIncomeUsdt}
        totalEarned={d.totalIncomeEarnedUsdt}
        claimed={d.totalIncomeClaimedUsdt}
        toBeClaimed={d.toBeClaimedUsdt}
        onClaim={goToWithdrawals}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <HudPanel
          title="Active cycle"
          subtitle={d.activeCycleLabel || "No active cycle yet"}
          accent="amber"
          className="lg:col-span-2"
        >
          {d.cycleExists ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm font-medium text-amber-300">
                Cycle {d.currentCycle}
              </span>
              <span
                className={
                  d.accountActive
                    ? "text-sm font-medium text-emerald-300"
                    : "text-sm font-medium text-red-300"
                }
              >
                {d.accountActive ? "Account active" : "Account inactive"}
              </span>
            </div>
          ) : (
            <p className="text-sm text-white/65">
              No active package. Make a deposit to start your first cycle.
            </p>
          )}
          {d.currentPackageUsdt === 0 ? (
            <Link
              href="/dashboard/deposit"
              className={`${hudButtonClass("primary")} mt-4 inline-flex`}
            >
              Make a deposit
            </Link>
          ) : d.needsReTopUp ? (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3">
              <p className="text-sm text-white/85">
                3X cap reached. Re-top up with the same or a higher package to
                start a new cycle.
              </p>
              <Link
                href="/dashboard/deposit"
                className={`${hudButtonClass("danger")} mt-3 inline-flex`}
              >
                Re-top up
              </Link>
            </div>
          ) : (
            <HudButton className="mt-4" variant="ghost" disabled>
              Re-top up (not required)
            </HudButton>
          )}
        </HudPanel>

        <HudPanel title="Treasury note" accent="magenta">
          <p className="text-sm leading-relaxed text-white/65">
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

      <div className="grid gap-4">
        <HudPanel title="Referral link" subtitle="Sponsor link is permanent">
          <p className="mb-2 break-all font-mono text-xs text-purple-300">
            {d.referralLink || DASH}
          </p>
          <HudButton
            disabled={!d.referralLink}
            onClick={() => void copyToClipboard(d.referralLink, "link")}
          >
            {copied === "link" ? "Copied" : "Copy invite link"}
          </HudButton>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/55">
            <div className="col-span-2">
              <dt className="text-white/45">Your wallet</dt>
              <dd className="flex items-center gap-2">
                <span className="truncate font-mono text-white/85">
                  {address ?? DASH}
                </span>
                {address ? (
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(address, "wallet")}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70 transition hover:border-purple-400/30 hover:text-white"
                  >
                    {copied === "wallet" ? "Copied" : "Copy"}
                  </button>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-white/45">Referral ID</dt>
              <dd className="font-mono text-white/85">
                {d.referralId || DASH}
              </dd>
            </div>
            <div>
              <dt className="text-white/45">Sponsor</dt>
              <dd className="truncate font-mono text-white/85">
                {d.sponsorAddress || DASH}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-white/45">Joined</dt>
              <dd className="text-white/85">{d.joiningDate || DASH}</dd>
            </div>
          </dl>
        </HudPanel>
      </div>

      <HudPanel
        title="Withdrawal window"
        subtitle={d.withdrawalWindowNote || "Schedule pending"}
      >
        <p className="text-sm text-white/65">
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
