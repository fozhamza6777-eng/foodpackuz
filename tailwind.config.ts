import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#F5F7FB",
        card: "#FFFFFF",
        brand: {
          50: "#EAFBF1",
          100: "#CFF5DE",
          200: "#9FE9BE",
          300: "#66D89B",
          400: "#34C27C",
          500: "#16A34A",
          600: "#0F7C3A",
          700: "#0B5C2C"
        },
        ink: {
          DEFAULT: "#0F1B33",
          soft: "#4A5876",
          faint: "#8993AC"
        },
        danger: {
          DEFAULT: "#E6394A",
          light: "#FDE8EA"
        },
        success: {
          DEFAULT: "#0D9488",
          light: "#E0F7F4"
        },
        amber: {
          DEFAULT: "#F5A524",
          light: "#FEF3DD"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,27,51,0.04), 0 8px 24px -12px rgba(15,27,51,0.12)",
        "card-hover": "0 4px 10px rgba(15,27,51,0.06), 0 24px 40px -16px rgba(22,163,74,0.22)",
        pop: "0 20px 45px -15px rgba(22,163,74,0.35)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg,#16A34A 0%,#34C27C 45%,#66D89B 100%)",
        "radial-fade": "radial-gradient(circle at 30% 20%, rgba(22,163,74,0.12), transparent 55%)"
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" }
        }
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        float: "float 4.5s ease-in-out infinite",
        blink: "blink 1.6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
