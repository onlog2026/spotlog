import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "4rem",
      },
      screens: {
        sm: "100%",
        md: "100%",
        lg: "100%",
        xl: "100%",
        "2xl": "100%",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ===== AZUL INSTITUCIONAL SPOTLOG #011960 =====
        // Mantenho o nome 'navy-*' pra não quebrar 50+ arquivos
        // 900 é a cor oficial; 950 é variação mais escura
        navy: {
          50:  "#e8eafa",
          100: "#c6caef",
          200: "#9aa1e0",
          300: "#6c75d0",
          400: "#424dc1",
          500: "#1f2bb1",
          600: "#0f1d9d",
          700: "#051685",
          800: "#021368",
          900: "#011960",  // ← cor institucional oficial
          950: "#010d3a",
        },

        ink: {
          50:  "#f8faff",
          100: "#eef3fa",
          200: "#dde6f3",
          300: "#c1cfe3",
          400: "#8aa0bf",
          500: "#5e7497",
          600: "#465a78",
          700: "#374863",
          800: "#2a3850",
          900: "#1b2438",
          950: "#0e1424",
        },

        // ===== VERMELHO PRINCIPAL SPOTLOG #BA0102 =====
        // Mantenho o nome 'spotorange-*' pra não quebrar componentes existentes
        // mas o valor agora é VERMELHO oficial (não mais laranja)
        spotorange: {
          50:  "#ffeded",
          100: "#ffd6d6",
          200: "#fbaaaa",
          300: "#f47373",
          400: "#e23a3a",
          500: "#ba0102",  // ← vermelho oficial principal
          600: "#9e0101",
          700: "#820101",
          800: "#6a0101",
          900: "#560101",
          950: "#300000",
        },

        // Verde mantém pra status de sucesso (SLA, entregue, etc)
        success: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { from: { opacity: "0", transform: "translateX(20px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        "pulse-soft": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
        "float-y": { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "float-y": "float-y 4s ease-in-out infinite",
      },
      boxShadow: {
        soft:         "0 2px 12px -2px rgba(1,25,96,0.10), 0 4px 24px -4px rgba(1,25,96,0.08)",
        card:         "0 4px 20px -4px rgba(1,25,96,0.12), 0 8px 32px -8px rgba(1,25,96,0.10)",
        "card-hover": "0 12px 40px -4px rgba(1,25,96,0.20), 0 20px 56px -8px rgba(1,25,96,0.16)",
        "orange-glow":"0 10px 28px -4px rgba(186,1,2,0.40)",    // vermelho glow
        "navy-glow":  "0 10px 28px -4px rgba(1,25,96,0.40)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
