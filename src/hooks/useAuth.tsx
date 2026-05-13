"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAccount, useConnectorClient, useSignMessage } from "wagmi";
import { isAddress } from "viem";
import { api, extractToken, NONCE_MESSAGE_PREFIX } from "@/lib/api";

const TOKEN_STORAGE_KEY = "zx.auth.token";
const TOKEN_ADDRESS_KEY = "zx.auth.address";
export const SPONSOR_STORAGE_KEY = "zx.sponsorWalletAddress";

export type SignInStatus =
  | "idle"
  | "preparing"
  | "awaitingSignature"
  | "verifying";

type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  signInStatus: SignInStatus;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  clearTokenForReauth: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function readSponsorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get("sponsor") ?? params.get("ref");
  if (candidate && isAddress(candidate)) return candidate;
  return null;
}

export function readStoredSponsor(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SPONSOR_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function persistSponsor(value: string) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(SPONSOR_STORAGE_KEY, value);
  } catch {
    // storage unavailable — non-fatal
  }
}

export function clearStoredSponsor() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SPONSOR_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function readStoredToken(address: string | undefined): string | null {
  if (typeof window === "undefined" || !address) return null;
  try {
    const storedAddr = window.localStorage.getItem(TOKEN_ADDRESS_KEY);
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken && storedAddr?.toLowerCase() === address.toLowerCase()) {
      return storedToken;
    }
  } catch {
    // ignore
  }
  return null;
}

function persistToken(address: string, token: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.localStorage.setItem(TOKEN_ADDRESS_KEY, address);
  } catch {
    // ignore
  }
}

function clearStoredToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_ADDRESS_KEY);
  } catch {
    // ignore
  }
}

function isConnectorNotConnectedError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return /connector\s+not\s+connected/i.test(msg);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const CONNECTOR_RETRY_BACKOFF_MS = [150, 400, 900, 1800] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, status } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { data: connectorClient } = useConnectorClient({
    query: { enabled: status === "connected" && Boolean(address) },
  });

  const [token, setToken] = useState<string | null>(null);
  const [signInStatus, setSignInStatus] = useState<SignInStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const autoAttemptedForAddress = useRef<string | null>(null);
  const isAuthenticating = signInStatus !== "idle";

  // Capture sponsor address from URL (?sponsor=0x... or ?ref=0x...) once per mount.
  useEffect(() => {
    const fromUrl = readSponsorFromUrl();
    if (fromUrl) persistSponsor(fromUrl);
  }, []);

  // Pre-warm the backend so the first nonce request after wallet connect
  // doesn't hit a 20–30s Render cold start (which makes the wallet popup
  // appear to never come).
  useEffect(() => {
    void api.health().catch(() => {});
  }, []);

  // Rehydrate token when the connected address changes; clear if mismatch/disconnect.
  useEffect(() => {
    if (!isConnected || !address) {
      setToken(null);
      autoAttemptedForAddress.current = null;
      return;
    }
    const stored = readStoredToken(address);
    setToken(stored);
  }, [address, isConnected]);

  const signIn = useCallback(async () => {
    if (!address || !isConnected) {
      setError("Connect a wallet before signing in.");
      return;
    }
    if (status !== "connected" || !connectorClient) {
      setError("Wallet not ready — try again in a moment.");
      return;
    }
    autoAttemptedForAddress.current = address;
    setSignInStatus("preparing");
    setError(null);
    try {
      const { nonce } = await api.requestNonce(address);
      const message = `${NONCE_MESSAGE_PREFIX}${nonce}`;
      setSignInStatus("awaitingSignature");

      // wagmi can intermittently throw "Connector not connected" right after
      // the AppKit modal closes / on page reload while the underlying
      // provider finishes hydrating. Retry with exponential backoff before
      // surfacing the error to the user.
      let signature: `0x${string}` | undefined;
      let lastErr: unknown;
      for (let i = 0; i <= CONNECTOR_RETRY_BACKOFF_MS.length; i++) {
        try {
          signature = await signMessageAsync({ message });
          break;
        } catch (e) {
          lastErr = e;
          if (!isConnectorNotConnectedError(e)) throw e;
          if (i === CONNECTOR_RETRY_BACKOFF_MS.length) throw e;
          await sleep(CONNECTOR_RETRY_BACKOFF_MS[i]);
        }
      }
      if (!signature) {
        throw lastErr instanceof Error
          ? lastErr
          : new Error("Wallet not ready to sign.");
      }

      const sponsor = readStoredSponsor();
      setSignInStatus("verifying");
      const resp = await api.login({
        walletAddress: address,
        signature,
        sponsorWalletAddress: sponsor || "",
      });
      const jwt = extractToken(resp);
      if (!jwt) {
        throw new Error("Login succeeded but no token was returned.");
      }
      persistToken(address, jwt);
      setToken(jwt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-in failed";
      // If we exhausted retries on a connector race, let the auto-signIn
      // effect refire as soon as the connector client lands instead of
      // wedging the UI on an "error" state.
      if (isConnectorNotConnectedError(e)) {
        autoAttemptedForAddress.current = null;
      } else {
        setError(msg);
      }
    } finally {
      setSignInStatus("idle");
    }
  }, [address, isConnected, status, connectorClient, signMessageAsync]);

  const signOut = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setError(null);
    autoAttemptedForAddress.current = null;
  }, []);

  // Drop a stale/rejected token and re-arm the auto-signIn effect so it
  // refires for the currently connected address.
  const clearTokenForReauth = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setError(null);
    autoAttemptedForAddress.current = null;
  }, []);

  // Auto-trigger sign-in once per address when wallet is connected and no token exists.
  // Gate on BOTH status === "connected" AND a hydrated connectorClient so we
  // don't call signMessageAsync before the underlying provider is ready
  // (which throws "Connector not connected" from @wagmi/core).
  useEffect(() => {
    if (status !== "connected") return;
    if (!connectorClient) return;
    if (!isConnected || !address) return;
    if (token) return;
    if (signInStatus !== "idle") return;
    if (error) return;
    if (autoAttemptedForAddress.current === address) return;
    void signIn();
  }, [
    address,
    isConnected,
    status,
    connectorClient,
    token,
    signInStatus,
    error,
    signIn,
  ]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isAuthenticating,
      signInStatus,
      error,
      signIn,
      signOut,
      clearTokenForReauth,
    }),
    [
      token,
      isAuthenticating,
      signInStatus,
      error,
      signIn,
      signOut,
      clearTokenForReauth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
