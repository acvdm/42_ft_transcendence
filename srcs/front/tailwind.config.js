/** @type {import('tailwindcss').Config} */
module.exports = {
    // je dis a tailwind de scanner ces fichiers
    content: [
        "./index.html", // page html SPA principale
        "./scripts/**/*.ts" // les fichiers typescripts
    ],
    theme: {
        extend: { // <-- On ouvre "extend"
            colors: { // <-- On met "colors" A L'INTERIEUR
                msn_blue: "#43B5EB"
            }
        } // <-- On ferme "extend"
    },
    plugins: [],
}