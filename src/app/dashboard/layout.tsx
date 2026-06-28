"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { WalletBar } from "@/components/hud/WalletBar";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useCurrentUser();

  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/withdrawals", label: "Withdrawals" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  useEffect(() => {
    if (!isConnected || !isAuthenticated) router.replace("/");
  }, [isConnected, isAuthenticated, router]);

  if (!isConnected || !isAuthenticated) return null;

  return (
    <div className="relative min-h-screen overflow-hidden pb-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-purple-600/25 blur-3xl animate-float-orb"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/2 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/15 blur-3xl animate-float-orb"
        style={{ animationDelay: "-6s" }}
      />

      <div className="relative">
        <WalletBar />
        <nav className="border-b border-white/5 bg-white/[0.02] px-4 py-2 backdrop-blur-xl">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block rounded-full border border-transparent px-4 py-1.5 text-sm font-medium text-white/65 transition hover:border-purple-400/30 hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </div>
    </div>
  );
}
