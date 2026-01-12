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

/* translations */
import { initI18n } from "./i18n";
import i18next from "./i18n";

const appElement = document.getElementById('app');

interface Page {
	render: () => string;
	afterRender?: () => void;
}

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
        render: GamePage, // La fonction HTML
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


const getAccessToken = (): string | null => {
	return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
};

const isGuestUser = (): boolean => {
	return sessionStorage.getItem('userRole') === 'guest';
}

// gestion du logout
const handleLogout = async () => {

	try {
		// appel au backend
		await fetch('/api/auth/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			// force l'envoi du cookie HttpOnly au serveur
			credentials: 'include',
			body: JSON.stringify({}) // force le format JSON
		});

		console.log("Deconnection from the backend server succeed");
	} catch (error) {
		console.error("Error during the deconnection from the server: ", error);
	} finally {
		// on nettoie le client
		SocketService.getInstance().disconnectAll();
		localStorage.removeItem('accessToken');
		localStorage.removeItem('userId');
		localStorage.removeItem('username');
		localStorage.removeItem('userStatus');
		sessionStorage.clear(); // faustine: faut le mettre ailleurs pour gérer le guest
	
		// redirection vers la page d'accueil
		window.history.pushState({}, '', '/');
		// manuellement chargement pour recharger la vue
		const popStateEvent = new PopStateEvent('popstate');
		window.dispatchEvent(popStateEvent);
	}
}

// faustine
// on clean la guest session pour ne pas avoir de persistance
const clearGuestSession = () => {
	
	SocketService.getInstance().disconnectAll();
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('isGuest');
};



/*
** On créé une fonction va lire l'URL, et trouver le contenu HTML correspond dans les routes qu'on a défini plus haut
** Une fois trouvée, il injecte le contenu dans la div app
** Fonction fléchée qui mets à jour le DOM (page html affichée) en fonction de l'URL courant -> pour les SPA
*/
// appElement est un element DOM. est-ce que appElement est nul?
// window est un objet global cote navigateur -> represente la fenetre du navigateur
// donc window.location contient l'url actuelle. Pathname est la partie du chemin d'apres le nom d'hote -> localhost/game/
// on stocke ce chemin dans la constate oaht
// routes est un objet qui mappe des chemins vers des morceaux de html. il va tenter de recuperer la valeur pour la clé path -> on utilise renderpage pour trouver la fonction corresponde a la page qu'on souhaite 
// appElement est l'élément DOM où tu veux afficher le contenu (par ex. <div id="app"></div>).
// .innerHTML remplace le HTML intérieur de cet élément par la chaîne html.


