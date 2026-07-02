import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        paper: "#fbfaf8",
        line: "#e7e2dc",
        sage: "#57766a",
        clay: "#b96447",
        honey: "#d9a441"
      },
      boxShadow: {
        panel: "0 12px 34px rgba(32, 33, 36, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
