import htmlContent from "../pages/RegisterPage.html"
import i18next, { changeLanguage } from "../i18n";

export function render(): string {
	let html = htmlContent;

	html = html.replace(/\{\{registerPage\.welcome\}\}/g, i18next.t('registerPage.welcome'));
	html = html.replace(/\{\{registerPage\.password\}\}/g, i18next.t('registerPage.password'));
	html = html.replace(/\{\{registerPage\.register_button\}\}/g, i18next.t('registerPage.register_button'));
	html = html.replace(/\{\{registerPage\.back\}\}/g, i18next.t('registerPage.back'));

	return html;
};

function handleRegister() {
	const button = document.getElementById('register-button');
	const errorElement = document.getElementById('error-message');
	const backButton = document.getElementById('back-button');

	const aliasInput = document.getElementById('alias-input') as HTMLInputElement;
	const emailInput = document.getElementById('email-input') as HTMLInputElement;
	const passwordInput = document.getElementById('password-input') as HTMLInputElement;

	if (!button) {
		console.error("Can't find register button in DOM");
		return;
	}

	if (aliasInput) {
		aliasInput.maxLength = 20;
	}
	if (emailInput) {
		emailInput.maxLength = 254;
	}
	if (passwordInput) {
		passwordInput.maxLength = 128;
	}

	backButton?.addEventListener('click', () => {
		window.history.pushState({}, '', '/');
		window.dispatchEvent(new PopStateEvent('popstate'));
	});

	button.addEventListener('click', async () => {

		const alias = aliasInput?.value.trim() || "";
		const email = emailInput?.value.trim() || "";
		const password = passwordInput?.value || "";

		if (errorElement) {
			errorElement.classList.add('hidden');
			errorElement.textContent = '';
		}

		if (!alias || !password || !email) {
			if (errorElement) {
				errorElement.textContent = i18next.t('registerPage.error_inputs');
				errorElement.classList.remove('hidden');
			}
			return ;
		}

		if (alias.length > 20 || email.length > 254 || password.length > 128) {
			if (errorElement) {
				errorElement.textContent = i18next('registerPage.error_inputs');
				errorElement.classList.remove.apply('hidden');
			}
			return ;
		}

		try {
			const response = await fetch('/api/user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ alias, email, password })
			});

			const result = await response.json();

			if (response.ok) {
				sessionStorage.removeItem('isGuest');
				sessionStorage.removeItem('userRole');

				const { accessToken, userId } = result;
				if (accessToken) {
					localStorage.setItem('accessToken', accessToken);
				}
				if (userId) {
					localStorage.setItem('userId', userId.toString());
				}
				if (userId) {
					try {
						const userRes = await fetch(`/api/user/${userId}`, {
							headers: { 'Authorization': `Bearer ${accessToken}` }
						});
						if (userRes.ok) {

							const userData = await userRes.json();
							if (userData.alias) {
								localStorage.setItem('username', userData.alias);
							}
							if (userData.status) {
								const statusSaved = userData.status === 'online' ? 'available' : userData.status;
								localStorage.setItem('userStatus', statusSaved);
							}
						}
					} catch (err) {
						console.error("Can't get user's profile", err);
					}
				}
				
				window.history.pushState({}, '', '/home');
				window.dispatchEvent(new PopStateEvent('popstate'));

			} else {
				console.error("Login error:", result.error.message);
				if (errorElement) {
					errorElement.textContent = result.error.message || i18next.t('registerPage.error_auth_default');
					errorElement.classList.remove('hidden');
				}
			}
		} catch (error) {
		   console.error("Network error:", error);
			if (errorElement) {
				errorElement.textContent = i18next.t('registerPage.error_network');
				errorElement.classList.remove('hidden');
			}
		}
	});
}

export function registerEvents() {
	handleRegister();


	//================================================
	//=============== LANGUAGE MANAGER ===============
	//================================================

	const toggleBtn = document.getElementById('page-lang-toggle-btn');
	const menuContent = document.getElementById('page-lang-menu-content');
	
	if (toggleBtn && menuContent) {
		toggleBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			menuContent.classList.toggle('hidden');
		});
		window.addEventListener('click', () => {
			if (!menuContent.classList.contains('hidden')) menuContent.classList.add('hidden');
		});
	}

	const display = document.getElementById('page-current-lang-display');
	if (display) {
		display.textContent = i18next.language.toUpperCase();
	}
	
	document.querySelectorAll('.page-lang-select').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			const target = e.currentTarget as HTMLElement;
			const lang = target.getAttribute('data-lang');
			if (lang) {
				await changeLanguage(lang);
				window.dispatchEvent(new PopStateEvent('popstate'));
			}
		});
	});
}