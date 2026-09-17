import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nhs: {
          blue: "#005eb8",
          dark: "#003087",
          pale: "#e8f1fb",
        },
        safety: {
          green: "#007f3b",
          amber: "#ffb81c",
          red: "#da291c",
        },
      },
      boxShadow: {
        soft: "0 20px 60px rgba(0, 48, 135, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
