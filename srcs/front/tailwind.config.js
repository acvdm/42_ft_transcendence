/** @type {import('tailwindcss').Config} */
module.exports = {
	// je dis a tailwind de scanner ces fichiers
	content: [
		"./public/index.html", // page html SPA principale
		"./scripts/**/*.ts" // les fichiers typescripts
	],
	theme: {
		extend: {},
	},
	plugins: [],
}
