import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#141414",
        accent: "#e50914",
      },
    },
  },
  plugins: [],
};
export default config;
