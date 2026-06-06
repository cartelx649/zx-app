"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HudButton } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { ApiError, api, type WithdrawalContractApi } from "@/lib/api";
import { formatUsdt, withdrawErrorMessage } from "@/lib/withdrawals";

// Hardcoded for now — wire up to the active month once the backend supports it.
const MONTH = "2026-05";

// Admin fee deducted by the backend on payout. Shown here for transparency only;
// the gross amount is still sent to the backend, which performs the deduction.
const ADMIN_FEE_RATE = 0.05;

type WithdrawState = "idle" | "pending" | "done" | "error";

export function RoiWithdrawCard() {
  const { token, isAuthenticated } = useAuth();
  const { data: dashboard, refetch: refetchDashboard } = useDashboard();

  const {
    data,
    isLoading,
    error,
    refetch: refetchRoi,
  } = useQuery({
    queryKey: ["monthly-roi", MONTH, Boolean(token)],
    enabled: Boolean(isAuthenticated && token),
    queryFn: () => api.getMonthlyRoi(token!, MONTH),
    staleTime: 30_000,
  });

  const errorMessage = error
    ? error instanceof ApiError || error instanceof Error
      ? error.message
      : "Failed to load ROI"
    : null;

  const totalRoi = data?.totalRoi ?? 0;
  const count = data?.count ?? 0;
  const adminFee = totalRoi * ADMIN_FEE_RATE;
  const netRoi = totalRoi - adminFee;
  const walletAddress = dashboard.walletAddress;

  const [withdrawState, setWithdrawState] = useState<WithdrawState>("idle");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawResult, setWithdrawResult] =
    useState<WithdrawalContractApi | null>(null);

  // Stable per (wallet, month): retrying a failed attempt reuses the same key,
  // so a request that actually succeeded server-side can't double-pay.
  const idempotencyKey = useMemo(
    () => `${walletAddress}-${MONTH}-roi`,
    [walletAddress],
  );

  const canWithdraw =
    !isLoading &&
    !errorMessage &&
    totalRoi > 0 &&
    Boolean(walletAddress) &&
    Boolean(token) &&
    withdrawState !== "pending" &&
    withdrawState !== "done";

  async function handleWithdraw() {
    if (!canWithdraw || !token) return;
    setWithdrawState("pending");
    setWithdrawError(null);
    try {
      const result = await api.withdrawContract(
        { walletAddress, amount: totalRoi, type: "roi", monthKey: MONTH },
        token,
        idempotencyKey,
      );
      setWithdrawResult(result);
      setWithdrawState("done");
      await Promise.allSettled([refetchRoi(), refetchDashboard()]);
    } catch (e) {
      setWithdrawState("error");
      setWithdrawError(withdrawErrorMessage(e));
    }
  }

  return (
    <HudPanel
      title="Monthly ROI"
      subtitle={data?.monthKey ?? MONTH}
      accent="magenta"
    >
      {errorMessage ? (
        <p className="text-sm text-red-300">{errorMessage}</p>
      ) : isLoading ? (
        <p className="text-sm text-white/55">Loading…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-wider text-white/45">
                Total ROI
              </p>
              <p className="font-mono text-2xl font-semibold text-amber-300">
                {formatUsdt(totalRoi)} USDT
              </p>
              <p className="text-sm text-white/55">
                from {count} {count === 1 ? "entry" : "entries"}
              </p>
            </div>
            <HudButton
              variant="primary"
              onClick={handleWithdraw}
              disabled={!canWithdraw}
              title={totalRoi > 0 ? undefined : "No ROI available to withdraw"}
            >
              {withdrawState === "pending" ? "Withdrawing…" : "Withdraw"}
            </HudButton>
          </div>

          {totalRoi > 0 ? (
            <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
              <div className="flex items-center justify-between text-white/55">
                <span>Admin fee (5%)</span>
                <span className="font-mono">−{formatUsdt(adminFee)} USDT</span>
              </div>
              <div className="flex items-center justify-between font-medium text-white/85">
                <span>You receive</span>
                <span className="font-mono text-emerald-300">
                  {formatUsdt(netRoi)} USDT
                </span>
              </div>
            </div>
          ) : null}

          {withdrawState === "error" && withdrawError ? (
            <p className="text-sm text-red-300">{withdrawError}</p>
          ) : null}

          {withdrawState === "done" && withdrawResult ? (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <p className="font-medium">
                Withdrawn {formatUsdt(withdrawResult.withdrawnAmount)} USDT
              </p>
              {withdrawResult.txHash ? (
                <a
                  href={`https://bscscan.com/tx/${withdrawResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block break-all text-xs text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                >
                  View transaction on BscScan ↗
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </HudPanel>
  );
}
