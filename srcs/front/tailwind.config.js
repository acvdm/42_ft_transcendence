/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./scripts/**/*.{ts,html}",  // <--- AJOUTE ,html ICI
    "../../shared/**/*.{ts,html}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
