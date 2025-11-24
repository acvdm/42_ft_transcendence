// on va exportrter une fonction qui renvoie du html 
export function RegisterPage(): string {
	return `
	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;"></div
		<!-- Main div -->
	<div class="flex flex-col justify-center items-center gap-6 mt-[-50px]">
		<!-- Picture div -->
		<div class="relative w-[170px] h-[170px] mb-4">
			<!-- le cadre -->
			<img class="absolute inset-0 w-full h-full object-cover" src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">
			<!-- l'image -->
			<img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover" src="https://wlm.vercel.app/assets/usertiles/default.png">
		</div>
		<h1 class="font-sans text-xl font-normal text-blue-950">
			Sign in to Transcendence
		</h1>
		<!-- Login div -->
		<div class="flex flex-col justify-center items-center gap-6">
			<div class="border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm bg-white w-80 p-4 shadow-sm">
				<!-- Username -->
				<input type="alias" placeholder="faufaudu49" id="alias-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>

				<!-- Email -->
				<input type="email" placeholder="Example555@hotmail.com" id="email-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
		
				<!-- Mot de passe -->
				<input type="password" placeholder="Enter your password" id="password-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>

			</div>
			<!-- Bouton de connexion/Register/Guest -->
			<div class="flex flex-col gap-2 w-48">
				<button id="register-button"class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Register</button>
			</div>
	</div>
	</div>
	`;
};


function handleRegister() {
	const button = document.getElementById('register-button');
	button?.addEventListener('click', async () => {
		const email = (document.getElementById('email-input') as HTMLInputElement).value;
		const password = (document.getElementById('password-input') as HTMLInputElement).value;
		const alias = (document.getElementById('alias-input') as HTMLInputElement).value;

		if (!alias || !password || !email) {
			alert("Please fill input");
			return ;
		}

		try {
            // On appelle la route définie dans la Gateway qui redirige vers le service USER
            const response = await fetch('/api/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ alias, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Inscription réussie :", data);
				if (data.access_token) // on sauvegarde le token si necessaire
					localStorage.setItem('accessToken', data.access_token);

				window.history.pushState({}, '', '/home'); // redirection vers homepage
				window.dispatchEvent(new PopStateEvent('popstate')); // on declenche l'event popstate pour forcer le rechargement
				// -> renvoyer sur la page HOME
                // Ici, vous pouvez sauvegarder le token reçu et rediriger
                // localStorage.setItem('accessToken', data.access_token);
                // window.history.pushState({}, '', '/');
                // handleLocationChange(); 
            } else {
                console.error("Erreur inscription :", data.error);
                alert("Erreur: " + data.error);
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
        }
	});
}


export function registerEvents() {
	handleRegister();
}