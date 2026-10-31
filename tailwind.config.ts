import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/** All colors are semantic tokens defined per palette/mode in app/palettes/*.css */
const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        brand: "var(--brand)",
        "brand-2": "var(--brand-2)",
        accent: "var(--accent-text)",
        highlight: "var(--highlight)",
        "highlight-fg": "var(--highlight-fg)",
        "cta-fg": "var(--cta-fg)",
        "cta-chip": "var(--cta-chip-bg)",
        "cta-chip-fg": "var(--cta-chip-fg)",
        "t-bg": "var(--t-bg)",
        "t-fg": "var(--t-fg)",
        "t-border": "var(--t-border)",
      },
      backgroundImage: {
        "brand-gradient": "var(--brand-gradient)",
        "brand-gradient-deep": "var(--brand-gradient-deep)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-bangla)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "var(--font-bangla)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [typography],
};
export default config;
