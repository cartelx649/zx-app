"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { appKit } from "@/lib/appkit";
import { useAuth } from "@/hooks/useAuth";

/* ── Helpers ─────────────────────────────────────────────── */

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function signInStatusLabel(status: ReturnType<typeof useAuth>["signInStatus"]) {
  if (status === "preparing") return "Waking server…";
  if (status === "awaitingSignature") return "Approve in wallet…";
  if (status === "verifying") return "Verifying…";
  return null;
}

/* ── Stars ───────────────────────────────────────────────── */

const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: Math.round(((i * 7 + 3) * 97) % 100),
  y: Math.round(((i * 13 + 7) * 83) % 100),
  size: i % 3 === 0 ? 2 : 1.5,
  dur: 3 + (i % 5) * 0.4,
  delay: (i * 0.23) % 3,
}));

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
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            boxShadow: "0 0 4px rgba(255,255,255,0.5)",
          }}
        />
      ))}
    </div>
  );
}

/* ── Glowing Orb ─────────────────────────────────────────── */

function CronixOrb() {
  return (
    <div
      aria-hidden
      className="relative h-[360px] w-[360px] sm:h-[460px] sm:w-[460px]"
      style={{ perspective: "1200px" }}
    >
      {/* pulsing outer glow rings */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)",
          animation: "glow-pulse-green 3s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-8 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 65%)",
          animation: "glow-pulse-green 3s ease-in-out 1.5s infinite",
        }}
      />

      {/* floating wrapper */}
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ animation: "float-orb 6s ease-in-out infinite" }}
      >
        <div className="absolute inset-0 grid place-items-center" style={{ transformStyle: "preserve-3d" }}>

          {/* outer tilted ring */}
          <div
            className="absolute h-[94%] w-[94%] rounded-full"
            style={{
              border: "1.5px solid rgba(74,222,128,0.35)",
              animation: "orbit-tilt 16s linear infinite",
              boxShadow: "0 0 28px rgba(74,222,128,0.3), inset 0 0 28px rgba(74,222,128,0.12)",
            }}
          />

          {/* inner counter-rotating ring */}
          <div
            className="absolute h-[78%] w-[78%] rounded-full"
            style={{
              border: "1px solid rgba(93,169,255,0.25)",
              animation: "orbit-tilt-reverse 24s linear infinite",
              boxShadow: "0 0 18px rgba(93,169,255,0.2), inset 0 0 18px rgba(93,169,255,0.08)",
            }}
          />

          {/* core sphere */}
          <div className="relative h-[54%] w-[54%]">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 26%, #bbf7d0 0%, #4ade80 18%, #16a34a 42%, #052e16 72%, #000 100%)",
                boxShadow:
                  "inset -30px -40px 70px rgba(0,0,0,0.85), 0 0 70px rgba(74,222,128,0.6), 0 0 140px rgba(74,222,128,0.25)",
                animation: "glow-pulse-green 3s ease-in-out infinite",
              }}
            />
            <div className="absolute left-[14%] top-[12%] h-[26%] w-[36%] rounded-full bg-white/30 blur-xl" />
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-green-300/70 to-transparent blur-[1px]"
                style={{ animation: "scan-line 5s ease-in-out infinite" }}
              />
            </div>
            <div
              className="absolute -inset-[3px] rounded-full"
              style={{
                border: "1px solid rgba(74,222,128,0.2)",
                boxShadow: "0 0 20px rgba(74,222,128,0.35)",
              }}
            />
          </div>

          {/* orbiting particle — ring 1 */}
          <div className="absolute h-[94%] w-[94%]" style={{ animation: "orbit-tilt 16s linear infinite" }}>
            <span
              className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-green-200"
              style={{ width: "10px", height: "10px", boxShadow: "0 0 18px 5px rgba(74,222,128,0.95)" }}
            />
          </div>

          {/* orbiting particle — ring 2 */}
          <div className="absolute h-[78%] w-[78%]" style={{ animation: "orbit-tilt-reverse 24s linear infinite" }}>
            <span
              className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full bg-cyan-200"
              style={{ width: "7px", height: "7px", boxShadow: "0 0 14px 3px rgba(93,169,255,0.95)" }}
            />
          </div>
        </div>
      </div>

      {/* bottom fade */}
      <div className="pointer-events-none absolute -inset-x-16 -bottom-6 h-20 bg-gradient-to-t from-[#0b0d10] via-[#0b0d10]/60 to-transparent" />
    </div>
  );
}

