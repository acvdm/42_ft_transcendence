/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./scripts/**/*.{ts,tsx}",  // ← IMPORTANT: scanne les .ts source!
    "./scripts/pages/**/*.html",
    "./scripts/controllers/**/*.ts",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
