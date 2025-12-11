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
            const response = await fetch('/api/auth/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
                // Note: Pas besoin d'envoyer le status ici si ton back-end login ne le gère pas
                // On le gère juste après avec le PATCH
            });

            const result = await response.json();

            if (result.success) {
				const { access_token, user_id } = result.data;

                // Stockage des tokens
                if (access_token) localStorage.setItem('accessToken', access_token);
                if (user_id) localStorage.setItem('userId', user_id.toString());

                // Récupération du profil (Username) (on verrifie qu'on a bien un access token)
                if (user_id && access_token) {
                    try {
                        const userRes = await fetch(`/api/users/${user_id}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${access_token}`
                            }
                        });

                        if (userRes.ok) {
                            const userData = await userRes.json();
                            if (userData.alias) {
                                localStorage.setItem('username', userData.alias);
                            }
                        }
                    } catch (err) {
                        console.error("Can't get user's profile", err);
                    }

                    try {
                        await fetch(`/api/users/${user_id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json',
                                // Ajout du token
                                'Authorization': `Bearer ${access_token}`
                             },
                            body: JSON.stringify({ status: selectedStatus })
                        });
                        console.log("Status updated to DB:", selectedStatus);
                    } catch (err) {
                        console.error("Failed to update status on login", err);
                    }
                }

                localStorage.setItem('userStatus', selectedStatus);
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