"use client";

import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { HudButton } from "@/components/hud/HudButton";
import { useAuth } from "@/hooks/useAuth";
import { appKit } from "@/lib/appkit";
import Image from "next/image";

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletBar() {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { signOut } = useAuth();

  const isBsc = chainId === bsc.id || chainId === bscTestnet.id;

  const handleDisconnect = () => {
    disconnect();
    signOut();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 bg-[#0b0d10]/90 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="grid h-6 w-6 place-items-center overflow-hidden rounded bg-green-400/10 ring-1 ring-green-400/20">
          <Image
            src="https://cronix-dashboard.vercel.app/projectIcon.svg"
            alt="Cronix"
            width={14}
            height={14}
            className="h-3.5 w-3.5 object-contain"
          />
        </span>
        <span className="font-display text-xs font-bold tracking-widest text-white/80">
          CRONIX
        </span>
        <span className="hidden h-3.5 w-px bg-white/10 sm:block" />
        <span className="hidden text-xs text-white/35 sm:block">
          BNB Smart Chain · USDT BEP-20
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isConnected && address ? (
          <>
            <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 font-mono text-xs text-white/70">
              {shortAddress(address)}
            </span>
            {!isBsc ? (
              <HudButton
                variant="danger"
                disabled={isSwitching}
                onClick={() => switchChain({ chainId: bsc.id })}
              >
                {isSwitching ? "Switching…" : "Switch to BSC"}
              </HudButton>
            ) : (
              <span className="hidden items-center gap-1.5 text-xs text-green-400/70 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                BSC
              </span>
            )}
            <HudButton variant="ghost" onClick={handleDisconnect}>
              Disconnect
            </HudButton>
          </>
        ) : (
          <HudButton onClick={() => void appKit.open()}>Connect Wallet</HudButton>
        )}
      </div>
    </div>
  );
}
