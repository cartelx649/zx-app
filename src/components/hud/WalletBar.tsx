"use client";

import { useMemo } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  type Connector,
} from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { HudButton } from "@/components/hud/HudButton";

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function connectorLabel(c: Connector): string {
  // EIP-6963 auto-discovered wallets carry their own name (e.g., "MetaMask",
  // "Trust Wallet"). The generic injected fallback comes through as "Injected".
  if (c.name && c.name !== "Injected") return c.name;
  if (c.id === "walletConnect") return "WalletConnect";
  if (c.id === "metaMaskSDK" || c.id === "metaMask") return "MetaMask";
  if (c.type === "injected") return "Browser wallet";
  return c.name || c.id;
}

export function WalletBar() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isBsc = chainId === bsc.id || chainId === bscTestnet.id;

  // Dedupe: if EIP-6963 already surfaced MetaMask as its own connector, hide
  // the generic "Injected" entry so users don't see two near-identical buttons.
  const visibleConnectors = useMemo(() => {
    const hasNamedMetaMask = connectors.some(
      (c) => c.name?.toLowerCase().includes("metamask") && c.id !== "injected",
    );
    return connectors.filter((c) => {
      if (hasNamedMetaMask && c.id === "injected") return false;
      return true;
    });
  }, [connectors]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hud-stroke bg-hud-base px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="font-display text-sm font-semibold text-foreground">
          Zx
        </span>
        <span className="hidden h-4 w-px bg-hud-stroke sm:block" />
        <span className="text-xs text-hud-dim">
          BNB Smart Chain · USDT (BEP-20)
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isConnected && address ? (
          <>
            <span className="rounded-md border border-hud-stroke bg-slate-50 px-2 py-1 font-mono text-xs text-foreground">
              {shortAddress(address)}
            </span>
            <span className="text-xs text-hud-dim">
              Chain {chainId}
            </span>
            {!isBsc ? (
              <HudButton
                variant="danger"
                disabled={isSwitching}
                onClick={() => switchChain({ chainId: bsc.id })}
              >
                {isSwitching ? "Switching…" : "Switch to BSC"}
              </HudButton>
            ) : null}
            <HudButton variant="ghost" onClick={() => disconnect()}>
              Disconnect
            </HudButton>
          </>
        ) : visibleConnectors.length > 0 ? (
          visibleConnectors.map((c) => {
            const isThisPending =
              isPending && variables?.connector === c;
            return (
              <HudButton
                key={c.uid}
                disabled={isPending}
                onClick={() => connect({ connector: c })}
              >
                {isThisPending ? "Connecting…" : connectorLabel(c)}
              </HudButton>
            );
          })
        ) : (
          <span className="text-xs text-hud-dim">
            No wallet detected. Install MetaMask to continue.
          </span>
        )}
      </div>
    </div>
  );
}
