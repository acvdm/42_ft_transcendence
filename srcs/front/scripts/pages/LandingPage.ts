import { fetchWithAuth } from "./api";
import htmlContent from "./LandingPage.html"

export function render(): string {
	return htmlContent;
};

export function initLandingPage() {
	const loginButton = document.getElementById('login-button');
	const registerButton = document.getElementById('register-button');
	const guestButton = document.getElementById('guest-button');
	const guestError = document.getElementById('guest-error');

	const handleNavigation = (path: string) => {
		window.history.pushState({}, '', path);
		window.dispatchEvent(new PopStateEvent('popstate'));
	};

	loginButton?.addEventListener('click', () => {
		handleNavigation('/login');
	});

	registerButton?.addEventListener('click', () => {
		handleNavigation('/register');
	});
    
    guestButton?.addEventListener('click', async () => {
		try {
			const response = await fetch('/api/user/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
				
			}); // a verifier

			if (response.ok) {
				const data = await response.json();

				// 2. CHANGEMENT CRITIQUE : sessionStorage
				// On stocke dans sessionStorage pour que ça disparaisse quand on ferme la fenêtre
				if (data.access_token) sessionStorage.setItem('accessToken', data.access_token);
				if (data.userId) sessionStorage.setItem('userId', data.userId.toString());
				
				// 3. ON AJOUTE UN MARQUEUR "isGuest"
				sessionStorage.setItem('isGuest', 'true');

				// 4. ON REDIRIGE VERS /guest (ET SURTOUT PAS /home)
				handleNavigation('/guest');
			} else {
				console.error("Erreur création guest");
			}
		} catch (err) {
			console.error("Network error while guest login: ", err);
			if (guestError) {
				guestError.textContent = "Network error. Please try again";
				guestError.classList.remove('hidden');
			}
		}
	});
}

