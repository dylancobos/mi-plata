/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Fondo profundo, calmado
        ink: {
          900: "#0b1220",
          800: "#0f1830",
          700: "#16213e",
          600: "#1e2a4a",
        },
        // Verde "progreso / dinero que crece"
        money: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        // Azul "calma / confianza"
        calm: {
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        warn: "#f59e0b",
        danger: "#f43f5e",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 8px 30px -12px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(56,189,248,0.15), 0 8px 30px -12px rgba(16,185,129,0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
