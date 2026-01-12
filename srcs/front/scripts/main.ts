import { render as LoginPage, loginEvents } from "./controllers/LoginPage"; 
import { render as HomePage, afterRender as HomePageAfterRender } from "./controllers/HomePage";
import { render as ProfilePage, afterRender as ProfilePageAfterRender } from "./controllers/ProfilePage";
import { NotFoundPage } from "./pages/NotFound"; // Celui-ci semble correct s'il est resté dans pages/
import { render as LandingPage, initLandingPage } from "./controllers/LandingPage";
import { render as RegisterPage, registerEvents } from "./controllers/RegisterPage";
import { render as GuestPage, afterRender as GuestAfterRender } from "./controllers/GuestPage";
import { applyTheme } from "./controllers/ProfilePage";
import { render as GamePage, initGamePage, isGameRunning, cleanup, showExitConfirmationModal } from "./controllers/GamePage";
import { render as DashboardPage, afterRender as DashboardPageAfterRender } from "./controllers/DashboardPage";
import SocketService from "./services/SocketService";

const appElement = document.getElementById('app');

interface Page {
	render: () => string;
	afterRender?: () => void;
}

	//================================================
	//==================== ROUTES ====================
	//================================================

const publicRoutes = ['/', '/login', '/register', '/404', '/guest'];

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
			const state = window.history.state;
			const mode = state && state.gameMode ? state.gameMode : 'local';
			initGamePage(mode);
		}
    },
	'/404': {
		render: NotFoundPage
	}
};


// const getAccessToken = (): string | null => {
// 	return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
// };

// const isGuestUser = (): boolean => {
// 	return sessionStorage.getItem('userRole') === 'guest';
// }

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
	//================ CHANGING PAGE =================
	//================================================

const handleLocationChange = () => {
    if (!appElement) return;

    let path = window.location.pathname;
    
    // Cleaning guest session
    if ((path === '/' || path === '/login' || path === '/register') && sessionStorage.getItem('isGuest') === 'true') {
        clearGuestSession();
    } 
    
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const isGuest = sessionStorage.getItem('isGuest') === 'true';

    if (isGameRunning() && path !== '/game') {
		cleanup();
	}
    if (path === '/logout') {
        handleLogout();
        return; 
    }

	//================================================
	//============= NAVIGATION BAR LOGIC =============
	//================================================

    const setupLangDropdown = () => {
        const toggleBtn = document.getElementById('lang-toggle-btn');
        const menuContent = document.getElementById('lang-menu-content');
        //const currentLangDisplay = document.getElementById('current-lang-display');
        
        // Opening and closing of lang menu
        if (toggleBtn && menuContent) {
            const newToggle = toggleBtn.cloneNode(true) as HTMLElement;
            toggleBtn.parentNode?.replaceChild(newToggle, toggleBtn);

            newToggle.addEventListener('click', (e) => {
                e.stopPropagation(); 
                menuContent.classList.toggle('hidden');
            });

            window.addEventListener('click', () => {
                if (!menuContent.classList.contains('hidden')) {
                    menuContent.classList.add('hidden');
                }
            });
        }

        // Choose langage
        document.querySelectorAll('.lang-select').forEach(btn => {
            const newBtn = btn.cloneNode(true); 
            btn.parentNode?.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const lang = target.getAttribute('data-lang');
                if (lang) {
                    console.log("Langue changée vers :", lang);
                    
                    const display = document.getElementById('current-lang-display');
                    if (display) display.textContent = lang.toUpperCase();
                }
            });
        });
    };
    
    // Dropdown HTML
    const langDropdownHtml = `
        <div class="relative" id="lang-dropdown">
            <button id="lang-toggle-btn" class="flex items-center gap-2 text-white hover:text-blue-100 transition-colors focus:outline-none rounded-full px-3 py-1 bg-white/10 backdrop-blur-sm">
                <span class="text-lg">🌐</span>
                <span id="current-lang-display" class="uppercase text-xs font-bold tracking-wider">EN</span>
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
        <a href="/home" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="nav_home">Home</a>
        <a href="/profile" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="nav_profile">Profile</a>
        <a href="/dashboard" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="nav_dashboard">Dashboard</a>
        <a href="/logout" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="nav_logout">Log out</a>
        ${langDropdownHtml}
    `;

    const guestMenuHtml = `
        <a href="/guest" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="nav_guest">Guest Area</a>
        <a href="/logout" class="text-white hover:underline hover:text-blue-100 transition-colors font-medium" data-i18n="nav_logout">Log out</a>
        ${langDropdownHtml}
    `;

    if (navbar) {
        if (isGuest || accessToken) {
            navbar.style.display = 'flex';
            navbar.classList.add('justify-between', 'items-center', 'px-8'); 
            
            const currentHTML = navbar.innerHTML;
            const targetHTML = isGuest ? guestMenuHtml : userMenuHtml;
            //const isTargetGuest = targetHTML.includes('Guest Area');
            const isCurrentGuest = currentHTML.includes('Guest Area');

            if ((isGuest && !isCurrentGuest) || (!isGuest && isCurrentGuest) || !currentHTML.includes('lang-dropdown')) {
                navbar.innerHTML = targetHTML;
                setupLangDropdown();
            }
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


/*
** Fonction pour la navigation. Elle met à jour l'url dans recharger la page
** Appelé quand on clique sur un lien
** @param event = l'événement de clic
*/

// const navigate = (event : MouseEvent) => {
// 	event.preventDefault(); //on empeche le navigateur de recharger la page
// 	const target = event.target as HTMLAnchorElement; // cible du clic (lien <a>)

// 	// si on clique sur la page des active alors on ne touche a rien
// 	if (target.href == window.location.href)
// 		return;

// 	window.history.pushState({}, '', target.href); // mis a jour de l'url dans la barre de recherche
// 	handleLocationChange(); // on charge le contenu de la nouvelle page avec la fonction faite plus haut
// };

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
			showExitConfirmationModal();
			return ;
		}

        const href = anchor.href;
        
        if (href === window.location.href) return;
        
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

document.addEventListener('DOMContentLoaded', () => {
	handleLocationChange();
});
