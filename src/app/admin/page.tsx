"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { WalletBar } from "@/components/hud/WalletBar";
import { HudButton, hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { HudStat } from "@/components/hud/HudStat";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  api,
  extractToken,
  type AdminConfigApi,
  type AdminCycleProgressStatus,
  type AdminKpisApi,
} from "@/lib/api";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatUsdt(value: number) {
  return `${formatNumber(value)} USDT`;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function shortAddress(value: string | null) {
  if (!value) return "—";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-white/45">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-white/40">{hint}</span> : null}
    </label>
  );
}

function textInputClass() {
  return "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40 focus:bg-black/30";
}

function JsonBlock({
  title,
  data,
  error,
}: {
  title: string;
  data: unknown;
  error?: string | null;
}) {
  if (!data && !error) return null;

  return (
    <div className="mt-3 rounded-xl border border-white/8 bg-black/20 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/45">
        {title}
      </p>
      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-white/75">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { isConnected } = useAccount();
  const { token, isAuthenticated } = useAuth();
  const {
    data: walletUser,
    isLoading: isCurrentUserLoading,
    error: currentUserError,
    isAdmin: walletIsAdmin,
  } = useCurrentUser();
  const [testToken, setTestToken] = useState<string | null>(null);
  const [testWalletAddress, setTestWalletAddress] = useState("");
  const [backendLoginPassword, setBackendLoginPassword] = useState("");

  const activeToken = token ?? testToken;
  const testUserQuery = useQuery({
    queryKey: ["admin-test-user", Boolean(testToken), testToken],
    enabled: Boolean(!token && testToken),
    queryFn: () => api.getMe(testToken!),
    staleTime: 30_000,
  });

  const currentUser = walletUser ?? testUserQuery.data ?? null;
  const adminEnabled = Boolean(
    activeToken &&
      ((token && isConnected && isAuthenticated && walletIsAdmin) ||
        (!token && currentUser?.role === "admin")),
  );
  const previewMode = !adminEnabled;

  const kpisQuery = useQuery({
    queryKey: ["admin-kpis", Boolean(activeToken), activeToken],
    enabled: adminEnabled,
    queryFn: () => api.getAdminKpis(activeToken!),
    staleTime: 30_000,
  });

  const configQuery = useQuery({
    queryKey: ["admin-config", Boolean(activeToken), activeToken],
    enabled: adminEnabled,
    queryFn: () => api.getAdminConfig(activeToken!),
    staleTime: 30_000,
  });

  const cycleProgressQuery = useQuery({
    queryKey: ["admin-cycle-progress", Boolean(activeToken), activeToken],
    enabled: adminEnabled,
    queryFn: () =>
      api.getAdminCycleProgress(activeToken!, {
        limit: 250,
        offset: 0,
        status: "all",
      }),
    staleTime: 30_000,
  });

  const [cappingStatus, setCappingStatus] =
    useState<AdminCycleProgressStatus>("all");
  const [cappingSearch, setCappingSearch] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  async function runAction<T>(key: string, work: () => Promise<T>) {
    setBusy((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: null }));
    try {
      const result = await work();
      setResults((prev) => ({ ...prev, [key]: result }));
      return result;
    } catch (error) {
      const message = toErrorMessage(error);
      setErrors((prev) => ({ ...prev, [key]: message }));
      throw error;
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function startTestSession() {
    const response = await runAction("backend-login", () =>
      api.backendLogin({
        walletAddress: testWalletAddress.trim(),
        password: backendLoginPassword,
      }),
    );
    const jwt = extractToken(response);
    if (!jwt) {
      throw new Error("Backend login succeeded but no token was returned.");
    }
    setTestToken(jwt);
  }

  async function updatePauseControl(
    field: "roiWithdrawPaused" | "incomeWithdrawPaused",
    value: boolean,
  ) {
    if (!activeToken) return;
    await runAction(`pause-control-${field}`, () =>
      api.updateAdminConfig(activeToken, { [field]: value } as Partial<AdminConfigApi>),
    );
    await configQuery.refetch();
  }

  function adminStats(kpis: AdminKpisApi | undefined) {
    if (!kpis) {
      return [
        { label: "Total users", value: "—" },
        { label: "Active users", value: "—" },
        { label: "Inactive users", value: "—" },
        { label: "Total deposits", value: "—" },
        { label: "Total withdrawals", value: "—" },
        { label: "Total payouts", value: "—" },
        { label: "Re-top users", value: "—" },
      ];
    }
    return [
      { label: "Total users", value: formatNumber(kpis.totalUsers) },
      { label: "Active users", value: formatNumber(kpis.activeUsers) },
      { label: "Inactive users", value: formatNumber(kpis.inactiveUsers) },
      { label: "Total deposits", value: formatUsdt(kpis.totalDeposits) },
      { label: "Total withdrawals", value: formatNumber(kpis.totalWithdrawals) },
      { label: "Total payouts", value: formatUsdt(kpis.totalPayouts) },
      { label: "Re-top users", value: formatNumber(kpis.reTopUsers) },
    ];
  }

  const stats = useMemo(() => adminStats(kpisQuery.data), [kpisQuery.data]);
  const visibleCycleRows = useMemo(() => {
    const rows = cycleProgressQuery.data?.cycles ?? [];
    const search = cappingSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (cappingStatus !== "all") {
        if (cappingStatus === "attention" && !(row.roiReached || row.capReached)) {
          return false;
        }
        if (cappingStatus !== "attention" && row.status !== cappingStatus) {
          return false;
        }
      }
      if (!search) return true;
      return (
        row.walletAddress?.toLowerCase().includes(search) ||
        row.referralId?.toLowerCase().includes(search) ||
        String(row.cycleNumber).includes(search)
      );
    });
  }, [cappingSearch, cappingStatus, cycleProgressQuery.data?.cycles]);

  if (isCurrentUserLoading || testUserQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <WalletBar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <HudPanel title="Admin access" subtitle="Checking permissions">
            <p className="text-sm text-white/65">Loading your admin session…</p>
          </HudPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-12 h-[28rem] w-[28rem] rounded-full bg-purple-600/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/2 h-[32rem] w-[32rem] rounded-full bg-cyan-600/10 blur-3xl"
      />

      <div className="relative">
        <WalletBar />
        <nav className="border-b border-white/5 bg-white/[0.02] px-4 py-2 backdrop-blur-xl">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-1">
            {[
              { href: "/dashboard", label: "Overview" },
              { href: "/dashboard/withdrawals", label: "Withdrawals" },
              { href: "/admin", label: "Admin" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    link.href === "/admin"
                      ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      : "border border-transparent text-white/65 hover:border-purple-400/30 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wider text-white/45">
                Operations
              </p>
              <h1 className="font-display text-3xl font-semibold text-white">
                Admin control center
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <HudButton
                variant="ghost"
                disabled={previewMode}
                onClick={() => {
                  void kpisQuery.refetch();
                  void configQuery.refetch();
                  void cycleProgressQuery.refetch();
                }}
              >
                Refresh
              </HudButton>
              <Link href="/dashboard" className={hudButtonClass("ghost")}>
                Back to dashboard
              </Link>
            </div>
          </div>

          <HudPanel
            title="Admin session"
            subtitle={
              previewMode
                ? "Preview mode without wallet auth"
                : "Wallet-authenticated control surface"
            }
            accent="cyan"
          >
            {previewMode ? (
              <div className="mb-4 space-y-4">
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                  Wallet connect hata diya gaya hai for testing. Live data lane ke liye niche admin wallet address aur backend login password dal ke test session start kar.
                  {currentUserError ? ` Current wallet auth error: ${currentUserError}` : ""}
                  {testUserQuery.error
                    ? ` Test session error: ${toErrorMessage(testUserQuery.error)}`
                    : ""}
                </div>
                <div className="grid gap-3 rounded-xl border border-white/8 bg-black/10 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Field label="Admin wallet address">
                    <input
                      className={textInputClass()}
                      value={testWalletAddress}
                      onChange={(e) => setTestWalletAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </Field>
                  <Field label="Backend login password">
                    <input
                      className={textInputClass()}
                      type="password"
                      value={backendLoginPassword}
                      onChange={(e) => setBackendLoginPassword(e.target.value)}
                    />
                  </Field>
                  <div className="flex items-end gap-2">
                    <HudButton
                      className="w-full"
                      variant="cyan"
                      disabled={
                        !testWalletAddress || !backendLoginPassword || busy["backend-login"]
                      }
                      onClick={() => void startTestSession()}
                    >
                      {busy["backend-login"] ? "Starting…" : "Start test session"}
                    </HudButton>
                    {testToken ? (
                      <HudButton
                        variant="ghost"
                        onClick={() => {
                          setTestToken(null);
                          setResults((prev) => ({ ...prev, "backend-login": null }));
                        }}
                      >
                        Clear
                      </HudButton>
                    ) : null}
                  </div>
                </div>
                <JsonBlock
                  title="Test session login result"
                  data={results["backend-login"]}
                  error={errors["backend-login"]}
                />
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-3">
              <HudStat
                label="Role"
                value={currentUser?.role?.toUpperCase() ?? "PREVIEW"}
              />
              <HudStat
                label="Wallet"
                value={currentUser?.walletAddress ?? "Not connected"}
              />
              <HudStat
                label="Status"
                value={
                  currentUser
                    ? currentUser.isActive
                      ? "ACTIVE"
                      : "INACTIVE"
                    : "PREVIEW"
                }
              />
            </div>
          </HudPanel>

          <HudPanel
            title="Live KPIs"
            subtitle="Powered by /api/v1/admin/kpis"
            accent="green"
          >
            {kpisQuery.error ? (
              <p className="text-sm text-red-300">
                {toErrorMessage(kpisQuery.error)}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <HudStat key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </div>
            )}
          </HudPanel>

          <HudPanel
            title="Withdrawal controls"
            subtitle="Pause or resume ROI and income withdrawals separately for all users"
            accent="purple"
          >
            {previewMode ? (
              <p className="text-sm text-white/65">
                Live pause/resume controls admin auth ke baad available honge.
              </p>
            ) : configQuery.error ? (
              <p className="text-sm text-red-300">{toErrorMessage(configQuery.error)}</p>
            ) : !configQuery.data ? (
              <p className="text-sm text-white/65">Loading withdrawal controls…</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">ROI withdrawal</p>
                      <p className="mt-1 text-sm text-white/55">
                        Pause karne par users monthly ROI withdraw nahi kar paayenge.
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                        configQuery.data.roiWithdrawPaused
                          ? "border-red-400/30 bg-red-500/10 text-red-300"
                          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {configQuery.data.roiWithdrawPaused ? "Paused" : "Live"}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <HudButton
                      className="flex-1"
                      variant="danger"
                      disabled={
                        configQuery.data.roiWithdrawPaused ||
                        busy["pause-control-roiWithdrawPaused"]
                      }
                      onClick={() => void updatePauseControl("roiWithdrawPaused", true)}
                    >
                      {busy["pause-control-roiWithdrawPaused"] ? "Updating…" : "Pause ROI"}
                    </HudButton>
                    <HudButton
                      className="flex-1"
                      variant="ghost"
                      disabled={
                        !configQuery.data.roiWithdrawPaused ||
                        busy["pause-control-roiWithdrawPaused"]
                      }
                      onClick={() => void updatePauseControl("roiWithdrawPaused", false)}
                    >
                      Resume ROI
                    </HudButton>
                  </div>
                  {errors["pause-control-roiWithdrawPaused"] ? (
                    <p className="mt-3 text-sm text-red-300">
                      {errors["pause-control-roiWithdrawPaused"]}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Income withdrawal</p>
                      <p className="mt-1 text-sm text-white/55">
                        Pause karne par direct aur override income withdraw band ho jayega.
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                        configQuery.data.incomeWithdrawPaused
                          ? "border-red-400/30 bg-red-500/10 text-red-300"
                          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {configQuery.data.incomeWithdrawPaused ? "Paused" : "Live"}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <HudButton
                      className="flex-1"
                      variant="danger"
                      disabled={
                        configQuery.data.incomeWithdrawPaused ||
                        busy["pause-control-incomeWithdrawPaused"]
                      }
                      onClick={() => void updatePauseControl("incomeWithdrawPaused", true)}
                    >
                      {busy["pause-control-incomeWithdrawPaused"] ? "Updating…" : "Pause income"}
                    </HudButton>
                    <HudButton
                      className="flex-1"
                      variant="ghost"
                      disabled={
                        !configQuery.data.incomeWithdrawPaused ||
                        busy["pause-control-incomeWithdrawPaused"]
                      }
                      onClick={() => void updatePauseControl("incomeWithdrawPaused", false)}
                    >
                      Resume income
                    </HudButton>
                  </div>
                  {errors["pause-control-incomeWithdrawPaused"] ? (
                    <p className="mt-3 text-sm text-red-300">
                      {errors["pause-control-incomeWithdrawPaused"]}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </HudPanel>

          <HudPanel
            title="User capping watchlist"
            subtitle="Track 2X ROI target and 3X total cap for each user's latest cycle"
            accent="amber"
          >
            {previewMode ? (
              <p className="text-sm text-white/65">
                Live capping data admin auth ke baad load hogi.
              </p>
            ) : cycleProgressQuery.error ? (
              <p className="text-sm text-red-300">
                {toErrorMessage(cycleProgressQuery.error)}
              </p>
            ) : !cycleProgressQuery.data ? (
              <p className="text-sm text-white/65">Loading cycle progress…</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <HudStat
                    label="Tracked users"
                    value={formatNumber(cycleProgressQuery.data.summary.totalUsers)}
                  />
                  <HudStat
                    label="ROI 2X reached"
                    value={formatNumber(cycleProgressQuery.data.summary.roiReachedUsers)}
                  />
                  <HudStat
                    label="Cap 3X reached"
                    value={formatNumber(cycleProgressQuery.data.summary.capReachedUsers)}
                  />
                  <HudStat
                    label="Needs notification"
                    value={formatNumber(cycleProgressQuery.data.summary.attentionUsers)}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                  <Field label="Search user">
                    <input
                      className={textInputClass()}
                      value={cappingSearch}
                      onChange={(e) => setCappingSearch(e.target.value)}
                      placeholder="wallet / referral / cycle"
                    />
                  </Field>
                  <Field label="Status filter">
                    <select
                      className={textInputClass()}
                      value={cappingStatus}
                      onChange={(e) =>
                        setCappingStatus(e.target.value as AdminCycleProgressStatus)
                      }
                    >
                      <option value="all">All users</option>
                      <option value="attention">Needs notification</option>
                      <option value="roi_reached">ROI 2X reached</option>
                      <option value="cap_reached">Cap 3X reached</option>
                      <option value="active">Active cycles</option>
                      <option value="inactive">Inactive cycles</option>
                    </select>
                  </Field>
                  <div className="flex items-end">
                    <HudButton
                      className="w-full"
                      variant="ghost"
                      onClick={() => void cycleProgressQuery.refetch()}
                    >
                      Refresh capping data
                    </HudButton>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/8 bg-black/10">
                  <table className="min-w-full text-left text-sm text-white/80">
                    <thead className="border-b border-white/8 text-xs uppercase tracking-wider text-white/45">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Cycle</th>
                        <th className="px-4 py-3">ROI 2X progress</th>
                        <th className="px-4 py-3">Total 3X cap</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCycleRows.map((row) => {
                        const statusTone = row.capReached
                          ? "border-red-400/30 bg-red-500/10 text-red-300"
                          : row.roiReached
                            ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                            : row.isActive
                              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-white/65";
                        const actionText = row.capReached
                          ? "Cap 3X reached — ask for re-top up."
                          : row.roiReached
                            ? "ROI 2X reached — notify user."
                            : row.isActive
                              ? "Cycle still running."
                              : "Inactive cycle — review next step.";

                        return (
                          <tr key={row.cycleId} className="border-b border-white/6 last:border-b-0">
                            <td className="px-4 py-3 align-top">
                              <div className="font-mono text-white">{shortAddress(row.walletAddress)}</div>
                              <div className="text-xs text-white/45">
                                {row.walletAddress ?? "No wallet"}
                              </div>
                              <div className="mt-1 text-xs text-white/55">
                                Ref: {row.referralId ?? "—"}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-white">
                                Cycle {row.cycleNumber}
                              </div>
                              <div className="text-xs text-white/55">
                                Package: {formatUsdt(row.packageAmount)}
                              </div>
                              <div className="text-xs text-white/45">
                                Started: {formatDateTime(row.startedAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-white">
                                {formatUsdt(row.earnedRoi)} / {formatUsdt(row.roiTarget)}
                              </div>
                              <div className="text-xs text-white/55">
                                {formatPercent(row.roiProgressPercent)} complete
                              </div>
                              <div className="text-xs text-white/45">
                                Remaining: {formatUsdt(row.remainingToRoiTarget)}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium text-white">
                                {formatUsdt(row.totalEarned)} / {formatUsdt(row.incomeCap)}
                              </div>
                              <div className="text-xs text-white/55">
                                {formatPercent(row.capProgressPercent)} complete
                              </div>
                              <div className="text-xs text-white/45">
                                Remaining: {formatUsdt(row.remainingToIncomeCap)}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusTone}`}>
                                {row.capReached
                                  ? "Cap 3X reached"
                                  : row.roiReached
                                    ? "ROI 2X reached"
                                    : row.isActive
                                      ? "Active"
                                      : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top text-xs text-white/70">
                              <p>{actionText}</p>
                              <p className="mt-1 text-white/45">
                                Direct: {formatUsdt(row.earnedDirect)} · Override:{" "}
                                {formatUsdt(row.earnedOverride)}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {visibleCycleRows.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-white/55">
                      Is filter me koi user nahi mila.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </HudPanel>
        </div>
      </div>
    </div>
  );
}
