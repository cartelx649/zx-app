"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HudButton } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import {
  ApiError,
  api,
  type IncomeEntry,
  type WithdrawableTotals,
  type WithdrawalRecord,
} from "@/lib/api";
import {
  formatUsdt,
  statusPillClass,
  withdrawErrorMessage,
} from "@/lib/withdrawals";

// Hardcoded for now — wire up to the active month once the backend supports it.
const MONTH = "2026-05";

type IncomeType = "direct" | "override";

const TYPE_LABEL: Record<IncomeType, string> = {
  direct: "Direct income",
  override: "Level override",
};

type WithdrawState = "idle" | "pending" | "done" | "error";

type WithdrawStatus = {
  state: WithdrawState;
  error: string | null;
  txHash: string | null;
};

const INITIAL_STATUS: WithdrawStatus = {
  state: "idle",
  error: null,
  txHash: null,
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function WithdrawableIncomeCard() {
  const { token, isAuthenticated } = useAuth();
  const { data: dashboard, refetch: refetchDashboard } = useDashboard();
  const walletAddress = dashboard.walletAddress;
  const incomePaused = dashboard.incomeWithdrawPaused;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["withdrawable-income", MONTH, Boolean(token)],
    enabled: Boolean(isAuthenticated && token),
    queryFn: () => api.getWithdrawableIncome(token!, MONTH),
    staleTime: 30_000,
  });

  const errorMessage = error
    ? error instanceof ApiError || error instanceof Error
      ? error.message
      : "Failed to load income"
    : null;

  const [status, setStatus] = useState<Record<IncomeType, WithdrawStatus>>({
    direct: INITIAL_STATUS,
    override: INITIAL_STATUS,
  });

  async function handleWithdraw(type: IncomeType, claimable: number) {
    if (!token || !walletAddress || claimable <= 0 || incomePaused) return;
    setStatus((s) => ({
      ...s,
      [type]: { state: "pending", error: null, txHash: null },
    }));
    try {
      const result = await api.withdrawContract(
        { walletAddress, amount: claimable, type, monthKey: MONTH },
        token,
        `${walletAddress}-${MONTH}-${type}`,
      );
      setStatus((s) => ({
        ...s,
        [type]: { state: "done", error: null, txHash: result.txHash ?? null },
      }));
      await Promise.allSettled([refetch(), refetchDashboard()]);
    } catch (e) {
      setStatus((s) => ({
        ...s,
        [type]: { state: "error", error: withdrawErrorMessage(e), txHash: null },
      }));
    }
  }

  return (
    <HudPanel
      title="Direct & override income"
      subtitle={data?.monthKey ?? MONTH}
      accent="cyan"
    >
      {errorMessage ? (
        <p className="text-sm text-red-300">{errorMessage}</p>
      ) : isLoading ? (
        <p className="text-sm text-white/55">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {(["direct", "override"] as const).map((type) => (
              <TypeSummary
                key={type}
                type={type}
                totals={data?.totals[type]}
                status={status[type]}
                paused={incomePaused}
                disabled={
                  !token ||
                  !walletAddress ||
                  incomePaused ||
                  status[type].state === "pending" ||
                  status[type].state === "done"
                }
                onWithdraw={handleWithdraw}
              />
            ))}
          </div>

          {incomePaused ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
              Direct aur override income withdrawals abhi admin ne pause kiye hue hain.
            </div>
          ) : null}

          <EntriesBreakdown entries={data?.entries ?? []} />

          <WithdrawalHistory withdrawals={data?.withdrawals ?? []} />
        </div>
      )}
    </HudPanel>
  );
}

function TypeSummary({
  type,
  totals,
  status,
  paused,
  disabled,
  onWithdraw,
}: {
  type: IncomeType;
  totals?: WithdrawableTotals;
  status: WithdrawStatus;
  paused: boolean;
  disabled: boolean;
  onWithdraw: (type: IncomeType, claimable: number) => void;
}) {
  const claimable = totals?.claimableAmount ?? 0;
  const count = totals?.count ?? 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-white/45">
        {TYPE_LABEL[type]}
      </p>
      <p className="font-mono text-xl font-semibold text-amber-300">
        {formatUsdt(claimable)} USDT
      </p>
      <p className="text-xs text-white/45">
        claimable · from {count} {count === 1 ? "entry" : "entries"}
      </p>
      <HudButton
        variant="primary"
        className="mt-1 w-full"
        onClick={() => onWithdraw(type, claimable)}
        disabled={disabled || claimable <= 0}
        title={
          claimable <= 0
            ? "Nothing to withdraw"
            : paused
              ? "Income withdrawal is paused by admin"
              : undefined
        }
      >
        {status.state === "pending"
          ? "Withdrawing…"
          : status.state === "done"
            ? "Withdrawn"
            : "Withdraw"}
      </HudButton>
      {status.state === "error" && status.error ? (
        <p className="text-xs text-red-300">{status.error}</p>
      ) : null}
      {status.state === "done" ? (
        <div className="text-xs text-emerald-300">
          <p>Withdrawal submitted.</p>
          {status.txHash ? (
            <a
              href={`https://bscscan.com/tx/${status.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all underline underline-offset-2 hover:text-emerald-200"
            >
              View on BscScan ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EntriesBreakdown({ entries }: { entries: IncomeEntry[] }) {
  if (entries.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wider text-white/45">
          Breakdown
        </h3>
        <p className="text-sm text-white/55">No income entries this month.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-xs uppercase tracking-wider text-white/45">
        Breakdown
      </h3>
      <ul className="divide-y divide-white/5">
        {entries.map((e) => (
          <li
            key={e._id}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/65">
                  {e.type === "override" ? `Override · L${e.level}` : "Direct"}
                </span>
                <span className="text-xs text-white/45">
                  {formatDate(e.createdAt)}
                </span>
              </div>
              <p className="text-xs text-white/55">{e.note}</p>
            </div>
            <p className="font-mono text-sm font-semibold text-amber-300">
              +{formatUsdt(e.amount)} USDT
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WithdrawalHistory({
  withdrawals,
}: {
  withdrawals: WithdrawalRecord[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs uppercase tracking-wider text-white/45">
        Withdrawal history
      </h3>
      {withdrawals.length === 0 ? (
        <p className="text-sm text-white/55">No withdrawals yet.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {withdrawals.map((w) => (
            <li
              key={w._id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass(w.status)}`}
                  >
                    {w.status}
                  </span>
                  {w.incomeType ? (
                    <span className="text-xs text-white/45">
                      {w.incomeType}
                    </span>
                  ) : null}
                </div>
                {w.payoutTxHash ? (
                  <a
                    href={`https://bscscan.com/tx/${w.payoutTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                  >
                    View on BscScan ↗
                  </a>
                ) : w.rejectionReason ? (
                  <span className="text-xs text-red-300">
                    {w.rejectionReason}
                  </span>
                ) : null}
              </div>
              <p className="font-mono text-sm font-semibold text-amber-300">
                {formatUsdt(w.approvedAmount || w.requestedAmount)} USDT
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
