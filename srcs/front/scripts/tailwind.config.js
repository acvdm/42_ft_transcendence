/** @type {import('tailwindcss').Config} */
module.exports = {
	// je dis a tailwind de scanner ces fichiers
	content: [
		"./srcs/front/index.html", // page html SPA principale
		"./srcs/front/scripts/**/*.ts" // les fichiers typescripts
	],
	theme: {
		extend: {},
	},
	plugins: [],
}
