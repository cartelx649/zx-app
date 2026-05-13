"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatUnits } from "viem";
import { useSwitchChain } from "wagmi";
import { bsc } from "wagmi/chains";
import { HudButton } from "@/components/hud/HudButton";
import { useUsdtDeposit } from "@/hooks/useUsdtDeposit";
import { useAuth, readStoredSponsor } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import type { PackageTier } from "@/lib/types/dashboard";

type Props = {
  depositAddress: `0x${string}`;
  selectedPackage: PackageTier;
  onClose: () => void;
};

type StepState = "done" | "active" | "locked";
type ActionKind = "approve" | "deposit" | null;

function StepRow({
  state,
  index,
  title,
  hint,
  action,
}: {
  state: StepState;
  index: number;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  const dotClass =
    state === "done"
      ? "bg-purple-500/20 text-purple-200 border-purple-400/40"
      : state === "active"
        ? "bg-amber-400/15 text-amber-300 border-amber-400/40"
        : "bg-white/5 text-white/45 border-white/10";
  const labelClass = state === "locked" ? "text-white/50" : "text-white";
  return (
    <div className="flex gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${dotClass}`}
      >
        {state === "done" ? "✓" : index}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${labelClass}`}>{title}</p>
        {hint ? <div className="mt-1 text-xs text-white/55">{hint}</div> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function DepositModal({
  depositAddress,
  selectedPackage,
  onClose,
}: Props) {
  const d = useUsdtDeposit(depositAddress, selectedPackage);
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { token } = useAuth();
  const { data: dashboard } = useDashboard();

  const [mounted, setMounted] = useState(false);
  const [lastAction, setLastAction] = useState<ActionKind>(null);
  const [success, setSuccess] = useState(false);
  const [verifyState, setVerifyState] = useState<
    "idle" | "pending" | "done" | "error"
  >("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const verifiedRef = useRef<string | null>(null);
  const wasBusy = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (success) return;
    if (
      wasBusy.current &&
      !d.isBusy &&
      lastAction === "deposit" &&
      !d.error
    ) {
      setSuccess(true);
      wasBusy.current = d.isBusy;
      return;
    }
    wasBusy.current = d.isBusy;
  }, [d.isBusy, d.error, lastAction, success]);

  // Post the confirmed on-chain tx to the backend for verification.
  useEffect(() => {
    const txHash = d.lastDepositTxHash;
    if (!txHash) return;
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
      readStoredSponsor() || dashboard?.sponsorAddress || adminWallet;
    api
      .verifyDeposit(
        { txHash, amount: selectedPackage, sponsorWalletAddress },
        token,
      )
      .then(() => {
        setVerifyState("done");
        const t = setTimeout(() => onClose(), 2000);
        return () => clearTimeout(t);
      })
      .catch((e: unknown) => {
        setVerifyState("error");
        setVerifyError(
          e instanceof Error ? e.message : "Backend verification failed.",
        );
      });
  }, [
    d.lastDepositTxHash,
    onClose,
    selectedPackage,
    token,
    dashboard?.sponsorAddress,
  ]);

  const handleApprove = async () => {
    setLastAction("approve");
    await d.handleApprove();
  };
  const handleDeposit = async () => {
    setLastAction("deposit");
    await d.handleDeposit();
  };

  const walletState: StepState = d.isConnected ? "done" : "active";
  const networkState: StepState = !d.isConnected
    ? "locked"
    : d.isCorrectChain
      ? "done"
      : "active";
  const approveState: StepState =
    !d.isConnected || !d.isCorrectChain
      ? "locked"
      : d.hasEnoughAllowance
        ? "done"
        : "active";
  const depositState: StepState = success
    ? "done"
    : !d.hasEnoughAllowance
      ? "locked"
      : "active";

  const fmt = (v?: bigint) =>
    v !== undefined && d.decimals !== undefined ? formatUnits(v, d.decimals) : "—";

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b14]/95 shadow-[0_24px_60px_-12px_rgba(124,58,237,0.45)] backdrop-blur-2xl animate-panel-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-purple-600/25 blur-3xl"
        />
        <header className="relative flex items-start justify-between gap-2 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Deposit {selectedPackage} USDT
            </h2>
            <p className="mt-0.5 text-xs text-white/55">
              USDT (BEP-20) · BNB Smart Chain
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/65 transition hover:border-purple-400/30 hover:text-white"
          >
            ✕
          </button>
        </header>

        <div className="relative space-y-4 px-5 py-5">
          {success ? (
            <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4 text-sm text-white/85">
              <p className="font-medium text-purple-200">
                Deposit confirmed on-chain
              </p>
              {verifyState === "pending" ? (
                <p className="mt-1 text-xs text-white/55">
                  Verifying with backend…
                </p>
              ) : verifyState === "done" ? (
                <p className="mt-1 text-xs text-white/55">
                  Credited. Closing this dialog…
                </p>
              ) : verifyState === "error" ? (
                <p className="mt-1 break-words text-xs text-red-300">
                  {verifyError ?? "Verification failed."}
                </p>
              ) : (
                <p className="mt-1 text-xs text-white/55">
                  Waiting for confirmation…
                </p>
              )}
              {d.lastDepositTxHash ? (
                <p className="mt-2 break-all font-mono text-[10px] text-white/55">
                  tx: {d.lastDepositTxHash}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <StepRow
                state={walletState}
                index={1}
                title="Wallet"
                hint={
                  d.isConnected
                    ? "Connected"
                    : "Connect your wallet using the bar at the top of the page."
                }
              />
              <StepRow
                state={networkState}
                index={2}
                title="Network"
                hint={
                  !d.isConnected
                    ? "Connect first."
                    : d.isCorrectChain
                      ? "BNB Smart Chain"
                      : "Switch your wallet to BNB Smart Chain."
                }
                action={
                  d.isConnected && !d.isCorrectChain ? (
                    <HudButton
                      variant="danger"
                      disabled={isSwitching}
                      onClick={() => switchChain({ chainId: bsc.id })}
                    >
                      {isSwitching ? "Switching…" : "Switch to BSC"}
                    </HudButton>
                  ) : null
                }
              />
              <StepRow
                state={approveState}
                index={3}
                title="Approve USDT"
                hint={
                  d.isConnected && d.isCorrectChain ? (
                    <>
                      Balance:{" "}
                      <span className="font-medium text-white/85">
                        {fmt(d.balance)}
                      </span>{" "}
                      USDT {" · "} Allowance:{" "}
                      <span className="font-medium text-white/85">
                        {fmt(d.allowance)}
                      </span>{" "}
                      USDT
                    </>
                  ) : null
                }
                action={
                  approveState === "active" ? (
                    <HudButton
                      disabled={d.approveDisabled}
                      onClick={() => void handleApprove()}
                    >
                      Approve {selectedPackage} USDT
                    </HudButton>
                  ) : null
                }
              />
              <StepRow
                state={depositState}
                index={4}
                title="Deposit"
                hint={
                  depositState === "locked"
                    ? "Approve the amount first."
                    : !d.hasEnoughBalance
                      ? "Not enough USDT in your wallet."
                      : null
                }
                action={
                  depositState === "active" ? (
                    <HudButton
                      disabled={d.depositDisabled}
                      onClick={() => void handleDeposit()}
                    >
                      Deposit {selectedPackage} USDT
                    </HudButton>
                  ) : null
                }
              />
            </>
          )}

          {d.statusText ? (
            <p className="text-xs text-purple-300">{d.statusText}</p>
          ) : null}
          {d.error ? (
            <p className="break-words text-xs text-red-300">{d.error}</p>
          ) : null}
        </div>

        <footer className="relative border-t border-white/10 px-5 py-3 text-right">
          <HudButton variant="ghost" onClick={onClose}>
            Close
          </HudButton>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
