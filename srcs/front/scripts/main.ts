// j'importe mes composants c'est a dire les autres fonctions crees qui appelle du html
import { render as LoginPage, loginEvents } from "./pages/LoginPage"; // j'importe les fonctions que je veux utiliser dans le fichier x
import { render as HomePage, afterRender as HomePageAfterRender } from "./pages/HomePage"
import { render as ProfilePage, afterRender as ProfilePageAfterRender } from "./pages/ProfilePage"
import { NotFoundPage } from "./pages/NotFound";
import { render as LandingPage, initLandingPage } from "./pages/LandingPage";
import { RegisterPage, registerEvents } from "./pages/RegisterPage";
import { render as GuestPage } from "./pages/GuestPage";
import { applyTheme } from "./pages/ProfilePage";
import { render as GamePage, initGamePage, isGameRunning, cleanup } from "./pages/GamePage";

// 1. C'est l'élément principal où le contenu des 'pages' sera injecté
const appElement = document.getElementById('app');

// 2. ON defini a quoi ressemble une page -> fonction qui donne le html (render) et une fonction qui lance la logique de la page?
interface Page {
	render: () => string;
	afterRender?: () => void;
}

const publicRoutes = ['/', '/login', '/register', '/404', '/guest'];


// 3. On va définir nos pages ici, on reste pour le moment sur du HTML simple avant de réaliser les pages de base
// Une fois qu'on aura fait les pages de base, on sera en mesure de link vers les bonnes pages
// on associe chaque route a l'affiche et a la fonction concernée pour faire fonctionner la page
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
	'/register': {
		render: RegisterPage,
		afterRender: registerEvents
	},
	'/login': {
		render: LoginPage,
		afterRender: loginEvents
	},
	'/guest': {
		render: GuestPage
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


// Remplacez votre handleLocationChange par celle-ci :
const handleLocationChange = () => {
	if (!appElement) return;

	let path = window.location.pathname;
	
	// Récupération des tokens (User normal OU Guest)
	const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
	const isGuest = sessionStorage.getItem('isGuest') === 'true';
	const currentPath = window.location.pathname;

	// --- 1. GESTION DU LOGOUT (C'est ça qu'il manquait !) ---
	if (path === '/logout') {
		if (isGameRunning()) {
			window.history.pushState({ gameMode: window.history.state?.gameMode }, '', '/game');
			return ;
		}
		handleLogout();
		return; // On arrête tout ici pour laisser le logout se faire
	}

	if (currentPath === '/game' && path !== '/game' && isGameRunning()) {
        window.history.pushState({ gameMode: window.history.state?.gameMode }, '', '/game');
        return;
    }

    // ✅ AJOUT - Nettoyage si on quitte la page game
    if (currentPath === '/game' && path !== '/game') {
        cleanup();
    }

	// --- 2. GESTION DE LA NAVBAR ---
	const navbar = document.getElementById('main-navbar');
	if (navbar) {
		// On cache la navbar si c'est un Guest
		if (isGuest) {
			navbar.style.display = 'none';
		} else if (accessToken) {
			navbar.style.display = 'flex';
		} else {
			// Optionnel : cacher sur la landing page si vous le souhaitez
			// navbar.style.display = 'none'; 
		}
	}

	// --- 3. SÉCURITÉ ET REDIRECTIONS ---

	// CAS GUEST : Bloquer l'accès à Home et Profile
	if (isGuest) {
		if (path === '/home' || path === '/profile') {
			window.history.pushState({}, '', '/guest');
			path = '/guest';
		}
	}
	// CAS USER CONNECTÉ (Normal) : Bloquer l'accès à Login/Register
	else if (accessToken) {
		if (path === '/' || path === '/login' || path === '/register' || path === '/guest') {
			window.history.pushState({}, '', '/home');
			path = '/home';
		}
	}
	// CAS NON CONNECTÉ : Renvoyer vers l'accueil si page privée
	else if (!publicRoutes.includes(path)) {
		window.history.pushState({}, '', '/');
		path = '/';
	}

	// --- 4. AFFICHAGE DE LA PAGE ---
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
        const href = anchor.href;
        
        if (href === window.location.href) return;
        
        window.history.pushState({}, '', href);
        handleLocationChange();

		// pourquoi faire ça?
	}
});

// 2. Gestion des contenus suivant/precedent
window.addEventListener('popstate', () => {
	handleLocationChange();
});

// 3. Charge le contenu de la page initiale au premier chargement
document.addEventListener('DOMContentLoaded', () => {
	handleLocationChange();
});
