import { render as LoginPage, loginEvents } from "./controllers/LoginPage"; 
import { render as HomePage, afterRender as HomePageAfterRender } from "./controllers/HomePage";
import { render as ProfilePage, afterRender as ProfilePageAfterRender } from "./controllers/ProfilePage";
import { NotFoundPage } from "./pages/NotFound";
import { render as LandingPage, initLandingPage } from "./controllers/LandingPage";
import { render as RegisterPage, registerEvents } from "./controllers/RegisterPage";
import { render as GuestPage, afterRender as GuestAfterRender } from "./controllers/GuestPage";
import { applyTheme } from "./controllers/ProfilePage";
import { render as GamePage, initGamePage, isGameRunning, cleanup, showExitConfirmationModal } from "./controllers/GamePage";
import { render as DashboardPage, afterRender as DashboardPageAfterRender } from "./controllers/DashboardPage";
import SocketService from "./services/SocketService";
import { initI18n, changeLanguage } from "./i18n";
import i18next from "./i18n";

const appElement = document.getElementById('app');

interface Page {
	render: () => string;
	afterRender?: () => void;
}

	//================================================
	//==================== ROUTES ====================
	//================================================

const publicRoutes = ['/', '/login', '/register', '/guest'];

const routes: { [key: string]: Page } = {
	'/': {
		render: LandingPage,
		afterRender: initLandingPage
	},
	'/home': {
		render: HomePage,
		afterRender: HomePageAfterRender
	},
	'/profile': {
		render: ProfilePage,
		afterRender: ProfilePageAfterRender
	},
	'/dashboard': {
		render: DashboardPage,
		afterRender: DashboardPageAfterRender
	},
	'/register': {
		render: RegisterPage,
		afterRender: registerEvents
	},
	'/login': {
		render: LoginPage,
		afterRender: loginEvents
	},
	'/guest': {
		render: GuestPage,
		afterRender: GuestAfterRender
	},
	'/game': {
		render: GamePage,
		afterRender: () => {
			const urlParams = new URLSearchParams(window.location.search);
			const state = window.history.state;
			const mode = urlParams.get('mode') || (state && state.gameMode ? state.gameMode : 'local');
			initGamePage(mode);
		}
	}
};

	//================================================
	//==================== LOGOUT ====================
	//================================================

const handleLogout = async () => {

	try {
		await fetch('/api/auth/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({})
		});

	} catch (error) {
		console.error("Error during the deconnection from the server: ", error);
	} finally {

		SocketService.getInstance().disconnectAll();
		localStorage.removeItem('accessToken');
		localStorage.removeItem('userId');
		localStorage.removeItem('username');
		localStorage.removeItem('userStatus');
		sessionStorage.clear();
		window.history.pushState({}, '', '/');
		const popStateEvent = new PopStateEvent('popstate');
		window.dispatchEvent(popStateEvent);
	}
}

	//================================================
	//==================== CLEAN =====================
	//================================================

const clearGuestSession = () => {
	
	SocketService.getInstance().disconnectAll();
	sessionStorage.removeItem('accessToken');
	sessionStorage.removeItem('userId');
	sessionStorage.removeItem('username');
	sessionStorage.removeItem('userRole');
	sessionStorage.removeItem('isGuest');
};


	//================================================
	//============= NAV BAR TRANSLATION ==============
	//================================================

const translateNavElements = () => {
	const elements = document.querySelectorAll('[data-i18n]');
	elements.forEach(el => {
		const key = el.getAttribute('data-i18n');
		if (key) {
			const translation = i18next.t(key);
			if (translation && translation !== key)
				el.textContent = translation;
		}
	});
};


const loadUserLanguageFromDB = async () => {
	const userId = localStorage.getItem('userId');
	const accessToken = localStorage.getItem('accessToken');

	if (userId) {
		try {
			const response = await fetch(`/api/user/${userId}/language`, {
				method: 'GET',
				headers: {
					'Content-type': 'application/json',
					'Authorization': `Bearer ${accessToken}`
				}
			});
			if (response.ok) {
				const data = await response.json();
				if (data.success && data.language) {
					const dbLang = data.language;
					const currentLang = i18next.language;

					if (dbLang && dbLang !== currentLang) {
						console.log(`Langue en BDD trouvee (${dbLang})`);
						await changeLanguage(dbLang);

						translateNavElements();
					}
				}
			}


		} catch (error) {
			console.error("Impossible de charger la langue utilisateur");
		}
	}
}

	//================================================
	//================ CHANGING PAGE =================
	//================================================

