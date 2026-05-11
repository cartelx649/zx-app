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
        display: ["var(--font-orbitron)", "system-ui", "sans-serif"],
        sans: ["var(--font-barlow)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 20px color-mix(in srgb, var(--hud-cyan) 35%, transparent)",
        neonMagenta:
          "0 0 18px color-mix(in srgb, var(--hud-magenta) 40%, transparent)",
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
      },
      animation: {
        "hud-pulse": "hudPulse 2.2s ease-in-out infinite",
        "bar-fill": "barFill 0.9s ease-out forwards",
        "panel-in": "panelIn 0.45s ease-out forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
