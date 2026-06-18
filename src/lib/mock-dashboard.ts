import type { DashboardMock } from "@/lib/types/dashboard";

/**
 * Test-only fixture. NOT used at runtime — the live dashboard renders neutral
 * placeholders ("—" / 0) when the API doesn't return a field. Kept for unit
 * tests, Storybook, and reference of the expected shape from /users/dashboard.
 */
export const mockDashboard: DashboardMock = {
  walletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  sponsorAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  referralId: "ZX-7F2A9C",
  referralLink: "https://zx.app/join?ref=ZX-7F2A9C",
  joiningDate: "2026-04-12",

  totalInvestedUsdt: 500,
  roiEarnedToDateUsdt: 320,
  claimedRoiUsdt: 120,
  remainingRoiUsdt: 200,

  directIncomeUsdt: 75,
  levelIncomeUsdt: 97,
  totalIncomeEarnedUsdt: 492,
  totalIncomeClaimedUsdt: 120,
  toBeClaimedUsdt: 372,
  levelIncomeByLevel: [
    { level: 1, percentLabel: "configurable", earnedUsdt: 42 },
    { level: 2, percentLabel: "configurable", earnedUsdt: 28 },
    { level: 3, percentLabel: "configurable", earnedUsdt: 15 },
    { level: 4, percentLabel: "configurable", earnedUsdt: 8 },
    { level: 5, percentLabel: "configurable", earnedUsdt: 4 },
  ],

  cycleExists: true,
  currentCycle: 2,
  currentPackageUsdt: 500,
  roiEarnedUsdt: 320,
  roiTargetUsdt: 1000,
  capEarnedUsdt: 890,
  capMaxUsdt: 1500,
  totalEarnedUsdt: 890,
  roiSlabLabel: "500–999 USDT slab (admin configurable)",
  slab: {
    name: "Tier 2",
    min: 500,
    max: 999,
    monthlyPercent: 6,
    label: "500–999 USDT slab (admin configurable)",
  },
  activeCycleLabel: "Cycle 2 — ROI toward 2X, total cap 3X",
  accountActive: true,
  needsReTopUp: false,
  cycles: [],
  cyclesSummary: { total: 1, active: 1, completed: 0, canRetopUp: false },

  withdrawalWindowDay: 4,
  withdrawalWindowOpen: true,
  withdrawalWindowOpenNow: false,
  withdrawalWindowNote: "Withdrawals open every month on the 4th.",

  teamPreview: [
    { address: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0b", depth: 1, packageUsdt: 100 },
    { address: "0x88b44C4f7b0d4c3e2a1f9d8c7b6a59483726150", depth: 2, packageUsdt: 500 },
    { address: "0x9a1b2c3d4e5f60718293a4b5c6d7e8f901234567", depth: 2, packageUsdt: 1000 },
  ],
};

export function getMockWithdrawals() {
  return [
    { id: "w1", date: "2026-05-04", amountUsdt: 120, status: "Completed" as const },
    { id: "w2", date: "2026-04-04", amountUsdt: 200, status: "Completed" as const },
    { id: "w3", date: "2026-03-04", amountUsdt: 95, status: "Completed" as const },
  ];
}
