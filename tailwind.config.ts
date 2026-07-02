import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Thème clair (contenu). La sidebar a ses propres couleurs sombres.
        base: "#ffffff",
        surface: "#ffffff",
        "surface-2": "#f4f4f6",
        border: "#e5e5ea",
        ink: "#17171a",
        muted: "#6b6b76",
        faint: "#9a9aa4",
        accent: "#7B2FE0",
        "accent-2": "#6D28D9",
        ok: "#059669",
        warn: "#b45309",
        danger: "#dc2626",
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
