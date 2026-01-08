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

				if (data.accessToken) sessionStorage.setItem('accessToken', data.accessToken);
				if (data.userId) sessionStorage.setItem('userId', data.userId.toString());
				
				sessionStorage.setItem('isGuest', 'true');
				sessionStorage.setItem('userRole', 'guest');

				try {
                    const userResponse = await fetch(`/api/users/${data.userId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${data.accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        if (userData.alias) {
                            sessionStorage.setItem('username', userData.alias);
                        }
                    }
                } catch (fetchErr) {
                    console.error("Cannot retrieve guest username", fetchErr);
                }
				handleNavigation('/guest');
			} else {
				console.error("Error: guest creation");
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

