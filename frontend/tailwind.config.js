/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        coral: "#f26b5e",
        cream: "#fffaf3",
      },
      boxShadow: {
        soft: "0 24px 70px rgba(20, 33, 61, 0.12)",
      },
    },
  },
  plugins: [],
};