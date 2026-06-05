import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16202A",
        moss: "#2F6F5E",
        coral: "#E76F51",
        skyglass: "#E8F3F6",
        line: "#D9E2E7"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(22, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