/* ── How it works ────────────────────────────────────────── */

const STEPS = [
  {
    num: "01",
    title: "Connect Wallet",
    desc: "Link your BSC wallet. If you're new, enter your sponsor's wallet address to join the network.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
      </svg>
    ),
    accent: "green",
  },
  {
    num: "02",
    title: "Deposit USDT",
    desc: "Send USDT (BEP-20) to the deposit contract on BSC. Choose any amount matching an ROI slab.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
      </svg>
    ),
    accent: "cyan",
  },
  {
    num: "03",
    title: "Earn & Grow",
    desc: "Monthly ROI posts automatically. Earn 5% direct on referrals + level override. Re-top up any time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    accent: "purple",
  },
  {
    num: "04",
    title: "Withdraw",
    desc: "Claim your income on the monthly withdrawal window. All payouts are in USDT directly to your wallet.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    accent: "amber",
  },
];

const accentConfig: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  green:  { border: "border-green-400/25", bg: "bg-green-400/10",  text: "text-green-400",  glow: "shadow-[0_0_24px_-4px_rgba(74,222,128,0.4)]" },
  cyan:   { border: "border-cyan-400/25",  bg: "bg-cyan-400/10",   text: "text-cyan-400",   glow: "shadow-[0_0_24px_-4px_rgba(93,169,255,0.4)]" },
  purple: { border: "border-purple-400/25",bg: "bg-purple-400/10", text: "text-purple-400", glow: "shadow-[0_0_24px_-4px_rgba(155,140,255,0.4)]" },
  amber:  { border: "border-amber-400/25", bg: "bg-amber-400/10",  text: "text-amber-400",  glow: "shadow-[0_0_24px_-4px_rgba(245,158,11,0.4)]" },
};

/* ── Income cards ────────────────────────────────────────── */

const INCOME_CARDS = [
  {
    accent: "green",
    icon: "📈",
    title: "Monthly ROI",
    tag: "2X Target",
    desc: "Earn monthly returns based on your deposit slab. ROI credits automatically until you reach 2X your principal.",
    note: "No manual claiming needed — auto-posted each cycle.",
  },
  {
    accent: "cyan",
    icon: "👥",
    title: "Direct Commission",
    tag: "5% Instant",
    desc: "Earn 5% on every USDT deposit made by wallets you referred. Credited the moment your referral deposits.",
    note: "Requires an active cycle to receive commission.",
  },
  {
    accent: "purple",
    icon: "🔗",
    title: "Level Override",
    tag: "Up to 5 Levels",
    desc: "Earn a percentage of your downline's ROI up to 5 levels deep. Passive income grows as your team grows.",
    note: "Percentages set by platform config — auditable on-chain.",
  },
];

/* ── Chain badges ────────────────────────────────────────── */

function ChainBadge({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.7)]" />
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/45">{sub}</p>
      </div>
    </div>
  );
}

/* ── Nav ─────────────────────────────────────────────────── */

