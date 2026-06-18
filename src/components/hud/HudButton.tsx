import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger" | "cyan" | "purple";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "border-transparent bg-green-400 text-black font-semibold shadow-[0_0_20px_-4px_rgba(74,222,128,0.55)] hover:bg-green-300 hover:shadow-[0_0_28px_-2px_rgba(74,222,128,0.75)] active:translate-y-px",
  ghost:
    "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:border-white/20 hover:text-white",
  danger:
    "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  cyan:
    "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400/40",
  purple:
    "border-purple-400/30 bg-purple-400/10 text-purple-300 hover:bg-purple-400/20 hover:border-purple-400/40",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export function hudButtonClass(variant: Variant = "primary", className = "") {
  return `${baseClass} ${variants[variant]} ${className}`.trim();
}

export function HudButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button type="button" className={hudButtonClass(variant, className)} {...rest}>
      {children}
    </button>
  );
}
