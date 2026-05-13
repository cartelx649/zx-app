"use client";

import { createAppKit } from "@reown/appkit/react";
import { networks, projectId, wagmiAdapter } from "@/lib/wagmi";

const metadata = {
  name: "Cronix",
  description: "Cronix network growth on BNB Smart Chain",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://cronix.local",
  icons: [],
};

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#2563eb",
    "--w3m-font-family": "Barlow, system-ui, sans-serif",
    "--w3m-border-radius-master": "4px",
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});
