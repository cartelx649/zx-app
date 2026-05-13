export type DashboardSlabView = {
  name: string;
  min: number;
  max: number;
  monthlyPercent: number;
  label: string;
};

export type TeamMember = {
  address: string;
  depth: number;
  packageUsdt: number;
};

export type PackageTier = number;

export type Dashboard = {
  // referral / identity
  walletAddress: string;
  sponsorAddress: string;
  referralId: string;
  referralLink: string;
  joiningDate: string;

  // investments block
  totalInvestedUsdt: number;
  roiEarnedToDateUsdt: number;
  claimedRoiUsdt: number;
  remainingRoiUsdt: number;

  // income block
  directIncomeUsdt: number;
  levelIncomeUsdt: number;
  totalIncomeEarnedUsdt: number;
  totalIncomeClaimedUsdt: number;
  toBeClaimedUsdt: number;
  /** Reserved for future per-level breakdown; always [] from the new API. */
  levelIncomeByLevel?: { level: number; percentLabel: string; earnedUsdt: number }[];

  // active cycle
  cycleExists: boolean;
  currentCycle: number;
  currentPackageUsdt: number;
  roiEarnedUsdt: number;
  roiTargetUsdt: number;
  capEarnedUsdt: number;
  capMaxUsdt: number;
  totalEarnedUsdt: number;
  roiSlabLabel: string;
  slab: DashboardSlabView | null;
  activeCycleLabel: string;
  accountActive: boolean;
  needsReTopUp: boolean;

  // withdrawal window
  withdrawalWindowDay: number;
  withdrawalWindowOpen: boolean;
  withdrawalWindowOpenNow: boolean;
  withdrawalWindowNote: string;

  // team tree preview
  teamPreview?: TeamMember[];
};

/** @deprecated Use `Dashboard`. Kept temporarily for mock-dashboard.ts compatibility. */
export type DashboardMock = Dashboard;
