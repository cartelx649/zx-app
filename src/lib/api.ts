const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://zx-backend-51w2.onrender.com/api/v1";

export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const NONCE_MESSAGE_PREFIX = "ZX Login Nonce: ";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type FetchOptions = Omit<RequestInit, "body"> & {
  token?: string | null;
  idempotencyKey?: string;
  json?: unknown;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function randomIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { token, idempotencyKey, json, headers, ...rest } = opts;
  const init: RequestInit = {
    ...rest,
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
    throw new ApiError(
      e instanceof Error ? e.message : "Network request failed",
      0,
    );
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON response (e.g. 502 from upstream) — fall through to status check
  }

  if (!res.ok || (body && body.ok === false)) {
    const msg =
      (body && (body.error ?? body.message)) ?? `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
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

export type VerifyDepositArgs = { txHash: string; amount: number };

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

  health: () => apiFetch<unknown>("/health"),
};

export function extractToken(resp: LoginResponse): string | null {
  return resp.token ?? resp.jwt ?? resp.accessToken ?? null;
}
