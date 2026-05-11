import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "border-hud-cyan/20 bg-hud-cyan text-white hover:bg-blue-700 active:translate-y-px",
  ghost:
    "border-hud-stroke bg-white text-foreground hover:border-hud-cyan/30 hover:text-hud-cyan",
  danger:
    "border-red-200 bg-red-50 text-hud-danger hover:bg-red-100",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition";

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
