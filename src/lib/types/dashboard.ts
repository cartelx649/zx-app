export type PackageTier = 1 | 100 | 500 | 1000;

export type DashboardMock = {
  walletAddress: `0x${string}`;
  sponsorAddress: `0x${string}`;
  referralId: string;
  joiningDate: string;
  currentPackageUsdt: PackageTier;
  currentCycle: number;
  roiSlabLabel: string;
  roiEarnedUsdt: number;
  roiTargetUsdt: number;
  totalEarnedUsdt: number;
  capMaxUsdt: number;
  capEarnedUsdt: number;
  directIncomeUsdt: number;
  levelIncomeByLevel: { level: number; percentLabel: string; earnedUsdt: number }[];
  referralLink: string;
  teamPreview: { address: string; depth: number; packageUsdt: number }[];
  activeCycleLabel: string;
  accountActive: boolean;
  needsReTopUp: boolean;
  withdrawalWindowNote: string;
};
