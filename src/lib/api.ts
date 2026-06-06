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

export type DashboardApi = {
  investments: DashboardInvestmentsApi;
  income: DashboardIncomeApi;
  activeCycle: DashboardActiveCycleApi;
  referral: DashboardReferralApi;
  withdrawalWindow: DashboardWithdrawalWindowApi;
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

  health: () => apiFetch<unknown>("/health"),
};

export function extractToken(resp: LoginResponse): string | null {
  return resp.token ?? resp.jwt ?? resp.accessToken ?? null;
}
