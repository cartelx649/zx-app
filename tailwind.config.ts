import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        hud: {
          base: "var(--hud-base)",
          panel: "var(--hud-panel)",
          stroke: "var(--hud-stroke)",
          cyan: "var(--hud-cyan)",
          magenta: "var(--hud-magenta)",
          amber: "var(--hud-amber)",
          dim: "var(--hud-dim)",
          danger: "var(--hud-danger)",
        },
      },
      fontFamily: {
        display: [
          "var(--font-space-grotesk)",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-soft":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.045) 1px, transparent 0)",
      },
      boxShadow: {
        neon: "0 0 20px color-mix(in srgb, var(--hud-cyan) 35%, transparent)",
        neonMagenta:
          "0 0 18px color-mix(in srgb, var(--hud-magenta) 40%, transparent)",
        glow: "0 0 32px -8px rgba(168, 85, 247, 0.45)",
        glowSoft: "0 0 20px -6px rgba(168, 85, 247, 0.25)",
      },
      keyframes: {
        hudPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        barFill: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        panelIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": {
            boxShadow: "0 0 24px -6px rgba(168, 85, 247, 0.35)",
          },
          "50%": {
            boxShadow: "0 0 38px -4px rgba(168, 85, 247, 0.65)",
          },
        },
        floatOrb: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(20px, -28px, 0)" },
        },
      },
      animation: {
        "hud-pulse": "hudPulse 2.2s ease-in-out infinite",
        "bar-fill": "barFill 0.9s ease-out forwards",
        "panel-in": "panelIn 0.45s ease-out forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "float-orb": "floatOrb 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
