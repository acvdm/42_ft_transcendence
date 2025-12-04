// on va exportrter une fonction qui renvoie du html 
export function LoginPage(): string {
    return `
	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;"></div>
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
				<!-- Email -->
				<input type="email" placeholder="Example555@hotmail.com" id="email-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
		
				<!-- Mot de passe -->
				<input type="password" placeholder="Enter your password" id="password-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>

				<!-- Status -> disponible, busy, not displayed -->
				<div class="flex items-center justify-between mb-3 text-sm">
					<div class="flex items-center gap-1 mb-3">
						<span> Sign in as:</span>
						<div class="flex items-center gap-1">
							<select id="status-input" class="bg-transparent focus:outline-none text-sm">
								<option value="available">Available</option>
								<option value="busy">Busy</option>
								<option value="away">Away</option>
								<option value="offline">Appear offline</option>
							</select>
						</div>
					</div>
				</div>
				<div class="flex flex-col items-center justify-center">
					<p id="error-message" class="text-red-600 text-sm mb-2 hidden"></p>
				</div>
			</div>
			<!-- Bouton de connexion/Register/Guest -->
			<div class="flex flex-col gap-2 w-48">
				<button id="login-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Login</button>
			</div>
	</div>
	</div>
	`;
};


function handleLogin() {
    const button = document.getElementById('login-button');
    const errorElement = document.getElementById('error-message');

    button?.addEventListener('click', async () => {
        const email = (document.getElementById('email-input') as HTMLInputElement).value;
        const password = (document.getElementById('password-input') as HTMLInputElement).value;
        // Ceci récupère la valeur en minuscule ("available", "busy"...)
        const selectedStatus = (document.getElementById('status-input') as HTMLSelectElement).value;

        if (errorElement) {
            errorElement.classList.add('hidden');
            errorElement.textContent = '';
        }

        if (!email || !password) {
            if (errorElement) {
                errorElement.textContent = "Please fill all inputs";
                errorElement.classList.remove('hidden');
            }
            return;
        }

        try {
            // 1. Authentification
            const response = await fetch('/api/auth/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
                // Note: Pas besoin d'envoyer le status ici si ton back-end login ne le gère pas
                // On le gère juste après avec le PATCH
            });

            const result = await response.json();

            if (result.success) {
				const { access_token, refresh_token, user_id } = result.data;

                // Stockage des tokens
                if (access_token) localStorage.setItem('accessToken', access_token);
                if (user_id) localStorage.setItem('userId', user_id.toString());

                // Récupération du profil (Username)
                if (user_id) {
                    try {
                        const userRes = await fetch(`/api/users/${user_id}`);
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            if (userData.alias) {
                                localStorage.setItem('username', userData.alias);
                            }
                        }
                    } catch (err) {
                        console.error("Can't get user's profile", err);
                    }

                    // 2. Mise à jour du Status en DB (PATCH)
                    // On envoie le status que l'utilisateur A CHOISI (selectedStatus)
                    try {
                        await fetch(`/api/users/${user_id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: selectedStatus })
                        });
                        console.log("Status updated to DB:", selectedStatus);
                    } catch (err) {
                        console.error("Failed to update status on login", err);
                    }
                }

                // 3. Sauvegarde Locale CORRECTE pour HomePage
                // IMPORTANT : Utiliser 'userStatus' (pas 'user-status')
                // IMPORTANT : Utiliser selectedStatus (ce qu'il a choisi) et non data.status (le vieux status de la DB)
                localStorage.setItem('userStatus', selectedStatus);

                // 4. Redirection
                window.history.pushState({}, '', '/home');
                window.dispatchEvent(new PopStateEvent('popstate'));

            } else {
                // Gestion d'erreur login
                console.error("Login error:", result.error);
                if (errorElement) {
                    errorElement.textContent = result.error.errorMessage || result.error.error || "Authentication failed";
                    errorElement.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error("Network error:", error);
            if (errorElement) {
                errorElement.textContent = "Network error, please try again";
                errorElement.classList.remove('hidden');
            }
        }
    });
}

export function loginEvents() {
    handleLogin();
}