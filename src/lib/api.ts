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

export type DashboardCycle = {
  number?: number;
  current?: number;
  packageUsdt?: number;
  roiSlabLabel?: string;
  roiEarnedUsdt?: number;
  roiTargetUsdt?: number;
  capEarnedUsdt?: number;
  capMaxUsdt?: number;
  active?: boolean;
  needsReTopUp?: boolean;
  activeCycleLabel?: string;
} & Record<string, unknown>;

export type DashboardIncomes = {
  totalEarnedUsdt?: number;
  directIncomeUsdt?: number;
  levelByLevel?: { level: number; percentLabel?: string; earnedUsdt: number }[];
} & Record<string, unknown>;

export type DashboardWithdrawals = {
  windowNote?: string;
  history?: { id: string; date: string; amountUsdt: number; status: string }[];
} & Record<string, unknown>;

export type DashboardApi = {
  cycle?: DashboardCycle;
  incomes?: DashboardIncomes;
  withdrawals?: DashboardWithdrawals;
} & Record<string, unknown>;

export type MeResponse = {
  walletAddress?: string;
  sponsorWalletAddress?: string;
  referralId?: string;
  joiningDate?: string;
  referralLink?: string;
} & Record<string, unknown>;

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

  getMe: (token: string) => apiFetch<MeResponse>("/users/me", { token }),

  health: () => apiFetch<unknown>("/health"),
};

export function extractToken(resp: LoginResponse): string | null {
  return resp.token ?? resp.jwt ?? resp.accessToken ?? null;
}
