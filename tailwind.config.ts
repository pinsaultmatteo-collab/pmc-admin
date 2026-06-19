import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0e0e10",
        surface: "#16161a",
        "surface-2": "#1c1c21",
        border: "#26262c",
        ink: "#ededf0",
        muted: "#8a8a94",
        faint: "#5b5b64",
        accent: "#7B2FE0",
        "accent-2": "#6D28D9",
        ok: "#34d399",
        warn: "#fbbf24",
        danger: "#f87171",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
