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
		if (guestError)
			guestError.classList.remove('hidden');

		try {
			const response = await fetch('/api/users/guest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
				
			}); // a verifier

			const result = await response.json();

			if (response.ok && result.access_token) {
				localStorage.setItem('accessToken', result.access_token);
				if (result.user_id)
					localStorage.setItem('userId', result.user_id);
			
				handleNavigation('/guest');
			} else {
				console.error("Guest login failed:", result);
				if (guestError) {
					guestError.textContent = result.error?.message || "Failed to create guest";
					guestError.classList.remove('hidden');
				}
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

