"use client";

import { HudButton } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import {
  useWithdrawalHistory,
  type StatusFilter,
  type TypeFilter,
} from "@/hooks/useWithdrawalHistory";
import type { WithdrawalHistoryItem } from "@/lib/api";
import { formatUsdt, statusPillClass } from "@/lib/withdrawals";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "roi", label: "ROI" },
  { value: "direct", label: "Direct" },
  { value: "override", label: "Override" },
];

const selectClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:border-purple-400/30 focus:border-purple-400/40 focus:outline-none [&>option]:bg-neutral-900";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function LedgerPanel() {
  const {
    items,
    summary,
    pagination,
    isLoading,
    isFetching,
    error,
    status,
    type,
    setStatus,
    setType,
    offset,
    nextPage,
    prevPage,
  } = useWithdrawalHistory();

  return (
    <HudPanel title="Ledger" accent="cyan">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile
            label="Total withdrawn"
            value={`${formatUsdt(summary?.totalWithdrawn ?? 0)} USDT`}
          />
          <SummaryTile
            label="Pending"
            value={`${formatUsdt(summary?.pendingAmount ?? 0)} USDT`}
          />
          <SummaryTile
            label="Approved"
            value={`${formatUsdt(summary?.approvedAmount ?? 0)} USDT`}
          />
          <SummaryTile
            label="Rejected"
            value={String(summary?.rejectedCount ?? 0)}
            hint={`${summary?.totalCount ?? 0} total records`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by status"
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by income type"
            className={selectClass}
            value={type}
            onChange={(e) => setType(e.target.value as TypeFilter)}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : isLoading ? (
          <p className="text-sm text-white/55">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-white/55">No withdrawals yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((item) => (
              <LedgerRow key={item.id} item={item} />
            ))}
          </ul>
        )}

        {pagination && pagination.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
            <p className="text-xs text-white/45">
              {offset + 1}–{offset + items.length} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <HudButton
                variant="ghost"
                onClick={prevPage}
                disabled={offset === 0 || isFetching}
              >
                Prev
              </HudButton>
              <HudButton
                variant="ghost"
                onClick={nextPage}
                disabled={!pagination.hasMore || isFetching}
              >
                Next
              </HudButton>
            </div>
          </div>
        ) : null}
      </div>
    </HudPanel>
  );
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-white/45">{label}</p>
      <p className="font-mono text-lg font-semibold text-amber-300">{value}</p>
      {hint ? <p className="text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

function LedgerRow({ item }: { item: WithdrawalHistoryItem }) {
  const date = formatDate(item.processedAt ?? item.requestedAt);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass(item.status)}`}
          >
            {item.status}
          </span>
          {item.incomeType ? (
            <span className="text-xs uppercase tracking-wide text-white/45">
              {item.incomeType}
            </span>
          ) : null}
          {item.monthKey ? (
            <span className="text-xs text-white/35">{item.monthKey}</span>
          ) : null}
        </div>
        <span className="font-display text-xs text-white/55">{date}</span>
        {item.payoutTxHash ? (
          <a
            href={`https://bscscan.com/tx/${item.payoutTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-xs text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
          >
            View on BscScan ↗
          </a>
        ) : item.rejectionReason ? (
          <span className="text-xs text-red-300">{item.rejectionReason}</span>
        ) : null}
      </div>
      <p className="font-mono text-lg font-semibold text-amber-300">
        +{formatUsdt(item.approvedAmount || item.requestedAmount)} USDT
      </p>
    </li>
  );
}
