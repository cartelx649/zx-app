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

let initialized = false;
let appKitInstance: ReturnType<typeof createAppKit> | null = null;

export function ensureAppKit() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!projectId) return;

  appKitInstance = createAppKit({
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

  initialized = true;
}

export const appKit = {
  async open() {
    ensureAppKit();
    if (!appKitInstance) {
      throw new Error("Wallet modal is not configured.");
    }
    return appKitInstance.open();
  },
};
