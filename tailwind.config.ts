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
        card: "var(--card-bg)",
        hud: {
          panel: "var(--hud-panel)",
          stroke: "var(--hud-stroke)",
          green: "var(--hud-green)",
          cyan: "var(--hud-cyan)",
          purple: "var(--hud-purple)",
          amber: "var(--hud-amber)",
          dim: "var(--hud-dim)",
          danger: "var(--hud-danger)",
        },
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        hudPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        barFill: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        panelIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulseGreen: {
          "0%, 100%": { boxShadow: "0 0 24px -6px rgba(74,222,128,0.35)" },
          "50%": { boxShadow: "0 0 40px -4px rgba(74,222,128,0.65)" },
        },
        glowPulseCyan: {
          "0%, 100%": { boxShadow: "0 0 24px -6px rgba(93,169,255,0.35)" },
          "50%": { boxShadow: "0 0 40px -4px rgba(93,169,255,0.65)" },
        },
        floatOrb: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(20px, -28px, 0)" },
        },
        tickerSlide: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        orbitTilt: {
          from: { transform: "rotateX(72deg) rotateZ(0deg)" },
          to: { transform: "rotateX(72deg) rotateZ(360deg)" },
        },
        orbitTiltReverse: {
          from: { transform: "rotateX(68deg) rotateZ(360deg)" },
          to: { transform: "rotateX(68deg) rotateZ(0deg)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.9" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(200%)", opacity: "0" },
        },
      },
      animation: {
        "hud-pulse": "hudPulse 2.2s ease-in-out infinite",
        "bar-fill": "barFill 0.9s ease-out forwards",
        "panel-in": "panelIn 0.45s ease-out forwards",
        "glow-green": "glowPulseGreen 3s ease-in-out infinite",
        "glow-cyan": "glowPulseCyan 3s ease-in-out infinite",
        "float-orb": "floatOrb 12s ease-in-out infinite",
        "ticker": "tickerSlide 28s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "orbit-tilt": "orbitTilt 18s linear infinite",
        "orbit-tilt-reverse": "orbitTiltReverse 28s linear infinite",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "scan-line": "scanLine 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
