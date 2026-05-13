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
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 transition hover:border-purple-400/30 hover:bg-white/[0.04]">
      <p className="text-xs font-medium uppercase tracking-wider text-white/55">
        {label}
      </p>
      <p
        className={
          variant === "score"
            ? "font-display text-2xl font-bold tracking-tight text-amber-300 md:text-3xl"
            : "mt-1 text-xl font-semibold text-white"
        }
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-white/50">{hint}</p> : null}
    </div>
  );
}
