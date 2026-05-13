"use client";

import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { useAppKit } from "@reown/appkit/react";
import { HudButton } from "@/components/hud/HudButton";
import { useAuth } from "@/hooks/useAuth";

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletBar() {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { open } = useAppKit();
  const { signOut } = useAuth();

  const isBsc = chainId === bsc.id || chainId === bscTestnet.id;

  const handleDisconnect = () => {
    disconnect();
    signOut();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="font-display text-sm font-semibold tracking-wide text-white">
          Cronix
        </span>
        <span className="hidden h-4 w-px bg-white/10 sm:block" />
        <span className="text-xs text-white/50">
          BNB Smart Chain · USDT (BEP-20)
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isConnected && address ? (
          <>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/85">
              {shortAddress(address)}
            </span>
            <span className="text-xs text-white/50">Chain {chainId}</span>
            {!isBsc ? (
              <HudButton
                variant="danger"
                disabled={isSwitching}
                onClick={() => switchChain({ chainId: bsc.id })}
              >
                {isSwitching ? "Switching…" : "Switch to BSC"}
              </HudButton>
            ) : null}
            <HudButton variant="ghost" onClick={handleDisconnect}>
              Disconnect
            </HudButton>
          </>
        ) : (
          <HudButton onClick={() => void open()}>Connect Wallet</HudButton>
        )}
      </div>
    </div>
  );
}
