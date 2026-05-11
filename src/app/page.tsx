import Link from "next/link";
import { hudButtonClass } from "@/components/hud/HudButton";
import { HudPanel } from "@/components/hud/HudPanel";

const flowSteps = [
  { title: "Join", detail: "Create your account using a referral link." },
  { title: "Deposit", detail: "Choose a package: 100, 500, or 1000 USDT." },
  { title: "Earn", detail: "Monthly ROI runs until your 2X target is reached." },
  { title: "Network", detail: "Direct and team income are tracked automatically." },
  { title: "Cap", detail: "Total earnings stop at the 3X platform cap." },
  { title: "Restart", detail: "Re-top up with the same or higher package." },
];

export default function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-14">
      <header className="space-y-4 text-center md:text-left">
        <p className="text-sm font-medium text-hud-cyan">
          BNB Smart Chain · USDT (BEP-20)
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
          Zx
          <span className="block text-lg font-medium text-hud-dim md:text-xl">
            Simple dashboard for your ROI and team activity
          </span>
        </h1>
        <p className="max-w-2xl text-base text-hud-dim md:text-lg">
          Track deposits, ROI progress, income, and withdrawals in one clear
          place with a clean interface.
        </p>
        <div className="flex flex-wrap justify-center gap-3 md:justify-start">
          <Link href="/dashboard" className={hudButtonClass()}>
            Open dashboard
          </Link>
        </div>
      </header>

      <HudPanel
        title="How it works"
        subtitle="Clear flow from start to payout"
        accent="cyan"
      >
        <ol className="grid gap-4 md:grid-cols-2">
          {flowSteps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex gap-3 rounded-lg border border-hud-stroke bg-white p-4"
            >
              <span className="font-display text-2xl font-bold text-hud-cyan">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">
                  {step.title}
                </p>
                <p className="mt-1 text-sm text-hud-dim">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div
          className="mt-6 hidden items-center justify-between text-hud-dim md:flex"
          aria-hidden
        >
          {flowSteps.map((_, i) => (
            <span key={i} className="flex-1 text-center text-xs">
              {i < flowSteps.length - 1 ? "↓" : "●"}
            </span>
          ))}
        </div>
      </HudPanel>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-hud-stroke bg-white p-4">
          <h3 className="font-display text-sm font-semibold text-foreground">
            Treasury
          </h3>
          <p className="mt-2 text-sm text-hud-dim">
            Deposits fund deployment and liquidity operations — not parked in the
            payout wallet.
          </p>
        </div>
        <div className="rounded-xl border border-hud-stroke bg-white p-4">
          <h3 className="font-display text-sm font-semibold text-foreground">
            Payouts
          </h3>
          <p className="mt-2 text-sm text-hud-dim">
            Separate payout wallet receives monthly liquidity for user
            withdrawals on schedule.
          </p>
        </div>
        <div className="rounded-xl border border-hud-stroke bg-white p-4">
          <h3 className="font-display text-sm font-semibold text-foreground">
            Wallets
          </h3>
          <p className="mt-2 text-sm text-hud-dim">
            MetaMask and Trust Wallet supported via standard injected connectors on
            BSC.
          </p>
        </div>
      </section>
    </main>
  );
}
