import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: "green" | "cyan" | "purple" | "amber";
  className?: string;
};

const accentBorder: Record<NonNullable<Props["accent"]>, string> = {
  green:  "border-green-400/20",
  cyan:   "border-cyan-400/20",
  purple: "border-purple-400/20",
  amber:  "border-amber-400/25",
};

const accentTitle: Record<NonNullable<Props["accent"]>, string> = {
  green:  "text-green-400",
  cyan:   "text-cyan-400",
  purple: "text-purple-400",
  amber:  "text-amber-400",
};

export function HudPanel({
  title,
  subtitle,
  children,
  accent = "green",
  className = "",
}: Props) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-white/[0.025] p-6 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] animate-panel-in ${accentBorder[accent]} ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-white/8 pb-3">
        <div>
          <h2 className={`font-display text-sm font-bold tracking-wide ${accentTitle[accent]}`}>
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-white/45">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <div className="text-white/75">{children}</div>
    </section>
  );
}
