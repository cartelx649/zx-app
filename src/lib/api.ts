const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://zx-backend-51w2.onrender.com/api/v1";

export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const NONCE_MESSAGE_PREFIX = "ZX Login Nonce: ";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string | Record<string, unknown>;
  message?: string;
};

function extractApiErrorMessage(
  body: ApiEnvelope<unknown> | null,
  status: number,
): string {
  if (body) {
    const raw = body.error ?? body.message;
    if (typeof raw === "string" && raw.trim()) return raw;
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      const nested = obj.message ?? obj.error ?? obj.detail;
      if (typeof nested === "string" && nested.trim()) return nested;
      try {
        return JSON.stringify(raw);
      } catch {
        /* fall through */
      }
    }
  }
  return `Request failed (${status})`;
}

type FetchOptions = Omit<RequestInit, "body"> & {
  token?: string | null;
  idempotencyKey?: string;
  json?: unknown;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 45_000;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

function extractApiErrorCode(
  body: ApiEnvelope<unknown> | null,
): string | undefined {
  const raw = body?.error;
  if (raw && typeof raw === "object") {
    const code = (raw as Record<string, unknown>).code;
    if (typeof code === "string" && code.trim()) return code;
  }
  return undefined;
}

function randomIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function withSearch(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const suffix = search.toString();
  return suffix ? `${path}?${suffix}` : path;
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { token, idempotencyKey, json, headers, timeoutMs, ...rest } = opts;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const init: RequestInit = {
    ...rest,
    signal: controller.signal,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...headers,
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch (e) {
    if (controller.signal.aborted) {
      throw new ApiError("Server timed out — try again", 0);
    }
    throw new ApiError(
      e instanceof Error ? e.message : "Network request failed",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON response (e.g. 502 from upstream) — fall through to status check
  }

  if (!res.ok || (body && body.ok === false)) {
    throw new ApiError(
      extractApiErrorMessage(body, res.status),
      res.status,
      extractApiErrorCode(body),
    );
  }

  return (body?.data ?? (body as unknown)) as T;
}

export type NonceResponse = { nonce: string; expiresAt: string };

export type LoginResponse = {
  token?: string;
  jwt?: string;
  accessToken?: string;
  user?: Record<string, unknown>;
} & Record<string, unknown>;

export type AppUser = {
  _id: string;
  walletAddress: string;
  sponsorWalletAddress: string | null;
  referralId: string;
  role: "user" | "admin";
  isActive: boolean;
  totalDeposited: number;
  totalEarned: number;
  directTeamCount: number;
  currentCycleNumber: number;
  createdAt?: string;
  updatedAt?: string;
};

export type VerifyDepositArgs = {
  txHash: string;
  amount: number;
  sponsorWalletAddress: string;
};

export type DashboardSlab = {
  name: string;
  min: number;
  max: number;
  monthlyPercent: number;
  label: string;
};

export type DashboardInvestmentsApi = {
  totalInvestedValue: number;
  roiEarnedToDate: number;
  claimedRoi: number;
  remainingRoi: number;
};

export type DashboardIncomeApi = {
  directIncome: number;
  levelIncome: number;
  totalIncomeEarned: number;
  totalIncomeClaimed: number;
  toBeClaimed: number;
};

export type DashboardActiveCycleApi = {
  exists: boolean;
  cycleNumber: number;
  packageAmount: number;
  roiTarget: number;
  earnedRoi: number;
  incomeCap: number;
  totalEarned: number;
  accountActive: boolean;
  retopUpRequired: boolean;
  slab: DashboardSlab | null;
  roiProgress: { current: number; target: number };
  capProgress: { current: number; target: number };
};

export type DashboardReferralApi = {
  referralId: string;
  referralLink: string;
  walletAddress: string;
  sponsorWalletAddress: string | null;
  joinedAt: string;
};

export type MonthlyRoiApi = {
  monthKey: string;
  totalRoi: number;
  count: number;
};

export type WithdrawableTotals = {
  amount: number;
  count: number;
  withdrawnAmount: number;
  claimableAmount: number;
};

export type IncomeEntry = {
  _id: string;
  amount: number;
  type: "direct" | "override";
  level: number;
  sourceUserId: string;
  cycleId: string;
  note: string;
  monthKey: string;
  createdAt: string;
};

export type WithdrawalRecord = {
  _id: string;
  userId: string;
  cycleId: string;
  requestedAmount: number;
  approvedAmount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  monthKey: string | null;
  incomeType: "direct" | "override" | "roi" | null;
  payoutTxHash: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WithdrawalHistoryItem = {
  id: string;
  requestedAmount: number;
  approvedAmount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  incomeType: "roi" | "direct" | "override" | null;
  monthKey: string | null;
  payoutTxHash: string | null;
  rejectionReason: string | null;
  requestedAt: string;
  processedAt: string | null;
};

export type WithdrawalHistorySummary = {
  totalWithdrawn: number;
  pendingAmount: number;
  approvedAmount: number;
  rejectedCount: number;
  totalCount: number;
};

export type WithdrawalHistoryPagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type WithdrawalHistoryApi = {
  items: WithdrawalHistoryItem[];
  summary: WithdrawalHistorySummary;
  pagination: WithdrawalHistoryPagination;
};

export type AdminKpisApi = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalPayouts: number;
  reTopUsers: number;
};

export type AdminRoiSlabApi = {
  name: string;
  min: number;
  max: number | null;
  monthlyPercent: number;
};

export type AdminOverridePercentageApi = {
  level: number;
  percent: number;
};

export type AdminConfigApi = {
  roiSlabs: AdminRoiSlabApi[];
  overridePercentages: AdminOverridePercentageApi[];
  withdrawalWindow: {
    dayOfMonth: number;
    isOpen: boolean;
  };
  emergencyPause: boolean;
  roiWithdrawPaused: boolean;
  incomeWithdrawPaused: boolean;
};

export type AdminSyncBatchApi = {
  _id?: string;
  batchId: string;
  source?: string;
  status?: string;
  stats?: Record<string, unknown>;
  revertedAt?: string | null;
  createdAt?: string;
};

export type AdminCycleProgressStatus =
  | "all"
  | "attention"
  | "active"
  | "inactive"
  | "roi_reached"
  | "cap_reached";

export type AdminCycleProgressRowApi = {
  cycleId: string;
  userId: string;
  walletAddress: string | null;
  referralId: string | null;
  cycleNumber: number;
  packageAmount: number;
  earnedRoi: number;
  roiTarget: number;
  totalEarned: number;
  incomeCap: number;
  earnedDirect: number;
  earnedOverride: number;
  isActive: boolean;
  startedAt: string;
  closedAt: string | null;
  roiProgressPercent: number;
  capProgressPercent: number;
  remainingToRoiTarget: number;
  remainingToIncomeCap: number;
  roiReached: boolean;
  capReached: boolean;
  status: Exclude<AdminCycleProgressStatus, "all" | "attention">;
};

export type AdminCycleProgressApi = {
  meta: {
    total: number;
    filteredTotal: number;
    limit: number;
    offset: number;
    count: number;
    status: AdminCycleProgressStatus;
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    roiReachedUsers: number;
    capReachedUsers: number;
    attentionUsers: number;
  };
  cycles: AdminCycleProgressRowApi[];
};

export type WithdrawalHistoryParams = {
  limit?: number;
  offset?: number;
  status?: "pending" | "approved" | "rejected" | "paid";
  type?: "roi" | "direct" | "override";
};

export type WithdrawableIncomeApi = {
  monthKey: string;
  totals: {
    direct: WithdrawableTotals;
    override: WithdrawableTotals;
    combined: { amount: number; count: number };
  };
  entries: IncomeEntry[];
  withdrawals: WithdrawalRecord[];
};

export type WithdrawalContractApi = {
  monthKey: string;
  roiTotal: number;
  withdrawnAmount: number;
  txHash: string;
  withdrawal: Record<string, unknown>;
};

export type DashboardWithdrawalWindowApi = {
  dayOfMonth: number;
  isOpen: boolean;
  isOpenNow: boolean;
};

export type DashboardWithdrawalControlsApi = {
  roiPaused: boolean;
  incomePaused: boolean;
};

export type DashboardApi = {
  investments: DashboardInvestmentsApi;
  income: DashboardIncomeApi;
  activeCycle: DashboardActiveCycleApi;
  referral: DashboardReferralApi;
  withdrawalWindow: DashboardWithdrawalWindowApi;
  withdrawalControls?: DashboardWithdrawalControlsApi;
  /** Legacy — not in the documented shape but still read by /dashboard/withdrawals until a dedicated endpoint exists. */
  withdrawals?: {
    history?: { id: string; date: string; amountUsdt: number; status: string }[];
  };
};

export const api = {
  requestNonce: (walletAddress: string) =>
    apiFetch<NonceResponse>("/auth/nonce", {
      method: "POST",
      json: { walletAddress },
    }),

  login: (args: {
    walletAddress: string;
    signature: string;
    sponsorWalletAddress?: string;
  }) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      json: args,
    }),

  backendLogin: (args: {
    walletAddress: string;
    password: string;
    sponsorWalletAddress?: string;
  }) =>
    apiFetch<LoginResponse>("/auth/backend-login", {
      method: "POST",
      json: args,
    }),

  getMe: (token: string) => apiFetch<AppUser>("/users/me", { token }),

  verifyDeposit: (args: VerifyDepositArgs, token: string) =>
    apiFetch<unknown>("/deposits/verify", {
      method: "POST",
      token,
      idempotencyKey: randomIdempotencyKey(),
      json: args,
    }),

  getDashboard: (token: string) =>
    apiFetch<DashboardApi>("/users/dashboard", { token }),

  getMonthlyRoi: (token: string, month: string) =>
    apiFetch<MonthlyRoiApi>(
      `/users/income/monthly-roi?month=${encodeURIComponent(month)}`,
      { token },
    ),

  getWithdrawableIncome: (token: string, month: string) =>
    apiFetch<WithdrawableIncomeApi>(
      `/users/income/withdrawable?month=${encodeURIComponent(month)}`,
      { token },
    ),

  withdrawContract: (
    args: {
      walletAddress: string;
      amount: number;
      type: "roi" | "direct" | "override";
      monthKey: string;
    },
    token: string,
    idempotencyKey: string,
  ) =>
    apiFetch<WithdrawalContractApi>("/withdrawals/contract", {
      method: "POST",
      token,
      idempotencyKey,
      json: args,
    }),

  getWithdrawalHistory: (
    token: string,
    params: WithdrawalHistoryParams = {},
  ) => {
    return apiFetch<WithdrawalHistoryApi>(
      withSearch("/withdrawals/history", {
        limit: params.limit,
        offset: params.offset,
        status: params.status,
        type: params.type,
      }),
      {
        token,
      },
    );
  },

  getAdminKpis: (token: string) =>
    apiFetch<AdminKpisApi>("/admin/kpis", { token }),

  getAdminConfig: (token: string) =>
    apiFetch<AdminConfigApi>("/admin/config", { token }),

  getAdminCycleProgress: (
    token: string,
    params: {
      limit?: number;
      offset?: number;
      status?: AdminCycleProgressStatus;
    } = {},
  ) =>
    apiFetch<AdminCycleProgressApi>(
      withSearch("/admin/cycles/progress", {
        limit: params.limit,
        offset: params.offset,
        status: params.status,
      }),
      { token },
    ),

  updateAdminConfig: (token: string, config: Partial<AdminConfigApi>) =>
    apiFetch<AdminConfigApi>("/admin/config", {
      method: "PATCH",
      token,
      json: config,
    }),

  syncDataJson: (password: string) =>
    apiFetch<unknown>("/admin/sync-data-json", {
      method: "POST",
      json: { password },
    }),

  syncRoiReport: (password: string) =>
    apiFetch<unknown>("/admin/sync-roi-report", {
      method: "POST",
      json: { password },
    }),

  listSyncBatches: (password: string) =>
    apiFetch<AdminSyncBatchApi[]>(
      withSearch("/admin/sync-batches", { password }),
    ),

  unsyncRoiReport: (password: string, batchId: string) =>
    apiFetch<unknown>("/admin/unsync-roi-report", {
      method: "POST",
      json: { password, batchId },
    }),

  getIncomeOverview: (password: string, months: number) =>
    apiFetch<unknown>(
      withSearch("/admin/income-overview", { password, months }),
    ),

  getMonthlyUserIncome: (password: string, month: string) =>
    apiFetch<unknown>(
      withSearch("/admin/monthly-user-income", { password, month }),
    ),

  getAdminWithdrawableIncome: (password: string, month: string) =>
    apiFetch<unknown>(
      withSearch("/admin/income/withdrawable", { password, month }),
    ),

  getAdminUserWithdrawableIncome: (
    password: string,
    userId: string,
    month: string,
  ) =>
    apiFetch<unknown>(
      withSearch(`/admin/users/${encodeURIComponent(userId)}/income/withdrawable`, {
        password,
        month,
      }),
    ),

  getCapReachedCycles: (password: string, limit: number, offset: number) =>
    apiFetch<unknown>(
      withSearch("/admin/cycles/cap-reached", { password, limit, offset }),
    ),

  fixLedgerMonthKeys: (password: string, dry: boolean) =>
    apiFetch<unknown>("/admin/fix-ledger-monthkeys", {
      method: "POST",
      json: { password, dry },
    }),

  payWithdrawal: (withdrawalId: string, token: string) =>
    apiFetch<unknown>(
      `/withdrawals/${encodeURIComponent(withdrawalId)}/pay`,
      {
        method: "POST",
        token,
        idempotencyKey: randomIdempotencyKey(),
      },
    ),

  health: () => apiFetch<unknown>("/health"),
};

export function extractToken(resp: LoginResponse): string | null {
  return resp.token ?? resp.jwt ?? resp.accessToken ?? null;
}