function Nav({
  onAction,
  isConnected,
  address,
  isAuthenticating,
  buttonLabel,
}: {
  onAction: () => void;
  isConnected: boolean;
  address?: string;
  isAuthenticating: boolean;
  buttonLabel: string;
}) {
  return (
    <header className="relative z-20 px-4 pt-5">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/8 bg-[#0b0d10]/80 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-green-400/10 ring-1 ring-green-400/30">
            <Image
              src="https://cronix-dashboard.vercel.app/projectIcon.svg"
              alt="Cronix"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
          </span>
          <span className="font-display text-base font-bold tracking-widest text-white">
            CRONIX
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && address && (
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-white/70 sm:block">
              {shortAddress(address)}
            </span>
          )}
          <button
            type="button"
            onClick={onAction}
            disabled={isConnected && isAuthenticating}
            className="inline-flex items-center gap-2 rounded-full bg-green-400 px-5 py-1.5 text-sm font-semibold text-black shadow-[0_0_20px_-4px_rgba(74,222,128,0.7)] transition hover:bg-green-300 hover:shadow-[0_0_28px_-2px_rgba(74,222,128,0.9)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{buttonLabel}</span>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}

/* ── Main page ───────────────────────────────────────────── */

export default function Home() {
  const { isConnected, address } = useAccount();
  const { isAuthenticated, isAuthenticating, signInStatus, error: authError, signIn, clearTokenForReauth } = useAuth();
  const router = useRouter();
  const [notice, setNotice] = useState("");

  const statusLabel = signInStatusLabel(signInStatus);
  const buttonLabel =
    isConnected && !isAuthenticated && statusLabel
      ? statusLabel
      : isConnected && isAuthenticated
      ? "Dashboard"
      : isConnected
      ? "Sign in"
      : "Launch App";

  useEffect(() => {
    if (authError) setNotice(authError);
  }, [authError]);

  useEffect(() => {
    if (isConnected) setNotice((p) => (p.startsWith("Wallet not") ? "" : p));
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && isAuthenticated) {
      setNotice("");
      router.push("/dashboard");
    }
  }, [isConnected, isAuthenticated, router]);

  const handleAction = async () => {
    if (!isConnected) {
      setNotice("Opening wallet…");
      try { await appKit.open(); } catch { /* dismissed */ }
      return;
    }
    if (!isAuthenticated) {
      if (authError) clearTokenForReauth();
      setNotice(signInStatus === "awaitingSignature" ? "Approve signature in wallet…" : "Signing in…");
      try { await signIn(); } catch { /* surfaced via authError */ }
      return;
    }
    router.push("/dashboard");
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ backgroundColor: "#0b0d10" }}>

      {/* ── Background FX ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-10 h-[36rem] w-[36rem] rounded-full bg-green-500/8 blur-[120px]" style={{ animation: "float-orb 14s ease-in-out infinite" }} />
        <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan-500/6 blur-[100px]" style={{ animation: "float-orb 18s ease-in-out -6s infinite" }} />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      <Starfield />

      {/* ── Nav ── */}
      <Nav
        onAction={handleAction}
        isConnected={isConnected}
        address={address}
        isAuthenticating={isAuthenticating}
        buttonLabel={buttonLabel}
      />

      {notice && (
        <p className="relative z-20 mx-auto mt-2 max-w-6xl px-4 text-right text-xs text-amber-300">
          {notice}
        </p>
      )}

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-0 sm:pt-10">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-8">

          {/* Left — copy */}
          <div className="order-2 lg:order-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/8 px-4 py-1.5 text-xs font-medium text-green-300">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live on BNB Smart Chain
            </div>

            <h1 className="font-display text-4xl font-black leading-[0.9] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]"
              style={{ textShadow: "0 0 60px rgba(74,222,128,0.25), 0 0 120px rgba(74,222,128,0.1)" }}
            >
              EARN{" "}
              <span
                className="text-green-400"
                style={{ textShadow: "0 0 40px rgba(74,222,128,0.8), 0 0 80px rgba(74,222,128,0.4)" }}
              >
                2X&nbsp;ROI
              </span>
              <br />
              ON{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300">
                BSC
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/55">
              Deposit USDT, earn monthly ROI up to{" "}
              <span className="text-green-400 font-medium">2X your principal</span>,{" "}
              <span className="text-cyan-400 font-medium">5% direct commission</span>{" "}
              and <span className="text-purple-400 font-medium">level override income</span> across 5 levels.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleAction}
                disabled={isConnected && isAuthenticating}
                className="inline-flex items-center gap-3 rounded-full bg-green-400 px-8 py-4 text-base font-bold text-black shadow-[0_0_40px_-4px_rgba(74,222,128,0.65)] transition hover:bg-green-300 hover:shadow-[0_0_55px_-2px_rgba(74,222,128,0.95)] active:translate-y-px disabled:opacity-60"
              >
                {buttonLabel}
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-7 py-4 text-base font-medium text-white/70 transition hover:bg-white/10 hover:text-white hover:border-white/20"
              >
                How it works
              </a>
            </div>
          </div>

          {/* Right — Orb */}
          <div className="order-1 flex items-center justify-center lg:order-2">
            <CronixOrb />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-6xl px-4 py-20">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-green-400/60">Simple process</p>
          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            HOW IT WORKS
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/45">
            Four steps from zero to earning monthly ROI on BSC
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => {
            const a = accentConfig[step.accent];
            return (
              <div key={step.num} className="group relative rounded-2xl border border-white/8 bg-white/[0.03] p-7 transition duration-300 hover:border-white/15 hover:bg-white/[0.055] hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
                <div className={`mb-5 inline-flex items-center justify-center rounded-xl border ${a.border} ${a.bg} h-12 w-12 ${a.text} transition group-hover:scale-110 duration-300`}>
                  {step.icon}
                </div>
                <span className={`absolute right-5 top-5 font-display text-4xl font-black ${a.text} opacity-10 transition group-hover:opacity-20 duration-300`}>
                  {step.num}
                </span>
                <h3 className="mb-2 font-display text-sm font-bold tracking-wider text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/50">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Income streams ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-cyan-400/60">Multiple streams</p>
          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            INCOME STREAMS
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/45">
            Three separate income buckets — all capped at 3X your package
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {INCOME_CARDS.map((card) => {
            const a = accentConfig[card.accent];
            return (
              <div key={card.title} className={`group relative rounded-2xl border ${a.border} bg-white/[0.025] p-7 transition duration-300 hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)]`}>
                <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 ${a.bg}`} style={{ filter: "blur(40px)" }} />
                <div className="relative mb-5 flex items-center gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.bg} text-2xl transition group-hover:scale-110 duration-300`}>
                    {card.icon}
                  </span>
                  <div>
                    <p className="text-xs text-white/40">{card.tag}</p>
                    <h3 className={`font-display text-sm font-bold ${a.text}`}>{card.title}</h3>
                  </div>
                </div>
                <p className="relative text-sm leading-relaxed text-white/55">{card.desc}</p>
                <p className="relative mt-5 text-xs text-white/30 italic">{card.note}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Chain info ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-10">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.35em] text-purple-400/60">Powered by</p>
              <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
                TRANSPARENT &<br />
                <span className="text-green-400">AUDITABLE</span>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/50">
                Every deposit hits the contract on BNB Smart Chain. Treasury wallet addresses are
                public. Monthly ROI is computed server-side and credited to the income ledger —
                all visible on your dashboard.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ChainBadge label="BNB Smart Chain" sub="Mainnet" />
              <ChainBadge label="USDT BEP-20" sub="Stablecoin deposits" />
              <ChainBadge label="Treasury model" sub="Auditable on-chain" />
              <ChainBadge label="Monthly ROI" sub="Auto-credited" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-green-400/15 bg-green-400/5 px-8 py-16 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-green-400/20 blur-[80px]" style={{ animation: "glow-pulse-green 3s ease-in-out infinite" }} />
            <div className="absolute -bottom-32 left-1/4 h-48 w-48 rounded-full bg-cyan-400/10 blur-[60px]" style={{ animation: "glow-pulse-green 3s ease-in-out 1.5s infinite" }} />
          </div>
          <p className="relative mb-3 text-xs uppercase tracking-[0.35em] text-green-400/70">Get started today</p>
          <h2
            className="relative font-display text-4xl font-black tracking-tight text-white sm:text-5xl"
            style={{ textShadow: "0 0 60px rgba(74,222,128,0.3)" }}
          >
            START EARNING NOW
          </h2>
          <p className="relative mx-auto mt-5 max-w-sm text-base text-white/50">
            Connect your BSC wallet and make your first deposit to join the Cronix network.
          </p>
          <button
            type="button"
            onClick={handleAction}
            disabled={isConnected && isAuthenticating}
            className="relative mt-10 inline-flex items-center gap-3 rounded-full bg-green-400 px-10 py-4 text-base font-bold text-black shadow-[0_0_50px_-4px_rgba(74,222,128,0.7)] transition hover:bg-green-300 hover:shadow-[0_0_65px_-2px_rgba(74,222,128,1)] active:translate-y-px disabled:opacity-60"
          >
            {buttonLabel}
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center overflow-hidden rounded bg-green-400/10 ring-1 ring-green-400/20">
              <Image
                src="https://cronix-dashboard.vercel.app/projectIcon.svg"
                alt="Cronix"
                width={14}
                height={14}
                className="h-3.5 w-3.5 object-contain"
              />
            </span>
            <span className="font-display text-xs font-bold tracking-widest text-white/70">CRONIX</span>
          </div>
          <p className="text-xs text-white/30">BNB Smart Chain · USDT BEP-20 · Treasury model</p>
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Cronix. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
