import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F7F7F2",
        moss: "#C9F43A",
        coral: "#5DE16F",
        skyglass: "#20251B",
        line: "#243044"
      },
      boxShadow: {
        soft: "0 18px 44px rgba(0, 0, 0, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
