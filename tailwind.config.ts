import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1024px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Newsreader", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // Hardcoded indigo-* utilities (800+ uses) are remapped onto the brand
        // hue so they sit in the same family as --primary instead of fighting it.
        indigo: {
          50: "hsl(236 70% 97.5%)",
          100: "hsl(236 70% 95%)",
          200: "hsl(236 68% 89%)",
          300: "hsl(236 64% 80%)",
          400: "hsl(236 62% 69%)",
          500: "hsl(236 60% 60%)",
          600: "hsl(236 58% 54%)",
          700: "hsl(236 52% 46%)",
          800: "hsl(236 48% 37%)",
          900: "hsl(236 44% 28%)",
          950: "hsl(236 42% 17%)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          border: "hsl(var(--sidebar-border))",
          active: "hsl(var(--sidebar-active))",
        },
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        chart: {
          primary: "hsl(var(--chart-primary))",
          destructive: "hsl(var(--chart-destructive))",
          emerald: "hsl(var(--chart-emerald))",
          purple: "hsl(var(--chart-purple))",
          amber: "hsl(var(--chart-amber))",
        },
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.625rem",
        xl: "0.75rem",
        '2xl': "1rem",
        '3xl': "1.25rem",
      },
      boxShadow: {
        // Tinted, layered, low-opacity — depth without the "floating card" look.
        'xs': '0 1px 1px hsl(var(--shadow-color) / 0.04)',
        'sm': '0 1px 2px hsl(var(--shadow-color) / 0.05), 0 0 0 0.5px hsl(var(--shadow-color) / 0.02)',
        DEFAULT: '0 1px 3px hsl(var(--shadow-color) / 0.06), 0 1px 2px hsl(var(--shadow-color) / 0.04)',
        'md': '0 4px 12px -2px hsl(var(--shadow-color) / 0.07), 0 2px 4px -2px hsl(var(--shadow-color) / 0.04)',
        'lg': '0 10px 24px -8px hsl(var(--shadow-color) / 0.10), 0 4px 8px -4px hsl(var(--shadow-color) / 0.05)',
        'xl': '0 18px 36px -12px hsl(var(--shadow-color) / 0.13), 0 6px 12px -6px hsl(var(--shadow-color) / 0.06)',
        '2xl': '0 28px 56px -16px hsl(var(--shadow-color) / 0.18), 0 8px 16px -8px hsl(var(--shadow-color) / 0.06)',
        '3xl': '0 32px 64px -16px hsl(var(--shadow-color) / 0.22), 0 10px 20px -10px hsl(var(--shadow-color) / 0.08)',
        'premium': '0 12px 28px -12px hsl(var(--primary) / 0.22)',
        'inner-soft': 'inset 0 1px 2px 0 hsl(var(--shadow-color) / 0.04)',
        'ring': '0 0 0 1px hsl(var(--border))',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring': 'cubic-bezier(0.34, 1.36, 0.64, 1)',
      },
      transitionDuration: { DEFAULT: '160ms' },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'accordion-down': 'accordion-down 0.24s cubic-bezier(0.22, 1, 0.36, 1)',
        'accordion-up': 'accordion-up 0.18s cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;