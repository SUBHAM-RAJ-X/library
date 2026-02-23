/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#1e293b",
        soft: "#f8fafc",
      },
      boxShadow: {
        card: "0 10px 25px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
}