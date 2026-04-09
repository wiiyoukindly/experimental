/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0b0e",
        paper: "#f5f3ec",
        noir: {
          50: "#f5f3ec",
          100: "#e8e4d7",
          900: "#1a1a20",
        },
      },
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
