"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const SOFT_REFRESH_MS = 5_000;
const HARD_RELOAD_THROTTLE_MS = 15_000;
const LAST_HARD_RELOAD_KEY = "zx.trustwallet.lastHardReloadAt";

function isTrustWalletBrowser() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const ethereum = window.ethereum as { isTrust?: boolean } | undefined;
  return /trust/i.test(ua) || Boolean(ethereum?.isTrust);
}

function shouldHardReload() {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(window.sessionStorage.getItem(LAST_HARD_RELOAD_KEY) ?? "0");
    const now = Date.now();
    if (now - last < HARD_RELOAD_THROTTLE_MS) return false;
    window.sessionStorage.setItem(LAST_HARD_RELOAD_KEY, String(now));
    return true;
  } catch {
    return true;
  }
}

export function TrustWalletRecovery() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isTrustWalletBrowser()) return;

    const softRefresh = () => {
      router.refresh();
      void queryClient.invalidateQueries();
    };

    const hardReload = () => {
      if (!shouldHardReload()) return;
      window.location.reload();
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      softRefresh();
    }, SOFT_REFRESH_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      softRefresh();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        hardReload();
        return;
      }
      softRefresh();
    };

    const onOnline = () => {
      hardReload();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [queryClient, router]);

  return null;
}
