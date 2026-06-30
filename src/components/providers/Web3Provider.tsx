"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { ensureAppKit } from "@/lib/appkit";
import { AuthProvider } from "@/hooks/useAuth";
import { TrustWalletRecovery } from "@/components/providers/TrustWalletRecovery";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    ensureAppKit();
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
        <TrustWalletRecovery />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
