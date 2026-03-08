import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        gold: {
          DEFAULT: "#c9a84c",
          light: "#e2c97e",
          dim: "#8a7033",
          faint: "rgba(201, 168, 76, 0.08)",
        },
        surface: {
          DEFAULT: "#0a0a0c",
          raised: "#111114",
          overlay: "#18181d",
        },
        border: {
          DEFAULT: "#222228",
          subtle: "#1a1a1f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
