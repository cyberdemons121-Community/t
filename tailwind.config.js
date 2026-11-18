/** @type {import('tailwindcss').Config} */
export default {
  content: ["./*.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#05070a",
          900: "#070b10",
          800: "#0a1017",
          700: "#0e1620",
        },
        blood: {
          DEFAULT: "#e01b2e",
          bright: "#ff3046",
          dark: "#8a0d1b",
        },
        ice: {
          DEFAULT: "#5fd4e6",
          bright: "#8ce9f5",
          dark: "#1b6b7a",
        },
        steel: "#3f4a57",
        fog: "#9aa7b4",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-red": "0 0 40px -10px rgba(224, 27, 46, 0.55)",
        "glow-ice": "0 0 40px -10px rgba(95, 212, 230, 0.45)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 45%": { opacity: "1" },
          "50%, 95%": { opacity: "0.15" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        sweep: {
          "0%": { transform: "translateY(-30%)", opacity: "0" },
          "35%": { opacity: "0.6" },
          "100%": { transform: "translateY(130%)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(18px, -14px, 0)" },
        },
        "drift-reverse": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(-16px, 12px, 0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.85" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "41%": { opacity: "1" },
          "42%": { opacity: "0.82" },
          "43%": { opacity: "1" },
          "77%": { opacity: "0.9" },
          "78%": { opacity: "1" },
        },
        "border-pulse": {
          "0%, 100%": { borderColor: "rgba(255,255,255,0.15)" },
          "50%": { borderColor: "rgba(95,212,230,0.45)" },
        },
      },
      animation: {
        marquee: "marquee 34s linear infinite",
        blink: "blink 1.6s steps(1) infinite",
        float: "float 9s ease-in-out infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
        sweep: "sweep 7s linear infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "fade-in": "fade-in 0.7s ease both",
        "scale-in": "scale-in 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        drift: "drift 14s ease-in-out infinite",
        "drift-reverse": "drift-reverse 16s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        shimmer: "shimmer 2.8s linear infinite",
        flicker: "flicker 5s linear infinite",
        "border-pulse": "border-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
