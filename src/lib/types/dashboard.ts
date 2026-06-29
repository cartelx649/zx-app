export type DashboardSlabView = {
  name: string;
  min: number;
  max: number;
  monthlyPercent: number;
  label: string;
};

export type CycleInfo = {
  cycleId: string;
  cycleNumber: number;
  packageAmount: number;
  roiTarget: number;
  earnedRoi: number;
  incomeCap: number;
  totalEarned: number;
  earnedDirect: number;
  earnedOverride: number;
  isActive: boolean;
  startedAt: string;
  closedAt: string | null;
  slab: DashboardSlabView | null;
  roiProgress: { current: number; target: number };
  capProgress: { current: number; target: number };
  directLevelProgress: { current: number; target: number };
};

export type RetopupReportEntry = {
  index: number;
  depositId: string;
  cycleId: string;
  txHash: string;
  amount: number;
  packageType: string;
  roiSlabName: string;
  status: string;
  date: string;
};

export type RoiDailyEntry = { date: string; amount: number };
export type RoiReportCycle = {
  cycleNumber: number;
  cycleId: string;
  packageAmount: number;
  roiTarget: number;
  earnedRoi: number;
  incomeCap: number;
  isActive: boolean;
  startedAt: string;
  closedAt: string | null;
  totalRoiFromLedger: number;
  dailyBreakdown: RoiDailyEntry[];
  ledgerEntries: { entryId: string; amount: number; monthKey: string; note: string; date: string }[];
};

export type WorkingIncomeEntry = {
  entryId: string;
  type: "direct" | "override";
  level: number;
  amount: number;
  monthKey: string;
  sourceWalletAddress: string | null;
  sourceUserDeposit: number | null;
  cycleId: string;
  cycleNumber: number | null;
  topUpAmount: number | null;
  note: string;
  date: string;
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
  levelIncomeByLevel?: { level: number; percentLabel: string; earnedUsdt: number }[];

  // active cycle (legacy — oldest active)
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

  // all cycles
  cycles: CycleInfo[];
  cyclesSummary: { total: number; active: number; completed: number; canRetopUp: boolean };

  // withdrawal window
  withdrawalWindowDay: number;
  withdrawalWindowOpen: boolean;
  withdrawalWindowOpenNow: boolean;
  withdrawalWindowNote: string;
  roiWithdrawPaused: boolean;
  incomeWithdrawPaused: boolean;

  // team tree preview
  teamPreview?: TeamMember[];
};

/** @deprecated Use `Dashboard`. Kept temporarily for mock-dashboard.ts compatibility. */
export type DashboardMock = Dashboard;
