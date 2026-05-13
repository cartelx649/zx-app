import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: "cyan" | "magenta" | "amber";
  className?: string;
};

const accentBorder: Record<NonNullable<Props["accent"]>, string> = {
  cyan: "border-purple-500/25",
  magenta: "border-fuchsia-500/25",
  amber: "border-amber-400/30",
};

export function HudPanel({
  title,
  subtitle,
  children,
  accent = "cyan",
  className = "",
}: Props) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-white/[0.03] p-6 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(124,58,237,0.25)] animate-panel-in ${accentBorder[accent]} ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <h2 className="font-display text-base font-semibold tracking-wide text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-white/55">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <div className="text-white/80">{children}</div>
    </section>
  );
}
