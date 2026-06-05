"use client";

import { useQuery } from "@tanstack/react-query";
import { HudButton } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, api } from "@/lib/api";

// Hardcoded for now — wire up to the active month once the backend supports it.
const MONTH = "2026-05";

export function RoiWithdrawCard() {
  const { token, isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery({
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

  // The withdrawal endpoint isn't ready yet — keep the button as a disabled
  // placeholder. When the API lands, enable it for `totalRoi > 0` and wire onClick.
  const withdrawReady = false;
  const canWithdraw =
    withdrawReady && !isLoading && !errorMessage && totalRoi > 0;

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wider text-white/45">
              Total ROI
            </p>
            <p className="font-mono text-2xl font-semibold text-amber-300">
              {totalRoi.toLocaleString()} USDT
            </p>
            <p className="text-sm text-white/55">
              from {count} {count === 1 ? "entry" : "entries"}
            </p>
          </div>
          <HudButton
            variant="primary"
            disabled={!canWithdraw}
            title={withdrawReady ? undefined : "Withdrawals coming soon"}
          >
            Withdraw
          </HudButton>
        </div>
      )}
    </HudPanel>
  );
}
