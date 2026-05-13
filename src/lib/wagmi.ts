import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bsc, bscTestnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

const bscRpc =
  process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org";
const bscTestnetRpc =
  process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL ??
  "https://data-seed-prebsc-1-s1.binance.org:8545";

export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

if (!projectId && typeof window !== "undefined") {
  console.warn(
    "[wagmi] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing — the Connect Wallet modal will not initialize.",
  );
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc, bscTestnet];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  customRpcUrls: {
    [`eip155:${bsc.id}`]: [{ url: bscRpc }],
    [`eip155:${bscTestnet.id}`]: [{ url: bscTestnetRpc }],
  },
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
