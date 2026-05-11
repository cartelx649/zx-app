import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const bscRpc =
  process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://bsc-dataseed.binance.org";
const bscTestnetRpc =
  process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL ??
  "https://data-seed-prebsc-1-s1.binance.org:8545";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const connectors = [
  injected(),
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: "Zx",
            description: "Zx network growth on BNB Smart Chain",
            url:
              typeof window !== "undefined"
                ? window.location.origin
                : "https://zx.local",
            icons: [],
          },
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet],
  connectors,
  transports: {
    [bsc.id]: http(bscRpc),
    [bscTestnet.id]: http(bscTestnetRpc),
  },
  ssr: true,
});
