import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6EFDC",
        kraft: {
          50: "#F3E9CF",
          100: "#EADFC0",
          200: "#DCC99C",
          300: "#C9AF7C",
          400: "#AE9260",
          500: "#8C7248",
          600: "#6B5638"
        },
        ink: {
          DEFAULT: "#241C15",
          soft: "#3A2E22"
        },
        signal: {
          DEFAULT: "#FF5A1F",
          dark: "#E14710"
        },
        stamp: "#B5222A",
        eco: {
          DEFAULT: "#176F5C",
          light: "#2C9276"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      backgroundImage: {
        "kraft-fiber":
          "radial-gradient(circle at 20% 20%, rgba(140,114,72,0.10) 0, transparent 45%), radial-gradient(circle at 80% 60%, rgba(140,114,72,0.08) 0, transparent 40%)",
        "diagonal-lines":
          "repeating-linear-gradient(-45deg, rgba(36,28,21,0.05) 0px, rgba(36,28,21,0.05) 1px, transparent 1px, transparent 12px)"
      },
      boxShadow: {
        crate: "6px 6px 0px 0px rgba(36,28,21,1)",
        "crate-sm": "3px 3px 0px 0px rgba(36,28,21,1)",
        lift: "0 20px 40px -15px rgba(36,28,21,0.35)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(var(--r,0deg))" },
          "50%": { transform: "translateY(-14px) rotate(var(--r,0deg))" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        stamp: {
          "0%": { transform: "scale(2.2) rotate(-14deg)", opacity: "0" },
          "60%": { transform: "scale(0.9) rotate(-14deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-14deg)", opacity: "1" }
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(255,90,31,0.45)" },
          "100%": { boxShadow: "0 0 0 16px rgba(255,90,31,0)" }
        }
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        stamp: "stamp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        pulseRing: "pulseRing 1.8s ease-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