const handleLocationChange = () => {
	if (!appElement) return;

	let path = window.location.pathname;
	
	// faustine
	if ((path === '/' || path === '/login' || path === '/register') && sessionStorage.getItem('isGuest') === 'true') {
        clearGuestSession();
    } // pour clean la session guest
	// Récupération des tokens (User normal OU Guest)
	const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
	const isGuest = sessionStorage.getItem('isGuest') === 'true';

	// si le jeu est en train de tourner mais que l'url n'est pas game
	if (isGameRunning() && path !== '/game') cleanup(); // on arrete le jeu et activegame devient nul

	if (path === '/logout') {
		handleLogout();
		return; // On arrête tout ici pour laisser le logout se faire
	}


	/////////////// NAVBAR 

    const navbar = document.getElementById('main-navbar');
	const currentLang = i18next.language; // on recupere la langue actuelle
    
    // nouvelle définition des menus
    // const userMenuHtml = `
    //     <a href="/home" class="text-white hover:underline">Home</a>
    //     <a href="/profile" class="text-white hover:underline">Profile</a>
    //     <a href="/dashboard" class="text-white hover:underline">Dashboard</a>
    //     <a href="/logout" class="text-white hover:underline">Log out</a>
    // `;

    // const guestMenuHtml = `
    //     <a href="/guest" class="text-white hover:underline">Guest Area</a>
    //     <a href="/logout" class="text-white hover:underline">Log out</a>
    // `;

	const userMenuHtml = `
        <a href="/home" class="text-white hover:underline">${i18next.t('nav.home')}</a>
        <a href="/profile" class="text-white hover:underline">${i18next.t('nav.profile')}</a>
        <a href="/dashboard" class="text-white hover:underline">${i18next.t('nav.dashboard')}</a>
        <a href="/logout" class="text-white hover:underline">${i18next.t('nav.logout')}</a>

		<div id="language-switcher" class="flex gap-2 items-center ml-4">
		<button data-lang="en" class="lang-btn bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">EN</button>
		<button data-lang="fr" class="lang-btn bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">FR</button>
		<button data-lang="es" class="lang-btn bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">ES</button>
		</div>
    `;
	
    const guestMenuHtml = `
        <a href="/guest" class="text-white hover:underline">${i18next.t('nav.guest_area')}</a>
        <a href="/logout" class="text-white hover:underline">${i18next.t('nav.logout')}</a>
    `;

    if (navbar) {
		// on recupere letat actuel de la navBar
		const activeMenu = navbar.getAttribute('data-menu');
		const activeLang = navbar.getAttribute('data-lang');

		console.log("🔍 Navbar trouvée");
    	console.log("🔍 accessToken:", accessToken ? "OUI" : "NON");
    	console.log("🔍 isGuest:", isGuest);
    	console.log("🔍 activeMenu:", activeMenu);
    	console.log("🔍 activeLang:", activeLang);
    	console.log("🔍 currentLang:", currentLang);

        if (isGuest) {
            navbar.style.display = 'flex'; // pour le guest on affiche quand meme la navbar personnalisée
            // MODIFICATION POUR LA TRAD -> TEXTE EN BRUT ENLEVE
            if (activeMenu !== 'guest' || activeLang !== currentLang) {    
				navbar.innerHTML = guestMenuHtml;

				// on met a jour l'etat
				navbar.setAttribute('data-menu', 'guest');
				navbar.setAttribute('data-lang', currentLang);
            }
        } 
        else if (accessToken) {
            navbar.style.display = 'flex'; // navbar pour le user
			navbar.classList.add('justify-between');

            // MODIFICATION POUR LA TRAD -> TEXTE EN BRUT ENLEVE
            if (activeMenu !== 'user' || activeLang !== currentLang) { // 
                navbar.innerHTML = userMenuHtml;

				// on met a jour l'etat
				navbar.setAttribute('data-menu', 'user');
				navbar.setAttribute('data-lang', currentLang);
			}

			// ecouteurs d'evenements
			const langButtons = document.querySelectorAll('.lang-btn');
			langButtons.forEach(btn => {
				// retirer les anciens listener avant dajouter
				// const newBtn = btn.cloneNode(true) as HTMLElement;
				// btn.parentNode?.replaceChild(newBtn, btn);
				btn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					const target = e.currentTarget as HTMLElement;
					const lang = target.getAttribute('data-lang');
					
					if (lang && lang !== currentLang) {
						console.log(`Changement de langue vers: ${lang}`);
						localStorage.setItem('preferedLanguage', lang);
						i18next.changeLanguage(lang);
					}
				});
			});

        } 
        else {
            navbar.style.display = 'none'; // si pas connecte2 --> on cache tout
			// on met a jour l'etat
			navbar.removeAttribute('data-menu');
			navbar.removeAttribute('data-lang');
        }
    }
	
	///////// AFFICHAGE DE LA PAGE 
	
	const page = routes[path] || routes['/404'];
	appElement.innerHTML = page.render();

	if (page.afterRender) {
		page.afterRender();
	}

	// Gestion du thème
	if (publicRoutes.includes(path) || isGuest)
		applyTheme('basic');
	else {
		const savedTheme = localStorage.getItem('userTheme') || 'basic';
		applyTheme(savedTheme);
	}

	if (path === '/guest' && !isGuest) {
        // On redirige vers l'accueil pour se faire éjecter par la sécurité
        window.history.replaceState({}, '', '/'); 
        handleLocationChange();
    }
};
/*
** Fonction pour la navigation. Elle met à jour l'url dans recharger la page
** Appelé quand on clique sur un lien
** @param event = l'événement de clic
*/

const navigate = (event : MouseEvent) => {
	event.preventDefault(); //on empeche le navigateur de recharger la page
	const target = event.target as HTMLAnchorElement; // cible du clic (lien <a>)

	// si on clique sur la page des active alors on ne touche a rien
	if (target.href == window.location.href)
		return;

	window.history.pushState({}, '', target.href); // mis a jour de l'url dans la barre de recherche
	handleLocationChange(); // on charge le contenu de la nouvelle page avec la fonction faite plus haut
};

// ---------- Initialisation du routeur ----------

// 1. gestion des clics sur toutes les liens <a> de la page
window.addEventListener('click', (event) => {
	
	const target = event.target as HTMLElement;
	const anchor = target.closest('a');
	// on va verifier si la cible est un lien interne

	if (anchor && anchor.href.startsWith(window.location.origin)) {
		// On convertit l'event original pour notre fonction navigate
        // (Astuce: on passe l'event, et dans navigate on récupère la cible via l'event)
        // Note: Ici on simplifie l'appel en passant l'event original
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

		// pourquoi faire ça?
	}
});

// 2. Gestion des contenus suivant/precedent
window.addEventListener('popstate', () => {
	if (isGameRunning()) {
		window.history.pushState(null, '', '/game');
		showExitConfirmationModal();
		return ;
	}
	handleLocationChange();
});

// 3. Charge le contenu de la page initiale au premier chargement
document.addEventListener('DOMContentLoaded', () => {
	handleLocationChange();
});
