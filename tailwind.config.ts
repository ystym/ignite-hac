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
        // Apple's single near-black ink ramp (#1d1d1f at the top).
        ink: {
          950: "#1d1d1f",
          900: "#1d1d1f",
          800: "#333333",
          700: "#424245",
          600: "#515154",
          500: "#6e6e73",
          400: "#7a7a7a",
          300: "#a1a1a6",
          200: "#d2d2d7",
          100: "#e8e8ed",
        },
        // Action Blue. The legacy "violet" name is kept so existing classes
        // resolve to Apple's one interactive colour instead of a second accent.
        violet: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b9dcff",
          300: "#7cbdff",
          400: "#2997ff",
          500: "#0071e3",
          600: "#0066cc",
          700: "#0055b3",
          800: "#004494",
          900: "#003366",
        },
        // The info/audio ramp is the same blue family.
        sky: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b9dcff",
          300: "#7cbdff",
          400: "#2997ff",
          500: "#0071e3",
          600: "#0066cc",
          700: "#0055b3",
          800: "#004494",
          900: "#003366",
          950: "#001f3d",
        },
        canvas: "#f5f5f7",
        parchment: "#f5f5f7",
        pearl: "#fafafc",
        hairline: "#e0e0e0",
        action: "#0066cc",
        "action-focus": "#0071e3",
        "action-dark": "#2997ff",
        tile: {
          1: "#272729",
          2: "#2a2a2c",
          3: "#252527",
        },
        mint: "#e6f2ea",
        peach: "#f7eee6",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Apple's reading pace: 17px body, not 16.
        body: ["17px", { lineHeight: "1.47", letterSpacing: "-0.022em" }],
        caption: ["14px", { lineHeight: "1.43", letterSpacing: "-0.016em" }],
        fine: ["12px", { lineHeight: "1.35", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
        "4xl": "1.5rem",
        "5xl": "2rem",
      },
      boxShadow: {
        // No UI elevation. Shadow belongs to product imagery only.
        card: "none",
        lift: "none",
        glow: "none",
        product: "3px 5px 30px rgba(0, 0, 0, 0.22)",
        modal: "0 24px 80px -24px rgba(0, 0, 0, 0.28)",
      },
      backgroundImage: {
        "grid-soft": "none",
      },
      maxWidth: {
        reading: "680px",
        marketing: "1080px",
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
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
