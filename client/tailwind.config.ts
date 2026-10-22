import type { Config } from "tailwindcss";

const color = (name: string) => `rgb(var(--app-${name}-rgb) / <alpha-value>)`;
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./shared/**/*.{ts,tsx}", "./shell/**/*.{ts,tsx}", "./design-system/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink:color("text"), moss:color("accent"), coral:color("accent"), skyglass:color("elevated"), line:color("line"), panel:color("panel"), canvas:color("bg"), muted:color("muted"), danger:color("danger"), "on-accent":color("on-accent") },
    boxShadow: { soft:"var(--ds-shadow)" }
  } },
  plugins: []
};
export default config;
