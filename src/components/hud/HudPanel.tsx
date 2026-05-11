import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: "cyan" | "magenta" | "amber";
  className?: string;
};

const accentBorder: Record<NonNullable<Props["accent"]>, string> = {
  cyan: "border-hud-cyan/20",
  magenta: "border-hud-magenta/20",
  amber: "border-hud-amber/25",
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
      className={`rounded-xl border bg-hud-panel p-5 shadow-sm animate-panel-in ${accentBorder[accent]} ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-hud-stroke pb-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-hud-dim">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <div>{children}</div>
    </section>
  );
}
