"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { WalletBar } from "@/components/hud/WalletBar";
import { HudButton, hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import { HudStat } from "@/components/hud/HudStat";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { extractToken, type AdminConfigApi, type AdminKpisApi, api } from "@/lib/api";

function currentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatUsdt(value: number) {
  return `${formatNumber(value)} USDT`;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function cloneConfig(config: AdminConfigApi): AdminConfigApi {
  return {
    roiSlabs: config.roiSlabs.map((slab) => ({ ...slab })),
    overridePercentages: config.overridePercentages.map((entry) => ({ ...entry })),
    withdrawalWindow: { ...config.withdrawalWindow },
    emergencyPause: config.emergencyPause,
  };
}

const PREVIEW_CONFIG: AdminConfigApi = {
  roiSlabs: [
    { name: "s1", min: 1, max: 500, monthlyPercent: 5 },
    { name: "s2", min: 501, max: 2000, monthlyPercent: 6 },
    { name: "s3", min: 2001, max: 5000, monthlyPercent: 7 },
    { name: "s4", min: 5001, max: null, monthlyPercent: 8 },
  ],
  overridePercentages: [
    { level: 1, percent: 10 },
    { level: 2, percent: 5 },
    { level: 3, percent: 3 },
    { level: 4, percent: 2 },
    { level: 5, percent: 0.5 },
  ],
  withdrawalWindow: {
    dayOfMonth: 4,
    isOpen: true,
  },
  emergencyPause: false,
};

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

  const [configDraft, setConfigDraft] = useState<AdminConfigApi | null>(null);
  const [syncPassword, setSyncPassword] = useState("");
  const [reportPassword, setReportPassword] = useState("");
  const [monthsInput, setMonthsInput] = useState("12");
  const [monthInput, setMonthInput] = useState(currentMonthKey);
  const [userIdInput, setUserIdInput] = useState("");
  const [batchIdInput, setBatchIdInput] = useState("");
  const [withdrawalIdInput, setWithdrawalIdInput] = useState("");
  const [capLimitInput, setCapLimitInput] = useState("100");
  const [capOffsetInput, setCapOffsetInput] = useState("0");
  const [fixDryRun, setFixDryRun] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (configQuery.data) {
      setConfigDraft(cloneConfig(configQuery.data));
      return;
    }
    if (previewMode) {
      setConfigDraft(cloneConfig(PREVIEW_CONFIG));
    }
  }, [configQuery.data, previewMode]);

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

  async function saveConfig() {
    if (!activeToken || !configDraft) return;
    const next = await runAction("config-save", () =>
      api.updateAdminConfig(activeToken, configDraft),
    );
    setConfigDraft(cloneConfig(next as AdminConfigApi));
    await configQuery.refetch();
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

  function updateRoiSlab(
    index: number,
    field: "name" | "min" | "max" | "monthlyPercent",
    value: string,
  ) {
    setConfigDraft((prev) => {
      if (!prev) return prev;
      const next = cloneConfig(prev);
      if (field === "name") {
        next.roiSlabs[index].name = value;
      } else if (field === "max") {
        next.roiSlabs[index].max = value === "" ? null : Number(value);
      } else {
        next.roiSlabs[index][field] = Number(value);
      }
      return next;
    });
  }

  function updateOverride(
    index: number,
    field: "level" | "percent",
    value: string,
  ) {
    setConfigDraft((prev) => {
      if (!prev) return prev;
      const next = cloneConfig(prev);
      next.overridePercentages[index][field] = Number(value);
      return next;
    });
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
            title="Config editor"
            subtitle="ROI slabs, overrides, withdrawal window, emergency pause"
            accent="purple"
          >
            {configQuery.error ? (
              <p className="text-sm text-red-300">
                {toErrorMessage(configQuery.error)}
              </p>
            ) : !configDraft ? (
              <p className="text-sm text-white/65">Loading config…</p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-white/55">
                    Edit the current backend config and save it with your admin token.
                  </p>
                  <div className="flex gap-2">
                    <HudButton
                      variant="ghost"
                      disabled={previewMode}
                      onClick={() =>
                        setConfigDraft(
                          cloneConfig(configQuery.data ?? PREVIEW_CONFIG),
                        )
                      }
                    >
                      Reset
                    </HudButton>
                    <HudButton
                      variant="cyan"
                      disabled={previewMode || busy["config-save"]}
                      onClick={() => void saveConfig()}
                    >
                      {busy["config-save"] ? "Saving…" : "Save config"}
                    </HudButton>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">ROI slabs</h3>
                    <HudButton
                      variant="ghost"
                      onClick={() =>
                        setConfigDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                roiSlabs: [
                                  ...prev.roiSlabs,
                                  {
                                    name: `s${prev.roiSlabs.length + 1}`,
                                    min: 0,
                                    max: null,
                                    monthlyPercent: 0,
                                  },
                                ],
                              }
                            : prev,
                        )
                      }
                    >
                      Add slab
                    </HudButton>
                  </div>
                  <div className="space-y-3">
                    {configDraft.roiSlabs.map((slab, index) => (
                      <div
                        key={`${slab.name}-${index}`}
                        className="grid gap-3 rounded-xl border border-white/8 bg-black/10 p-4 md:grid-cols-5"
                      >
                        <Field label="Name">
                          <input
                            className={textInputClass()}
                            value={slab.name}
                            onChange={(e) =>
                              updateRoiSlab(index, "name", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Min">
                          <input
                            className={textInputClass()}
                            type="number"
                            value={slab.min}
                            onChange={(e) =>
                              updateRoiSlab(index, "min", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Max" hint="Leave blank for open-ended slab">
                          <input
                            className={textInputClass()}
                            type="number"
                            value={slab.max ?? ""}
                            onChange={(e) =>
                              updateRoiSlab(index, "max", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Monthly %">
                          <input
                            className={textInputClass()}
                            type="number"
                            step="0.01"
                            value={slab.monthlyPercent}
                            onChange={(e) =>
                              updateRoiSlab(index, "monthlyPercent", e.target.value)
                            }
                          />
                        </Field>
                        <div className="flex items-end">
                          <HudButton
                            variant="danger"
                            className="w-full"
                            onClick={() =>
                              setConfigDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      roiSlabs: prev.roiSlabs.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                          >
                            Remove
                          </HudButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      Override percentages
                    </h3>
                    <HudButton
                      variant="ghost"
                      onClick={() =>
                        setConfigDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                overridePercentages: [
                                  ...prev.overridePercentages,
                                  { level: prev.overridePercentages.length + 1, percent: 0 },
                                ],
                              }
                            : prev,
                        )
                      }
                    >
                      Add level
                    </HudButton>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {configDraft.overridePercentages.map((entry, index) => (
                      <div
                        key={`${entry.level}-${index}`}
                        className="grid gap-3 rounded-xl border border-white/8 bg-black/10 p-4 sm:grid-cols-[1fr_1fr_auto]"
                      >
                        <Field label="Level">
                          <input
                            className={textInputClass()}
                            type="number"
                            value={entry.level}
                            onChange={(e) =>
                              updateOverride(index, "level", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Percent">
                          <input
                            className={textInputClass()}
                            type="number"
                            step="0.01"
                            value={entry.percent}
                            onChange={(e) =>
                              updateOverride(index, "percent", e.target.value)
                            }
                          />
                        </Field>
                        <div className="flex items-end">
                          <HudButton
                            variant="danger"
                            onClick={() =>
                              setConfigDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      overridePercentages:
                                        prev.overridePercentages.filter(
                                          (_, itemIndex) => itemIndex !== index,
                                        ),
                                    }
                                  : prev,
                              )
                            }
                          >
                            Remove
                          </HudButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Withdrawal day">
                    <input
                      className={textInputClass()}
                      type="number"
                      min={1}
                      max={28}
                      value={configDraft.withdrawalWindow.dayOfMonth}
                      onChange={(e) =>
                        setConfigDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                withdrawalWindow: {
                                  ...prev.withdrawalWindow,
                                  dayOfMonth: Number(e.target.value),
                                },
                              }
                            : prev,
                        )
                      }
                    />
                  </Field>
                  <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-white/75">
                    <input
                      type="checkbox"
                      checked={configDraft.withdrawalWindow.isOpen}
                      onChange={(e) =>
                        setConfigDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                withdrawalWindow: {
                                  ...prev.withdrawalWindow,
                                  isOpen: e.target.checked,
                                },
                              }
                            : prev,
                        )
                      }
                    />
                    Withdrawal window enabled
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-white/75">
                    <input
                      type="checkbox"
                      checked={configDraft.emergencyPause}
                      onChange={(e) =>
                        setConfigDraft((prev) =>
                          prev
                            ? { ...prev, emergencyPause: e.target.checked }
                            : prev,
                        )
                      }
                    />
                    Emergency pause
                  </label>
                </div>

                <JsonBlock
                  title="Save result"
                  data={results["config-save"]}
                  error={errors["config-save"]}
                />
              </div>
            )}
          </HudPanel>

          <div className="grid gap-4 lg:grid-cols-2">
            <HudPanel
              title="Sync credentials"
              subtitle="Used by sync / maintenance routes"
              accent="amber"
            >
              <div className="space-y-4">
                <Field
                  label="Sync password"
                  hint="Used for sync-data-json, sync-roi-report, unsync, sync-batches, and month-key fixes."
                >
                  <input
                    className={textInputClass()}
                    type="password"
                    value={syncPassword}
                    onChange={(e) => setSyncPassword(e.target.value)}
                  />
                </Field>
                <Field
                  label="Report password"
                  hint="Used for income overview, monthly income, withdrawable income, and cap-reached reports."
                >
                  <input
                    className={textInputClass()}
                    type="password"
                    value={reportPassword}
                    onChange={(e) => setReportPassword(e.target.value)}
                  />
                </Field>
              </div>
            </HudPanel>

            <HudPanel
              title="Withdrawal payout"
              subtitle="Admin-token protected payment action"
              accent="cyan"
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <Field label="Withdrawal ID">
                  <input
                    className={textInputClass()}
                    value={withdrawalIdInput}
                    onChange={(e) => setWithdrawalIdInput(e.target.value)}
                    placeholder="685d...mongodb id"
                  />
                </Field>
                <div className="flex items-end">
                  <HudButton
                    className="w-full"
                    variant="cyan"
                    disabled={
                      previewMode ||
                      !activeToken ||
                      !withdrawalIdInput ||
                      busy["pay-withdrawal"]
                    }
                    onClick={() =>
                      void runAction("pay-withdrawal", () =>
                        api.payWithdrawal(withdrawalIdInput.trim(), activeToken!),
                      )
                    }
                  >
                    {busy["pay-withdrawal"] ? "Paying…" : "Pay withdrawal"}
                  </HudButton>
                </div>
              </div>
              <JsonBlock
                title="Payout result"
                data={results["pay-withdrawal"]}
                error={errors["pay-withdrawal"]}
              />
            </HudPanel>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <HudPanel
              title="Sync and maintenance"
              subtitle="Server-side jobs and cleanup tools"
              accent="amber"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <HudButton
                    variant="ghost"
                    disabled={previewMode || !syncPassword || busy["sync-data-json"]}
                    onClick={() =>
                      void runAction("sync-data-json", () =>
                        api.syncDataJson(syncPassword),
                      )
                    }
                  >
                    {busy["sync-data-json"] ? "Running…" : "Sync data.json"}
                  </HudButton>
                  <HudButton
                    variant="ghost"
                    disabled={previewMode || !syncPassword || busy["sync-roi-report"]}
                    onClick={() =>
                      void runAction("sync-roi-report", () =>
                        api.syncRoiReport(syncPassword),
                      )
                    }
                  >
                    {busy["sync-roi-report"] ? "Running…" : "Sync ROI report"}
                  </HudButton>
                  <HudButton
                    variant="ghost"
                    disabled={previewMode || !syncPassword || busy["sync-batches"]}
                    onClick={() =>
                      void runAction("sync-batches", () =>
                        api.listSyncBatches(syncPassword),
                      )
                    }
                  >
                    {busy["sync-batches"] ? "Loading…" : "List sync batches"}
                  </HudButton>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <Field label="Batch ID to unsync">
                    <input
                      className={textInputClass()}
                      value={batchIdInput}
                      onChange={(e) => setBatchIdInput(e.target.value)}
                      placeholder="roi-report-2026-..."
                    />
                  </Field>
                  <div className="flex items-end">
                    <HudButton
                      className="w-full"
                      variant="danger"
                      disabled={
                        previewMode ||
                        !syncPassword ||
                        !batchIdInput ||
                        busy["unsync-roi-report"]
                      }
                      onClick={() =>
                        void runAction("unsync-roi-report", () =>
                          api.unsyncRoiReport(syncPassword, batchIdInput.trim()),
                        )
                      }
                    >
                      {busy["unsync-roi-report"] ? "Unsyncing…" : "Unsync batch"}
                    </HudButton>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/10 p-4">
                  <label className="flex items-center gap-3 text-sm text-white/75">
                    <input
                      type="checkbox"
                      checked={fixDryRun}
                      onChange={(e) => setFixDryRun(e.target.checked)}
                    />
                    Dry run ledger month-key fix
                  </label>
                  <HudButton
                    variant="cyan"
                    disabled={previewMode || !syncPassword || busy["fix-ledger-monthkeys"]}
                    onClick={() =>
                      void runAction("fix-ledger-monthkeys", () =>
                        api.fixLedgerMonthKeys(syncPassword, fixDryRun),
                      )
                    }
                  >
                    {busy["fix-ledger-monthkeys"] ? "Running…" : "Run month-key fix"}
                  </HudButton>
                </div>

                <JsonBlock
                  title="Sync data.json result"
                  data={results["sync-data-json"]}
                  error={errors["sync-data-json"]}
                />
                <JsonBlock
                  title="Sync ROI report result"
                  data={results["sync-roi-report"]}
                  error={errors["sync-roi-report"]}
                />
                <JsonBlock
                  title="Sync batches"
                  data={results["sync-batches"]}
                  error={errors["sync-batches"]}
                />
                <JsonBlock
                  title="Unsync batch result"
                  data={results["unsync-roi-report"]}
                  error={errors["unsync-roi-report"]}
                />
                <JsonBlock
                  title="Month-key fix result"
                  data={results["fix-ledger-monthkeys"]}
                  error={errors["fix-ledger-monthkeys"]}
                />
              </div>
            </HudPanel>

            <HudPanel
              title="Income and audit reports"
              subtitle="Password-backed reporting tools"
              accent="purple"
            >
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <Field label="Months for overview">
                    <input
                      className={textInputClass()}
                      type="number"
                      min={0}
                      max={120}
                      value={monthsInput}
                      onChange={(e) => setMonthsInput(e.target.value)}
                    />
                  </Field>
                  <div className="flex items-end">
                    <HudButton
                      className="w-full"
                      variant="ghost"
                      disabled={previewMode || !reportPassword || busy["income-overview"]}
                      onClick={() =>
                        void runAction("income-overview", () =>
                          api.getIncomeOverview(
                            reportPassword,
                            Number(monthsInput || "0"),
                          ),
                        )
                      }
                    >
                      {busy["income-overview"] ? "Loading…" : "Income overview"}
                    </HudButton>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <Field label="Month key" hint="YYYY-MM">
                    <input
                      className={textInputClass()}
                      value={monthInput}
                      onChange={(e) => setMonthInput(e.target.value)}
                    />
                  </Field>
                  <div className="flex items-end">
                    <HudButton
                      className="w-full"
                      variant="ghost"
                      disabled={
                        previewMode ||
                        !reportPassword ||
                        !monthInput ||
                        busy["monthly-user-income"]
                      }
                      onClick={() =>
                        void runAction("monthly-user-income", () =>
                          api.getMonthlyUserIncome(reportPassword, monthInput.trim()),
                        )
                      }
                    >
                      {busy["monthly-user-income"] ? "Loading…" : "Monthly income"}
                    </HudButton>
                  </div>
                  <div className="flex items-end">
                    <HudButton
                      className="w-full"
                      variant="ghost"
                      disabled={
                        previewMode ||
                        !reportPassword ||
                        !monthInput ||
                        busy["all-users-withdrawable"]
                      }
                      onClick={() =>
                        void runAction("all-users-withdrawable", () =>
                          api.getAdminWithdrawableIncome(
                            reportPassword,
                            monthInput.trim(),
                          ),
                        )
                      }
                    >
                      {busy["all-users-withdrawable"] ? "Loading…" : "All users withdrawable"}
                    </HudButton>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Field label="User ID">
                    <input
                      className={textInputClass()}
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      placeholder="mongodb user id"
                    />
                  </Field>
                  <Field label="Month key" hint="Used for single-user withdrawable query">
                    <input
                      className={textInputClass()}
                      value={monthInput}
                      onChange={(e) => setMonthInput(e.target.value)}
                    />
                  </Field>
                  <div className="flex items-end">
                    <HudButton
                      className="w-full"
                      variant="ghost"
                      disabled={
                        previewMode ||
                        !reportPassword ||
                        !userIdInput ||
                        !monthInput ||
                        busy["single-user-withdrawable"]
                      }
                      onClick={() =>
                        void runAction("single-user-withdrawable", () =>
                          api.getAdminUserWithdrawableIncome(
                            reportPassword,
                            userIdInput.trim(),
                            monthInput.trim(),
                          ),
                        )
                      }
                    >
                      {busy["single-user-withdrawable"] ? "Loading…" : "Single user withdrawable"}
                    </HudButton>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Field label="Cap report limit">
                    <input
                      className={textInputClass()}
                      type="number"
                      min={1}
                      max={1000}
                      value={capLimitInput}
                      onChange={(e) => setCapLimitInput(e.target.value)}
                    />
                  </Field>
                  <Field label="Offset">
                    <input
                      className={textInputClass()}
                      type="number"
                      min={0}
                      value={capOffsetInput}
                      onChange={(e) => setCapOffsetInput(e.target.value)}
                    />
                  </Field>
                  <div className="flex items-end">
                    <HudButton
                      className="w-full"
                      variant="ghost"
                      disabled={previewMode || !reportPassword || busy["cap-reached-cycles"]}
                      onClick={() =>
                        void runAction("cap-reached-cycles", () =>
                          api.getCapReachedCycles(
                            reportPassword,
                            Number(capLimitInput || "100"),
                            Number(capOffsetInput || "0"),
                          ),
                        )
                      }
                    >
                      {busy["cap-reached-cycles"] ? "Loading…" : "Cap reached cycles"}
                    </HudButton>
                  </div>
                </div>

                <JsonBlock
                  title="Income overview"
                  data={results["income-overview"]}
                  error={errors["income-overview"]}
                />
                <JsonBlock
                  title="Monthly user income"
                  data={results["monthly-user-income"]}
                  error={errors["monthly-user-income"]}
                />
                <JsonBlock
                  title="All users withdrawable income"
                  data={results["all-users-withdrawable"]}
                  error={errors["all-users-withdrawable"]}
                />
                <JsonBlock
                  title="Single user withdrawable income"
                  data={results["single-user-withdrawable"]}
                  error={errors["single-user-withdrawable"]}
                />
                <JsonBlock
                  title="Cap reached cycles"
                  data={results["cap-reached-cycles"]}
                  error={errors["cap-reached-cycles"]}
                />
              </div>
            </HudPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
