type Props = {
  label: string;
  value: string;
  hint?: string;
  variant?: "default" | "score";
};

export function HudStat({
  label,
  value,
  hint,
  variant = "default",
}: Props) {
  return (
    <div className="rounded-xl border border-hud-stroke bg-white px-4 py-3">
      <p className="text-xs font-medium text-hud-dim">
        {label}
      </p>
      <p
        className={
          variant === "score"
            ? "font-display text-2xl font-bold tracking-tight text-hud-amber md:text-3xl"
            : "text-xl font-semibold text-foreground"
        }
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-hud-dim">{hint}</p> : null}
    </div>
  );
}
