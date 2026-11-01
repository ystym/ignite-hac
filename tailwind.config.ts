import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#090D24",
          900: "#0F1433",
          800: "#171D45",
          700: "#242B5B",
          600: "#3A416F",
          500: "#5B6188",
          400: "#858AA8",
          300: "#B4B7C8",
        },
        violet: {
          50: "#F3F0FF",
          100: "#E9E3FF",
          200: "#D5C9FF",
          300: "#B8A4FF",
          400: "#9878FF",
          500: "#7C53FF",
          600: "#6A3BFA",
          700: "#5A2BD6",
          800: "#4A24AE",
          900: "#3D218C",
        },
        canvas: "#F7F7FB",
        mint: "#B8F5DB",
        peach: "#FFE1CB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,20,51,0.04), 0 8px 24px -12px rgba(15,20,51,0.14)",
        lift: "0 2px 6px rgba(15,20,51,0.05), 0 24px 48px -20px rgba(15,20,51,0.22)",
        glow: "0 18px 50px -18px rgba(124,83,255,0.55)",
      },
      backgroundImage: {
        "grid-soft":
          "linear-gradient(to right, rgba(15,20,51,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,20,51,0.045) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
