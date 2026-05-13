"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { api, ApiError, type DashboardApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Dashboard } from "@/lib/types/dashboard";

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function buildReferralLink(referralId: string): string {
  if (!referralId) return "";
  if (typeof window !== "undefined") {
    return `${window.location.origin}/?ref=${encodeURIComponent(referralId)}`;
  }
  return "";
}

function composeWindowNote(day: number, isOpen: boolean, isOpenNow: boolean): string {
  if (!day) return "Schedule pending";
  const base = `Opens on day ${day} of each month`;
  if (!isOpen) return `${base} — paused by admin`;
  return isOpenNow ? `${base} — open now` : base;
}

const EMPTY_DASHBOARD: Dashboard = {
  walletAddress: "",
  sponsorAddress: "",
  referralId: "",
  referralLink: "",
  joiningDate: "",
  totalInvestedUsdt: 0,
  roiEarnedToDateUsdt: 0,
  claimedRoiUsdt: 0,
  remainingRoiUsdt: 0,
  directIncomeUsdt: 0,
  levelIncomeUsdt: 0,
  totalIncomeEarnedUsdt: 0,
  totalIncomeClaimedUsdt: 0,
  toBeClaimedUsdt: 0,
  levelIncomeByLevel: [],
  cycleExists: false,
  currentCycle: 0,
  currentPackageUsdt: 0,
  roiEarnedUsdt: 0,
  roiTargetUsdt: 0,
  capEarnedUsdt: 0,
  capMaxUsdt: 0,
  totalEarnedUsdt: 0,
  roiSlabLabel: "",
  slab: null,
  activeCycleLabel: "",
  accountActive: false,
  needsReTopUp: false,
  withdrawalWindowDay: 0,
  withdrawalWindowOpen: false,
  withdrawalWindowOpenNow: false,
  withdrawalWindowNote: "",
};

function adapt(
  raw: DashboardApi | undefined,
  walletAddress: `0x${string}` | undefined,
): Dashboard {
  if (!raw) {
    return {
      ...EMPTY_DASHBOARD,
      walletAddress: walletAddress ?? "",
    };
  }

  const investments = raw.investments;
  const income = raw.income;
  const cycle = raw.activeCycle;
  const referral = raw.referral;
  const win = raw.withdrawalWindow;

  const referralId = str(referral?.referralId);
  const referralLink =
    str(referral?.referralLink) || buildReferralLink(referralId);
  const currentCycle = num(cycle?.cycleNumber);
  const cycleExists = Boolean(cycle?.exists);
  const slab = cycle?.slab ?? null;

  return {
    walletAddress: walletAddress ?? str(referral?.walletAddress),
    sponsorAddress: str(referral?.sponsorWalletAddress),
    referralId,
    referralLink,
    joiningDate: str(referral?.joinedAt),

    totalInvestedUsdt: num(investments?.totalInvestedValue),
    roiEarnedToDateUsdt: num(investments?.roiEarnedToDate),
    claimedRoiUsdt: num(investments?.claimedRoi),
    remainingRoiUsdt: num(investments?.remainingRoi),

    directIncomeUsdt: num(income?.directIncome),
    levelIncomeUsdt: num(income?.levelIncome),
    totalIncomeEarnedUsdt: num(income?.totalIncomeEarned),
    totalIncomeClaimedUsdt: num(income?.totalIncomeClaimed),
    toBeClaimedUsdt: num(income?.toBeClaimed),
    levelIncomeByLevel: [],

    cycleExists,
    currentCycle,
    currentPackageUsdt: num(cycle?.packageAmount),
    roiEarnedUsdt: num(cycle?.earnedRoi),
    roiTargetUsdt: num(cycle?.roiTarget),
    capEarnedUsdt: num(cycle?.totalEarned),
    capMaxUsdt: num(cycle?.incomeCap),
    totalEarnedUsdt: num(cycle?.totalEarned),
    roiSlabLabel: str(slab?.label),
    slab: slab
      ? {
          name: str(slab.name),
          min: num(slab.min),
          max: num(slab.max),
          monthlyPercent: num(slab.monthlyPercent),
          label: str(slab.label),
        }
      : null,
    activeCycleLabel: cycleExists
      ? `Cycle ${currentCycle} — ROI toward 2X, total cap 3X`
      : "",
    accountActive: Boolean(cycle?.accountActive),
    needsReTopUp: Boolean(cycle?.retopUpRequired),

    withdrawalWindowDay: num(win?.dayOfMonth),
    withdrawalWindowOpen: Boolean(win?.isOpen),
    withdrawalWindowOpenNow: Boolean(win?.isOpenNow),
    withdrawalWindowNote: composeWindowNote(
      num(win?.dayOfMonth),
      Boolean(win?.isOpen),
      Boolean(win?.isOpenNow),
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
  const { token, isAuthenticated, clearTokenForReauth } = useAuth();
  const { address } = useAccount();

  const enabled = Boolean(isAuthenticated && token);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", address, Boolean(token)],
    enabled,
    queryFn: () => api.getDashboard(token!),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Treat a 401 as "this token is stale" — evict it once and let the auth
  // provider's auto-signIn effect fire a fresh nonce/sign round. The ref
  // pins the token we already tried clearing so a backend that genuinely
  // 401s a freshly-issued token doesn't trap us in a sign/fail loop.
  const lastBad401TokenRef = useRef<string | null>(null);
  const queryError = dashboardQuery.error;
  const isStale401 =
    queryError instanceof ApiError &&
    queryError.status === 401 &&
    Boolean(token) &&
    lastBad401TokenRef.current !== token;

  useEffect(() => {
    if (!isStale401) return;
    lastBad401TokenRef.current = token;
    clearTokenForReauth();
  }, [isStale401, token, clearTokenForReauth]);

  useEffect(() => {
    if (dashboardQuery.isSuccess) {
      lastBad401TokenRef.current = null;
    }
  }, [dashboardQuery.isSuccess]);

  const adapted = adapt(
    dashboardQuery.data,
    address as `0x${string}` | undefined,
  );

  const withdrawals: DashboardWithdrawalRow[] = Array.isArray(
    dashboardQuery.data?.withdrawals?.history,
  )
    ? (dashboardQuery.data!.withdrawals!.history as DashboardWithdrawalRow[])
    : [];

  const is401 =
    queryError instanceof ApiError && queryError.status === 401;

  return {
    data: adapted,
    withdrawals,
    isAuthenticated,
    isLoading: dashboardQuery.isLoading,
    isFetching: dashboardQuery.isFetching,
    error:
      is401
        ? null
        : queryError instanceof Error
          ? queryError.message
          : null,
    refetch: async () => {
      await dashboardQuery.refetch();
    },
  };
}
