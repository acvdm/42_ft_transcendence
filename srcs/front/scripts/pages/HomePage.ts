// on va exportrter une fonction qui renvoie du html 
export function HomePage(): string {
	return `
		<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat bg-linear-to-t from-cyan-300 to-zinc-100" style="background: linear-gradient(white, #cceffc); background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;">
			<h1 class="text-4xl font-bold text-blue-400 mb-4">
				This is Transcendence 🚧
			</h1>
			<p class="text-lg text-gray-300">
				Work in progress....
			</p>
		</div>
	`;
};