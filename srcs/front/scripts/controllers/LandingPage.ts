import { fetchWithAuth } from "../services/api";
import htmlContent from "../pages/LandingPage.html"
import i18next, { changeLanguage } from "../i18n";

export function render(): string {
    let html = htmlContent;

	html = html.replace(/\{\{landing\.welcome\}\}/g, i18next.t('landing.welcome'));
	html = html.replace(/\{\{landing\.login_button\}\}/g, i18next.t('landing.login_button'));
	html = html.replace(/\{\{landing\.register_button\}\}/g, i18next.t('landing.register_button'));
	html = html.replace(/\{\{landing\.guest_button\}\}/g, i18next.t('landing.guest_button'));

	return html;

};


	//================================================
	//============= LANGUAGE MANAGEMENT ==============
	//================================================

function setupPageLangDropdown() {
    const toggleBtn = document.getElementById('page-lang-toggle-btn');
    const menuContent = document.getElementById('page-lang-menu-content');
    
	const display = document.getElementById('page-current-lang-display');
    if (display) {
        display.textContent = i18next.language.toUpperCase();
    }

    if (toggleBtn && menuContent) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuContent.classList.toggle('hidden');
        });

        window.addEventListener('click', () => {
            if (!menuContent.classList.contains('hidden')) {
                menuContent.classList.add('hidden');
            }
        });
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

	//================================================
	//============= LANDING PAGE BUTTONS =============
	//================================================

export function initLandingPage() {
	
	setupPageLangDropdown();

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
			});

			if (response.ok) {
				const data = await response.json();

				if (data.accessToken) {
					sessionStorage.setItem('accessToken', data.accessToken);
				}
				if (data.userId) {
					sessionStorage.setItem('userId', data.userId.toString());
				}
				
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
				guestError.textContent = i18next.t('landing.guest_error_network');
				guestError.classList.remove('hidden');
			}
		}
	});
}

