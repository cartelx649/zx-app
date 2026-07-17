import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cronix — Maintenance",
  description:
    "Cronix is temporarily unavailable while scheduled maintenance is in progress.",
};

export default function RootLayout() {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[12%] top-[15%] h-72 w-72 rounded-full bg-cyan-400/10 blur-[110px]" />
            <div className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-emerald-400/10 blur-[120px]" />
          </div>

          <section className="glass hud-clip relative w-full max-w-2xl px-7 py-12 text-center sm:px-12 sm:py-16">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10">
              <span className="h-5 w-5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(103,232,249,0.8)]" />
            </div>

            <p className="font-display text-sm font-semibold tracking-[0.42em] text-cyan-300">
              CRONIX
            </p>
            <h1 className="font-display mt-5 text-3xl font-bold uppercase tracking-wide text-white sm:text-5xl">
              Under Maintenance
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
              We are performing essential system updates. The platform will be
              back online shortly.
            </p>

            <div className="mx-auto mt-9 flex max-w-md items-center justify-center gap-3 border-t border-white/10 pt-7 text-xs uppercase tracking-[0.18em] text-slate-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Your on-chain funds remain secure
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
