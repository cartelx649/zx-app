"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatUnits, isAddress } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { bsc } from "wagmi/chains";
import { HudButton, hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";
import {
  parseDepositAddress,
  useUsdtDeposit,
} from "@/hooks/useUsdtDeposit";
import { useDashboard } from "@/hooks/useDashboard";
import {
  clearStoredSponsor,
  persistSponsor,
  readStoredSponsor,
  useAuth,
} from "@/hooks/useAuth";
import { api } from "@/lib/api";

type Tier = {
  name: string;
  min: number;
  max: number;
  rate: string;
  suggested: number;
};

const TIERS: Tier[] = [
  { name: "Basic", min: 1, max: 500, rate: "5% / Month", suggested: 100 },
  { name: "Pro", min: 501, max: 2000, rate: "6% / Month", suggested: 1000 },
  {
    name: "Pro Ultimate",
    min: 2001,
    max: 5000,
    rate: "7% / Month",
    suggested: 3000,
  },
  {
    name: "Enterprise",
    min: 5001,
    max: Number.POSITIVE_INFINITY,
    rate: "8% / Month",
    suggested: 5000,
  },
];

function activeTier(amount: number | null): Tier | null {
  if (amount == null || amount < 1) return null;
  return TIERS.find((t) => amount >= t.min && amount <= t.max) ?? null;
}

function fmtRange(t: Tier): { min: string; max: string } {
  return {
    min: `${t.min} USD`,
    max: t.max === Number.POSITIVE_INFINITY ? "Infinity USD" : `${t.max} USD`,
  };
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function DepositForm() {
  const { address, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { token } = useAuth();
  const { data: dashboard, refetch: refetchDashboard } = useDashboard();

  const depositEnv = process.env.NEXT_PUBLIC_DEPOSIT_CONTRACT;
  const depositAddress = parseDepositAddress(depositEnv);

  const [amountInput, setAmountInput] = useState("");
  const amountUsdt = useMemo(() => {
    const n = Number(amountInput);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [amountInput]);

  const d = useUsdtDeposit(depositAddress, amountUsdt);

  const [sponsor, setSponsor] = useState("");
  const [sponsorEdit, setSponsorEdit] = useState(false);
  const [sponsorDraft, setSponsorDraft] = useState("");

  useEffect(() => {
    setSponsor(readStoredSponsor());
  }, []);

  const sponsorDraftValid = sponsorDraft.length === 0 || isAddress(sponsorDraft);

  const handleSponsorSave = () => {
    if (!isAddress(sponsorDraft)) return;
    persistSponsor(sponsorDraft);
    setSponsor(sponsorDraft);
    setSponsorEdit(false);
    setSponsorDraft("");
  };

  const handleSponsorClear = () => {
    clearStoredSponsor();
    setSponsor("");
  };

  const [lastAction, setLastAction] = useState<"approve" | "deposit" | null>(
    null,
  );
  const [success, setSuccess] = useState(false);
  const [verifyState, setVerifyState] = useState<
    "idle" | "pending" | "done" | "error"
  >("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const verifiedRef = useRef<string | null>(null);
  const wasBusy = useRef(false);

  useEffect(() => {
    if (success) return;
    if (wasBusy.current && !d.isBusy && lastAction === "deposit" && !d.error) {
      setSuccess(true);
    }
    wasBusy.current = d.isBusy;
  }, [d.isBusy, d.error, lastAction, success]);

  useEffect(() => {
    const txHash = d.lastDepositTxHash;
    if (!txHash || amountUsdt == null) return;
    if (verifiedRef.current === txHash) return;
    if (!token) {
      setVerifyState("error");
      setVerifyError(
        "Deposit confirmed on-chain, but you are signed out. Sign in to credit it.",
      );
      return;
    }
    verifiedRef.current = txHash;
    setVerifyState("pending");
    setVerifyError(null);
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ?? "";
    const sponsorWalletAddress =
      sponsor || dashboard?.sponsorAddress || adminWallet;
    api
      .verifyDeposit(
        { txHash, amount: amountUsdt, sponsorWalletAddress },
        token,
      )
      .then(() => {
        setVerifyState("done");
        void refetchDashboard();
      })
      .catch((e: unknown) => {
        setVerifyState("error");
        setVerifyError(
          e instanceof Error ? e.message : "Backend verification failed.",
        );
      });
  }, [
    d.lastDepositTxHash,
    amountUsdt,
    token,
    refetchDashboard,
    sponsor,
    dashboard?.sponsorAddress,
  ]);

  const handleApprove = async () => {
    setLastAction("approve");
    setSuccess(false);
    await d.handleApprove();
  };

  const handleDeposit = async () => {
    setLastAction("deposit");
    setSuccess(false);
    await d.handleDeposit();
  };

  const balanceFmt =
    d.balance !== undefined && d.decimals !== undefined
      ? Number(formatUnits(d.balance, d.decimals))
      : 0;

  const matched = activeTier(amountUsdt);

  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(dashboard.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/45">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
            Deposit
          </h1>
        </div>
        <Link href="/dashboard" className={hudButtonClass("ghost")}>
          Back to overview
        </Link>
      </div>

      <HudPanel
        title="Address to Register"
        subtitle="Funds are credited to this wallet"
      >
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="break-all font-mono text-sm text-white/85">
            {address ?? "Connect your wallet"}
          </p>
        </div>
      </HudPanel>

      <HudPanel title="Enter Amount" subtitle="USDT (BEP-20) · BNB Smart Chain">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0.0"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder:text-white/30 focus:outline-none"
          />
          <span className="text-sm text-white/55">
            ${(amountUsdt ?? 0).toFixed(2)} USD
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {balanceFmt.toFixed(3)} USDT
            </p>
            <p className="text-xs text-white/55">${balanceFmt.toFixed(3)} USD</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-purple-500/15 text-purple-300">
            ⛁
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TIERS.map((t) => {
            const isActive = matched?.name === t.name;
            const range = fmtRange(t);
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => setAmountInput(String(t.suggested))}
                className={`rounded-xl border px-4 py-4 text-center transition ${
                  isActive
                    ? "border-purple-400/50 bg-purple-500/10 shadow-[0_0_24px_-12px_rgba(168,85,247,0.6)]"
                    : "border-white/10 bg-white/[0.02] hover:border-purple-400/30 hover:bg-white/[0.05]"
                }`}
              >
                <p className="text-lg font-semibold text-blue-300">{t.name}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
                    Min
                  </span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    Max
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-white/65">
                  <span>{range.min}</span>
                  <span>{range.max}</span>
                </div>
                <p className="mt-3 inline-block rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                  {t.rate}
                </p>
              </button>
            );
          })}
        </div>
      </HudPanel>

      <HudPanel
        title={sponsor ? "Referrer" : "Referrer Not Selected"}
        subtitle="Earnings credit your sponsor's overrides"
      >
        {sponsor ? (
          <p className="break-all font-mono text-sm text-white/85">
            {sponsor}
          </p>
        ) : (
          <p className="text-sm text-white/65">
            No sponsor wallet set. You can add one to credit referral overrides.
          </p>
        )}

        {sponsorEdit ? (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="0x sponsor address"
              value={sponsorDraft}
              onChange={(e) => setSponsorDraft(e.target.value.trim())}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 focus:border-purple-400/40 focus:outline-none"
            />
            {sponsorDraft && !sponsorDraftValid ? (
              <p className="text-xs text-red-300">Not a valid address.</p>
            ) : null}
            <div className="flex gap-2">
              <HudButton
                disabled={!sponsorDraftValid || sponsorDraft.length === 0}
                onClick={handleSponsorSave}
              >
                Save
              </HudButton>
              <HudButton
                variant="ghost"
                onClick={() => {
                  setSponsorEdit(false);
                  setSponsorDraft("");
                }}
              >
                Cancel
              </HudButton>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <HudButton
              variant="danger"
              disabled={!sponsor}
              onClick={handleSponsorClear}
            >
              Clear
            </HudButton>
            <HudButton
              onClick={() => {
                setSponsorDraft(sponsor);
                setSponsorEdit(true);
              }}
            >
              Change
            </HudButton>
          </div>
        )}
      </HudPanel>

      <HudPanel title="Confirm deposit" subtitle="Approve, then deposit">
        {!depositEnv ? (
          <p className="text-sm text-white/65">
            Set{" "}
            <code className="text-purple-300">NEXT_PUBLIC_DEPOSIT_CONTRACT</code>{" "}
            in <code className="text-purple-300">.env.local</code> to enable
            on-chain actions.
          </p>
        ) : !depositAddress ? (
          <p className="text-sm text-red-300">
            <code className="text-purple-300">
              NEXT_PUBLIC_DEPOSIT_CONTRACT
            </code>{" "}
            is not a valid address.
          </p>
        ) : !isConnected ? (
          <p className="text-sm text-white/65">Connect your wallet to deposit.</p>
        ) : !d.isCorrectChain ? (
          <HudButton
            variant="danger"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: bsc.id })}
          >
            {isSwitching ? "Switching…" : "Switch to BSC"}
          </HudButton>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <HudButton
                disabled={d.approveDisabled}
                onClick={() => void handleApprove()}
              >
                {d.isBusy && lastAction === "approve"
                  ? d.statusText || "Approving…"
                  : d.hasEnoughAllowance
                    ? "Approved"
                    : "Approve USDT"}
              </HudButton>
              <HudButton
                disabled={d.depositDisabled}
                onClick={() => void handleDeposit()}
              >
                {d.isBusy && lastAction === "deposit"
                  ? d.statusText || "Depositing…"
                  : `Deposit ${amountUsdt ?? 0} USDT`}
              </HudButton>
            </div>

            {!d.hasEnoughBalance && amountUsdt != null ? (
              <p className="mt-3 text-xs text-amber-300">
                Insufficient USDT balance for this amount.
              </p>
            ) : null}

            {d.error ? (
              <p className="mt-3 text-xs text-red-300">{d.error}</p>
            ) : null}

            {success && verifyState === "pending" ? (
              <p className="mt-3 text-xs text-white/65">
                On-chain deposit confirmed — verifying with backend…
              </p>
            ) : null}
            {verifyState === "done" ? (
              <p className="mt-3 text-xs text-emerald-300">
                Deposit verified. Your dashboard will refresh shortly.
              </p>
            ) : null}
            {verifyState === "error" && verifyError ? (
              <p className="mt-3 text-xs text-red-300">{verifyError}</p>
            ) : null}
          </>
        )}
      </HudPanel>

      <HudPanel
        title="Your referral link"
        subtitle="Share to earn referral overrides"
        accent="magenta"
      >
        <p className="mb-2 break-all font-mono text-xs text-purple-300">
          {dashboard.referralLink || "—"}
        </p>
        <HudButton disabled={!dashboard.referralLink} onClick={copyLink}>
          {copied ? "Copied" : "Copy invite link"}
        </HudButton>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/55">
          <div>
            <dt className="text-white/45">Referral ID</dt>
            <dd className="font-mono text-white/85">
              {dashboard.referralId || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-white/45">Your wallet</dt>
            <dd className="truncate font-mono text-white/85">
              {address ? shortAddress(address) : "—"}
            </dd>
          </div>
        </dl>
      </HudPanel>
    </div>
  );
}
