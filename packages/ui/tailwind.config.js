/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0f172a",
          secondary: "#1e293b",
          tertiary: "#0f1929",
        },
        border: {
          DEFAULT: "#1e293b",
          subtle: "#334155",
        },
        node: {
          route: "#10b981",
          "route-border": "#047857",
          class: "#3b82f6",
          "class-border": "#1e40af",
          method: "#8b5cf6",
          "method-border": "#6d28d9",
          function: "#f59e0b",
          "function-border": "#b45309",
          middleware: "#ec4899",
          "middleware-border": "#be185d",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
