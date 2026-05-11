"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatUnits } from "viem";
import { useSwitchChain } from "wagmi";
import { bsc } from "wagmi/chains";
import { HudButton } from "@/components/hud/HudButton";
import { useUsdtDeposit } from "@/hooks/useUsdtDeposit";
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
      ? "bg-hud-cyan/15 text-hud-cyan border-hud-cyan/30"
      : state === "active"
        ? "bg-hud-amber/15 text-hud-amber border-hud-amber/30"
        : "bg-slate-50 text-hud-dim border-hud-stroke";
  const labelClass = state === "locked" ? "text-hud-dim" : "text-foreground";
  return (
    <div className="flex gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${dotClass}`}
      >
        {state === "done" ? "✓" : index}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${labelClass}`}>{title}</p>
        {hint ? <div className="mt-1 text-xs text-hud-dim">{hint}</div> : null}
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

  const [mounted, setMounted] = useState(false);
  const [lastAction, setLastAction] = useState<ActionKind>(null);
  const [success, setSuccess] = useState(false);
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
      const t = setTimeout(() => onClose(), 2500);
      return () => clearTimeout(t);
    }
    wasBusy.current = d.isBusy;
  }, [d.isBusy, d.error, lastAction, onClose, success]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-hud-cyan/20 bg-hud-panel shadow-sm animate-panel-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 border-b border-hud-stroke px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Deposit {selectedPackage} USDT
            </h2>
            <p className="mt-0.5 text-xs text-hud-dim">
              USDT (BEP-20) · BNB Smart Chain
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md border border-hud-stroke px-2 py-1 text-xs text-hud-dim hover:text-foreground"
          >
            ✕
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          {success ? (
            <div className="rounded-md border border-hud-cyan/30 bg-blue-50 p-4 text-sm text-foreground">
              <p className="font-medium text-hud-cyan">Deposit confirmed</p>
              <p className="mt-1 text-xs text-hud-dim">
                Closing this dialog…
              </p>
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
                      <span className="font-medium text-foreground">
                        {fmt(d.balance)}
                      </span>{" "}
                      USDT {" · "} Allowance:{" "}
                      <span className="font-medium text-foreground">
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
            <p className="text-xs text-hud-cyan">{d.statusText}</p>
          ) : null}
          {d.error ? (
            <p className="text-xs text-hud-danger break-words">{d.error}</p>
          ) : null}
        </div>

        <footer className="border-t border-hud-stroke px-5 py-3 text-right">
          <HudButton variant="ghost" onClick={onClose}>
            Close
          </HudButton>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
