// on va exportrter une fonction qui renvoie du html 
export function NotFoundPage(): string {
	return `
		<div class="p-8 text-center">
			<h1 class="text-6xl font-bold text-red-500 mb-4">
				Not found, try again
			</h1>
			<p class="text-2xl text-gray-300">
				404 not found that's it
			</p>
			<a href="/" class="mt-4 inline-block text-blue-400 hover:underline">
				Go back to the main page
			</a>
			</div>
	`;
}