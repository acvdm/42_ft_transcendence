import htmlContent from "./LoginPage.html";

export function render(): string {
	return htmlContent;
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
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
                // Note: Pas besoin d'envoyer le status ici si ton back-end login ne le gère pas
                // On le gère juste après avec le PATCH
            });

            const data = await response.json();

            if (response.ok) {
                // Stockage des tokens
                if (data.access_token) localStorage.setItem('accessToken', data.access_token);
                if (data.user_id) localStorage.setItem('userId', data.user_id.toString());

                // Récupération du profil (Username)
                if (data.user_id) {
                    try {
                        const userRes = await fetch(`/api/user/${data.user_id}`);
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
                        await fetch(`/api/user/${data.user_id}/status`, {
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
                console.error("Login error:", data);
                if (errorElement) {
                    errorElement.textContent = data.errorMessage || data.message || "Authentication failed";
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