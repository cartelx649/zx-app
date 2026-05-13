"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { useAuth } from "@/hooks/useAuth";

function CronixMark() {
  return (
    <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-black ring-1 ring-white/15">
      <Image
        src="https://cronix-dashboard.vercel.app/projectIcon.svg"
        alt="Cronix"
        width={24}
        height={24}
        className="h-6 w-6 object-contain"
      />
    </span>
  );
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 font-mono text-sm text-blue-200 transition hover:bg-blue-500/20"
      >
        {shortAddress(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      className="rounded-full border border-blue-500/40 bg-blue-500/15 px-4 py-1.5 text-sm font-medium text-blue-200 transition hover:bg-blue-500/25"
    >
      Connect Wallet
    </button>
  );
}

const STARS: { x: number; y: number; size: number; delay: number; dur: number }[] = [
  { x: 4, y: 8, size: 2, delay: 0.0, dur: 3.2 },
  { x: 12, y: 22, size: 1, delay: 1.4, dur: 4.0 },
  { x: 18, y: 75, size: 1.5, delay: 0.6, dur: 3.6 },
  { x: 22, y: 14, size: 1, delay: 2.1, dur: 3.4 },
  { x: 28, y: 40, size: 2, delay: 0.9, dur: 4.2 },
  { x: 33, y: 80, size: 1, delay: 1.6, dur: 3.8 },
  { x: 38, y: 18, size: 1.5, delay: 0.3, dur: 3.5 },
  { x: 42, y: 62, size: 1, delay: 2.4, dur: 4.4 },
  { x: 48, y: 12, size: 2, delay: 1.0, dur: 3.0 },
  { x: 52, y: 88, size: 1, delay: 0.7, dur: 4.1 },
  { x: 58, y: 30, size: 1.5, delay: 1.9, dur: 3.7 },
  { x: 62, y: 68, size: 1, delay: 0.4, dur: 4.3 },
  { x: 67, y: 16, size: 2, delay: 2.2, dur: 3.3 },
  { x: 72, y: 82, size: 1, delay: 1.2, dur: 3.9 },
  { x: 78, y: 28, size: 1.5, delay: 0.5, dur: 4.0 },
  { x: 82, y: 60, size: 1, delay: 1.7, dur: 3.6 },
  { x: 88, y: 10, size: 2, delay: 0.8, dur: 3.5 },
  { x: 92, y: 70, size: 1, delay: 2.0, dur: 4.2 },
  { x: 96, y: 38, size: 1.5, delay: 1.1, dur: 3.8 },
  { x: 8, y: 50, size: 1, delay: 0.2, dur: 4.5 },
  { x: 15, y: 90, size: 1.5, delay: 1.8, dur: 3.4 },
  { x: 25, y: 55, size: 1, delay: 2.3, dur: 4.1 },
  { x: 36, y: 95, size: 2, delay: 0.6, dur: 3.7 },
  { x: 46, y: 45, size: 1, delay: 1.3, dur: 3.9 },
  { x: 55, y: 5, size: 1.5, delay: 0.9, dur: 4.0 },
  { x: 65, y: 48, size: 1, delay: 2.5, dur: 3.2 },
  { x: 74, y: 6, size: 2, delay: 0.4, dur: 4.3 },
  { x: 85, y: 92, size: 1, delay: 1.5, dur: 3.6 },
  { x: 94, y: 22, size: 1.5, delay: 2.0, dur: 4.4 },
  { x: 3, y: 65, size: 1, delay: 1.0, dur: 3.5 },
];

function Starfield() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: 0.25,
            boxShadow: "0 0 4px rgba(255,255,255,0.7)",
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Planet3D() {
  return (
    <div
      aria-hidden
      className="relative h-[420px] w-[420px] sm:h-[520px] sm:w-[520px]"
      style={{ perspective: "1400px" }}
    >
      {/* outer halo */}
      <div className="absolute inset-0 rounded-full bg-fuchsia-600/30 blur-[80px]" />
      <div className="absolute inset-8 rounded-full bg-purple-500/25 blur-[60px] animate-glow-pulse" />

      {/* tilted orbital ring 1 */}
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute h-[92%] w-[92%] rounded-full border-2 border-purple-300/30"
          style={{
            animation: "orbit-tilt 18s linear infinite",
            boxShadow:
              "0 0 24px rgba(168,85,247,0.35), inset 0 0 24px rgba(168,85,247,0.18)",
          }}
        />
        {/* tilted orbital ring 2 (counter-rotating, different tilt) */}
        <div
          className="absolute h-full w-full rounded-full border border-fuchsia-300/25"
          style={{
            animation: "orbit-tilt-reverse 28s linear infinite",
            boxShadow:
              "0 0 18px rgba(232,121,249,0.3), inset 0 0 18px rgba(232,121,249,0.15)",
          }}
        />

        {/* the planet */}
        <div className="relative h-[55%] w-[55%]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 28%, #f0abfc 0%, #c026d3 18%, #7c3aed 45%, #2e1065 78%, #000 100%)",
              boxShadow:
                "inset -40px -50px 90px rgba(0,0,0,0.75), 0 0 60px rgba(168,85,247,0.55), 0 0 120px rgba(168,85,247,0.25)",
            }}
          />
          {/* sheen */}
          <div
            className="absolute left-[18%] top-[16%] h-[26%] w-[36%] rounded-full bg-white/30 blur-2xl"
            aria-hidden
          />
          {/* atmosphere ring */}
          <div className="absolute -inset-1 rounded-full border border-white/10" />
        </div>

        {/* orbital particle on ring 1 */}
        <div
          className="absolute h-[92%] w-[92%]"
          style={{ animation: "orbit-tilt 18s linear infinite" }}
        >
          <span
            className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-fuchsia-200"
            style={{
              width: "10px",
              height: "10px",
              boxShadow: "0 0 18px 4px rgba(232,121,249,0.85)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function signInStatusLabel(status: ReturnType<typeof useAuth>["signInStatus"]) {
  if (status === "preparing") return "Waking server…";
  if (status === "awaitingSignature") return "Approve in wallet";
  if (status === "verifying") return "Verifying…";
  return null;
}

export default function Home() {
  const { isConnected } = useAccount();
  const {
    isAuthenticated,
    isAuthenticating,
    signInStatus,
    error: authError,
  } = useAuth();
  const router = useRouter();
  const [connectNotice, setConnectNotice] = useState("");

  const statusLabel = signInStatusLabel(signInStatus);
  const buttonLabel =
    isConnected && !isAuthenticated && statusLabel
      ? statusLabel
      : "Go to dashboard";

  const handleDashboardClick = () => {
    if (!isConnected) {
      setConnectNotice("Please connect wallet first");
      return;
    }
    if (!isAuthenticated) {
      if (statusLabel) {
        const hint =
          signInStatus === "awaitingSignature"
            ? " — please approve the wallet prompt."
            : signInStatus === "preparing"
              ? " — backend is warming up, hold tight."
              : "…";
        setConnectNotice(`${statusLabel}${hint}`);
      } else if (authError) {
        setConnectNotice(authError);
      } else {
        setConnectNotice("Signing in…");
      }
      return;
    }
    setConnectNotice("");
    router.push("/dashboard");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* deep-space gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0) 55%), radial-gradient(ellipse at 12% 90%, rgba(232,121,249,0.18) 0%, rgba(232,121,249,0) 55%), radial-gradient(ellipse at 88% 8%, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0) 55%)",
        }}
      />

      {/* floating colored orbs — same vocabulary as the dashboard */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-24 h-[28rem] w-[28rem] rounded-full bg-purple-600/30 blur-3xl animate-float-orb"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/20 blur-3xl animate-float-orb"
        style={{ animationDelay: "-6s" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/4 bottom-0 h-[24rem] w-[24rem] rounded-full bg-indigo-600/20 blur-3xl"
        style={{ animation: "drift 14s ease-in-out infinite" }}
      />

      <Starfield />

      <header className="relative z-10 px-4 pt-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-neutral-900/70 px-4 py-2 ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <CronixMark />
            <span className="font-display text-lg font-bold tracking-tight">
              Cronix
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDashboardClick}
              disabled={isConnected && !isAuthenticated && isAuthenticating}
              className="group inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-1.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(168,85,247,0.7)] transition hover:shadow-[0_0_32px_-2px_rgba(168,85,247,0.9)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              <span>{buttonLabel}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition group-hover:translate-x-0.5"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="m13 5 7 7-7 7" />
              </svg>
            </button>
            <ConnectWalletButton />
          </div>
        </div>
        {connectNotice ? (
          <p className="mx-auto mt-3 max-w-6xl text-right text-sm text-amber-300">
            {connectNotice}
          </p>
        ) : null}
      </header>

      <section className="relative z-10 grid min-h-[calc(100vh-120px)] place-items-center px-4 py-8 sm:py-10">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-purple-300/80">
              Network growth on BNB Smart Chain
            </p>
            <h1
              className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
              style={{
                textShadow:
                  "0 0 30px rgba(168,85,247,0.45), 0 0 60px rgba(168,85,247,0.2)",
              }}
            >
              Cronix
            </h1>
            <p className="max-w-xl text-sm text-white/65 sm:text-base">
              ROI, referrals, and cycles — orbiting a treasury you can audit on
              chain.
            </p>
          </div>

          <div className="relative grid place-items-center">
            <div className="scale-[0.82] sm:scale-[0.9] md:scale-100">
              <Planet3D />
            </div>
            <div className="pointer-events-none absolute -inset-x-24 -bottom-10 h-24 bg-gradient-to-t from-black via-black/70 to-transparent" />
          </div>
        </div>
      </section>
    </main>
  );
}
