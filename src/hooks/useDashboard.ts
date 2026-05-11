"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { api, type DashboardApi, type MeResponse } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { mockDashboard } from "@/lib/mock-dashboard";
import type { DashboardMock, PackageTier } from "@/lib/types/dashboard";

function pickPackage(value: unknown): PackageTier {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 1 || n === 100 || n === 500 || n === 1000) return n;
  return mockDashboard.currentPackageUsdt;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function buildReferralLink(referralId: string | undefined): string {
  if (!referralId) return mockDashboard.referralLink;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/?ref=${encodeURIComponent(referralId)}`;
  }
  return `https://zx.app/join?ref=${encodeURIComponent(referralId)}`;
}

function adapt(
  api: DashboardApi | undefined,
  me: MeResponse | undefined,
  walletAddress: `0x${string}` | undefined,
): DashboardMock {
  const cycle = api?.cycle ?? {};
  const incomes = api?.incomes ?? {};
  const withdrawals = api?.withdrawals ?? {};

  const currentPackage = pickPackage(cycle.packageUsdt);
  const referralId = str(me?.referralId, mockDashboard.referralId);

  return {
    walletAddress:
      (walletAddress ?? (str(me?.walletAddress) as `0x${string}`)) ||
      mockDashboard.walletAddress,
    sponsorAddress:
      (str(me?.sponsorWalletAddress) as `0x${string}`) ||
      mockDashboard.sponsorAddress,
    referralId,
    joiningDate: str(me?.joiningDate, mockDashboard.joiningDate),
    currentPackageUsdt: currentPackage,
    currentCycle: num(cycle.number ?? cycle.current, mockDashboard.currentCycle),
    roiSlabLabel: str(cycle.roiSlabLabel, mockDashboard.roiSlabLabel),
    roiEarnedUsdt: num(cycle.roiEarnedUsdt),
    roiTargetUsdt: num(cycle.roiTargetUsdt, currentPackage * 2),
    totalEarnedUsdt: num(incomes.totalEarnedUsdt),
    capMaxUsdt: num(cycle.capMaxUsdt, currentPackage * 3),
    capEarnedUsdt: num(cycle.capEarnedUsdt ?? incomes.totalEarnedUsdt),
    directIncomeUsdt: num(incomes.directIncomeUsdt),
    levelIncomeByLevel:
      Array.isArray(incomes.levelByLevel) && incomes.levelByLevel.length > 0
        ? incomes.levelByLevel.map((l) => ({
            level: num(l.level),
            percentLabel: str(l.percentLabel, "configurable"),
            earnedUsdt: num(l.earnedUsdt),
          }))
        : mockDashboard.levelIncomeByLevel.map((l) => ({ ...l, earnedUsdt: 0 })),
    referralLink: str(me?.referralLink) || buildReferralLink(referralId),
    teamPreview: mockDashboard.teamPreview, // not part of /users/dashboard
    activeCycleLabel: str(
      cycle.activeCycleLabel,
      `Cycle ${num(cycle.number ?? cycle.current, 1)} — ROI toward 2X, total cap 3X`,
    ),
    accountActive: cycle.active ?? true,
    needsReTopUp: cycle.needsReTopUp ?? false,
    withdrawalWindowNote: str(
      withdrawals.windowNote,
      mockDashboard.withdrawalWindowNote,
    ),
  };
}

export type DashboardWithdrawalRow = {
  id: string;
  date: string;
  amountUsdt: number;
  status: string;
};

export function useDashboard() {
  const { token, isAuthenticated } = useAuth();
  const { address } = useAccount();

  const enabled = Boolean(isAuthenticated && token);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", address, Boolean(token)],
    enabled,
    queryFn: () => api.getDashboard(token!),
    staleTime: 30_000,
  });

  const meQuery = useQuery({
    queryKey: ["me", address, Boolean(token)],
    enabled,
    queryFn: () => api.getMe(token!),
    staleTime: 60_000,
  });

  const adapted = adapt(
    dashboardQuery.data,
    meQuery.data,
    address as `0x${string}` | undefined,
  );

  const withdrawals: DashboardWithdrawalRow[] = Array.isArray(
    dashboardQuery.data?.withdrawals?.history,
  )
    ? (dashboardQuery.data!.withdrawals!.history as DashboardWithdrawalRow[])
    : [];

  return {
    data: adapted,
    withdrawals,
    isAuthenticated,
    isLoading: dashboardQuery.isLoading || meQuery.isLoading,
    isFetching: dashboardQuery.isFetching || meQuery.isFetching,
    error:
      dashboardQuery.error instanceof Error
        ? dashboardQuery.error.message
        : meQuery.error instanceof Error
          ? meQuery.error.message
          : null,
    refetch: async () => {
      await Promise.all([dashboardQuery.refetch(), meQuery.refetch()]);
    },
  };
}
