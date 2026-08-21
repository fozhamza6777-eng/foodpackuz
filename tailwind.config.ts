import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#F5F7FB",
        card: "#FFFFFF",
        brand: {
          50: "#EAF0FF",
          100: "#D6E2FF",
          200: "#AEC5FF",
          300: "#7FA1FF",
          400: "#4E79F5",
          500: "#2954E0",
          600: "#1E40C4",
          700: "#17329C"
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
          DEFAULT: "#12A579",
          light: "#E4F8F1"
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
        "card-hover": "0 4px 10px rgba(15,27,51,0.06), 0 24px 40px -16px rgba(41,84,224,0.22)",
        pop: "0 20px 45px -15px rgba(41,84,224,0.35)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg,#2954E0 0%,#4E79F5 45%,#7FA1FF 100%)",
        "radial-fade": "radial-gradient(circle at 30% 20%, rgba(41,84,224,0.12), transparent 55%)"
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
