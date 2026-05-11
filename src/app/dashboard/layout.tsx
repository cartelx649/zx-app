import Link from "next/link";
import { WalletBar } from "@/components/hud/WalletBar";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/withdrawals", label: "Withdrawals" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-8">
      <WalletBar />
      <nav className="border-b border-hud-stroke bg-white px-4 py-2">
        <ul className="mx-auto flex max-w-6xl flex-wrap gap-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-hud-dim hover:border-hud-cyan/20 hover:text-hud-cyan"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
