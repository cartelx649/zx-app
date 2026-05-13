import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "border-transparent bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-[0_0_24px_-4px_rgba(168,85,247,0.55)] hover:shadow-[0_0_28px_-2px_rgba(168,85,247,0.75)] hover:from-purple-500 hover:to-fuchsia-400 active:translate-y-px",
  ghost:
    "border-white/10 bg-white/5 text-white/85 hover:bg-white/10 hover:border-purple-400/30 hover:text-white",
  danger:
    "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export function hudButtonClass(
  variant: Variant = "primary",
  className = "",
) {
  return `${baseClass} ${variants[variant]} ${className}`.trim();
}

export function HudButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      className={hudButtonClass(variant, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
