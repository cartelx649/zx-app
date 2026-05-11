"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount, useSignMessage } from "wagmi";
import { isAddress } from "viem";
import { api, extractToken, NONCE_MESSAGE_PREFIX } from "@/lib/api";

const TOKEN_STORAGE_KEY = "zx.auth.token";
const TOKEN_ADDRESS_KEY = "zx.auth.address";
const SPONSOR_STORAGE_KEY = "zx.sponsorWalletAddress";

type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function readSponsorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get("sponsor") ?? params.get("ref");
  if (candidate && isAddress(candidate)) return candidate;
  return null;
}

function readStoredSponsor(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SPONSOR_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function persistSponsor(value: string) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(SPONSOR_STORAGE_KEY, value);
  } catch {
    // storage unavailable — non-fatal
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capture sponsor address from URL (?sponsor=0x... or ?ref=0x...) once per mount.
  useEffect(() => {
    const fromUrl = readSponsorFromUrl();
    if (fromUrl) persistSponsor(fromUrl);
  }, []);

  // Rehydrate token when the connected address changes; clear if mismatch/disconnect.
  useEffect(() => {
    if (!isConnected || !address) {
      setToken(null);
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
    setIsAuthenticating(true);
    setError(null);
    try {
      const { nonce } = await api.requestNonce(address);
      const message = `${NONCE_MESSAGE_PREFIX}${nonce}`;
      const signature = await signMessageAsync({ message });
      const sponsor = readStoredSponsor();
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
      setError(msg);
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, isConnected, signMessageAsync]);

  const signOut = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setError(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isAuthenticating,
      error,
      signIn,
      signOut,
    }),
    [token, isAuthenticating, error, signIn, signOut],
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
