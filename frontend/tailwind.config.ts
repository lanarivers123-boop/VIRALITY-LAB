import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: "#0A0A0B",
          light: "#FAFAF7",
        },
        cyan: {
          accent: "#22D3EE",
        },
        gold: {
          accent: "#C8A24B",
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
      borderRadius: {
        card: "14px",
        btn: "10px",
        input: "8px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