const handleLocationChange = async () => {
	if (!appElement) {
		return;
	}

	let path = window.location.pathname;
	
	if ((path === '/' || path === '/login' || path === '/register') && sessionStorage.getItem('isGuest') === 'true') {
		clearGuestSession();
	}

	if (path === '/') {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('userId');
		localStorage.removeItem('username');
		localStorage.removeItem('userStatus');
		localStorage.removeItem('userTheme');
	}
	
	const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
	const isGuest = sessionStorage.getItem('isGuest') === 'true';

	if (!publicRoutes.includes(path) && !accessToken && !isGuest) {
		window.history.replaceState(null, '', '/');
		handleLocationChange();
		return ;
	}

	if (path === '/logout') {
		handleLogout();
		return;
	}

	if (!routes[path]) {
		if (isGuest) {
			window.history.replaceState(null, '', '/guest');
		} else if (accessToken) {
			window.history.replaceState(null, '', '/home');
		} else {
			window.history.replaceState(null, '', '/');
		}
		handleLocationChange();
		return;
	}

	if (accessToken && !isGuest) {
		await loadUserLanguageFromDB();
	}
	if (isGameRunning() && path !== '/game') {
		cleanup();
	}

	//================================================
	//============= NAVIGATION BAR LOGIC =============
	//================================================

	const setupLangDropdown = () => {
		const toggleBtn = document.getElementById('lang-toggle-btn');
		const menuContent = document.getElementById('lang-menu-content');

		if (toggleBtn && menuContent) {
			const newToggle = toggleBtn.cloneNode(true) as HTMLElement;
			toggleBtn.parentNode?.replaceChild(newToggle, toggleBtn);

			newToggle.addEventListener('click', (e) => {
				e.stopPropagation(); 
				menuContent.classList.toggle('hidden');
			});

			const closeMenu = () => {
				if (!menuContent.classList.contains('hidden'))
					menuContent.classList.add('hidden');
			};

			document.addEventListener('click', closeMenu);
		}
		
		const currentLangDisplay = document.getElementById('current-lang-display');
		if (currentLangDisplay) {
			currentLangDisplay.textContent = i18next.language.toUpperCase();
		}
		
		const langButtons = document.querySelectorAll('.lang-select');

		langButtons.forEach(btn => {
			const newBtn = btn.cloneNode(true) as HTMLElement;
			btn.parentNode?.replaceChild(newBtn, btn);

			newBtn.addEventListener('click', async (e) => {
				e.preventDefault();
				e.stopPropagation();

				const lang = (e.currentTarget as HTMLElement).getAttribute('data-lang');
				const currentLang = i18next.language;

				if (lang && lang !== currentLang) {
					console.log("Langue changée vers :", lang);
					await changeLanguage(lang);

					const userId = localStorage.getItem('userId');
					const accessToken = localStorage.getItem('accessToken');
					
					if (userId && accessToken) {
						try {
							const response = await fetch(`/api/user/${userId}/language`, {
								method: 'PATCH',
								headers: {
									'Content-Type': 'application/json',
									'Authorization': `Bearer ${accessToken}`
								},
								credentials: 'include',
								body: JSON.stringify({ language: lang })
							});
							if (!response.ok)
								console.error("Error during the modification of the language");
						} catch (error) {
							console.error("Error during update of preffered language");
						}
					}

					handleLocationChange();

					const display = document.getElementById('current-lang-display');
					if (display) {
						display.textContent = lang.toUpperCase();
					}
					
					const menuContent = document.getElementById('lang-menu-content');
					
					if (menuContent) {
						menuContent.classList.add('hidden');
					}
				}	
			});
		});
	};
	
	const currentStatus = localStorage.getItem('userStatus') || 'available';
	const statusText = document.getElementById('current-status-text');
	if (statusText) {
		statusText.textContent = `(${i18next.t(`profile.status.${currentStatus}`)})`;
	}

	const langDropdownHtml = `
		<div class="relative" id="lang-dropdown">
			<button id="lang-toggle-btn" class="flex items-center gap-2 text-white hover:text-blue-100 transition-colors focus:outline-none rounded-full px-3 py-1 bg-white/10 backdrop-blur-sm">
				<span class="text-lg">🌐</span>
				<span id="current-lang-display" class="uppercase text-xs font-bold tracking-wider">${i18next.language.toUpperCase()}</span>
				<span class="text-[10px] opacity-70">▼</span>
			</button>
			
			<div id="lang-menu-content" class="hidden absolute right-0 mt-2 w-32 bg-white rounded-md shadow-xl py-1 z-50 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in duration-200 origin-top-right">
				<button class="lang-select flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 gap-2" data-lang="en">
					<span>🇬🇧</span> English
				</button>
				<button class="lang-select flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 gap-2" data-lang="fr">
					<span>🇫🇷</span> Français
				</button>
				<button class="lang-select flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 gap-2" data-lang="es">
					<span>🇪🇸</span> Español
				</button>
			</div>
		</div>
	`;


	const navbar = document.getElementById('main-navbar');

	const userMenuHtml = `
		<a href="/home" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="homepage.nav.home">homepage.nav.home</a>
		<a href="/profile" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="homepage.nav.profile">homepage.nav.profile</a>
		<a href="/dashboard" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="homepage.nav.dashboard">homepage.nav.dashboard</a>
		<a href="/logout" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="homepage.nav.logout">homepage.nav.logout</a>
		${langDropdownHtml}
	`;
	
	const guestMenuHtml = `
		<a href="/guest" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="homepage.nav.guest_area">homepage.nav.guest_area</a>
		<a href="/logout" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="homepage.nav.logout">homepage.nav.logout</a>
		${langDropdownHtml}
	`;

	if (navbar) {
		if (isGuest || accessToken) {
			navbar.style.display = 'flex';
			navbar.classList.add('justify-between', 'items-center', 'px-8'); 
			
			const currentHTML = navbar.innerHTML;
			const targetHTML = isGuest ? guestMenuHtml : userMenuHtml;
			const isCurrentGuest = currentHTML.includes('href="/guest"');

			if ((isGuest && !isCurrentGuest) || (!isGuest && isCurrentGuest) || !currentHTML.includes('lang-dropdown')) {
				navbar.innerHTML = targetHTML;
				setupLangDropdown();
			}
			translateNavElements();
		} 
		else {
			navbar.style.display = 'none';
		}
	}

	//================================================
	//================ PAGE RENDERING ================
	//================================================
	
	const page = routes[path] || routes['/404'];
	appElement.innerHTML = page.render();

	if (page.afterRender) {
		page.afterRender();
	}
	if (publicRoutes.includes(path) || isGuest)
		applyTheme('basic');
	else {
		const savedTheme = localStorage.getItem('userTheme') || 'basic';
		applyTheme(savedTheme);
	}
	if (path === '/guest' && !isGuest) {
		window.history.replaceState({}, '', '/'); 
		handleLocationChange();
	}
};


	//================================================
	//============ ROUTEUR INITIALISATION ============
	//================================================

window.addEventListener('click', (event) => {
	
	const target = event.target as HTMLElement;
	const anchor = target.closest('a');

	if (anchor && anchor.href.startsWith(window.location.origin)) {

		event.preventDefault();
		if (isGameRunning()) {
			event.stopImmediatePropagation();
			const destinationPath = new URL(anchor.href).pathname;
			showExitConfirmationModal(destinationPath);
			return ;
		}

		const href = anchor.href;
		
		if (href === window.location.href) {
			return;
		}
		
		window.history.pushState({}, '', href);
		handleLocationChange();
	}
});

window.addEventListener('popstate', () => {
	if (isGameRunning()) {
		window.history.pushState(null, '', '/game');
		showExitConfirmationModal();
		return ;
	}
	handleLocationChange();
});

document.addEventListener('DOMContentLoaded', async () => {

	await initI18n();
	await loadUserLanguageFromDB();
	handleLocationChange();
});
