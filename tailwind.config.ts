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
      padding: "1.5rem",
      screens: { "2xl": "1320px" },
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
        navy: {
          50: "#eef3ff", 100: "#dde7ff", 200: "#bccfff", 300: "#8eafff",
          400: "#5d83ff", 500: "#3a5cff", 600: "#2540f0", 700: "#1d31cf",
          800: "#1b2ba6", 900: "#1c2a83", 950: "#0c1240",
        },
        ink: {
          50: "#f8faff", 100: "#eef3fa", 200: "#dde6f3", 300: "#c1cfe3",
          400: "#8aa0bf", 500: "#5e7497", 600: "#465a78", 700: "#374863",
          800: "#2a3850", 900: "#1b2438", 950: "#0e1424",
        },
        spotorange: {
          50: "#fff5ed", 100: "#ffe7d3", 200: "#ffcaa5", 300: "#ffa56d",
          400: "#ff7333", 500: "#ff5410", 600: "#f03b06", 700: "#c72b08",
          800: "#9e240f", 900: "#7f2010", 950: "#450c06",
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
        soft: "0 2px 12px -2px rgba(28,42,131,0.08), 0 4px 24px -4px rgba(28,42,131,0.06)",
        card: "0 4px 20px -4px rgba(28,42,131,0.1), 0 8px 32px -8px rgba(28,42,131,0.08)",
        "card-hover": "0 12px 40px -4px rgba(28,42,131,0.18), 0 20px 56px -8px rgba(28,42,131,0.14)",
        "orange-glow": "0 10px 28px -4px rgba(255,84,16,0.35)",
        "navy-glow": "0 10px 28px -4px rgba(37,64,240,0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
