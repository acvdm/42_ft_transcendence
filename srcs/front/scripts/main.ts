// j'importe mes composants c'est a dire les autres fonctions crees qui appelle du html
import { render as LoginPage, loginEvents } from "./pages/LoginPage"; // j'importe les fonctions que je veux utiliser dans le fichier x
import { render as HomePage, afterRender as HomePageAfterRender } from "./pages/HomePage"
import { render as ProfilePage, afterRender as ProfilePageAfterRender } from "./pages/ProfilePage"
import { NotFoundPage } from "./pages/NotFound";
import { LandingPage, initLandingPage } from "./pages/LandingPage";
import { RegisterPage, registerEvents } from "./pages/RegisterPage";

// 1. C'est l'élément principal où le contenu des 'pages' sera injecté
const appElement = document.getElementById('app');

// 2. ON defini a quoi ressemble une page -> fonction qui donne le html (render) et une fonction qui lance la logique de la page?
interface Page {
	render: () => string;
	afterRender?: () => void;
}

const publicRoutes = ['/', '/login', '/register', '/404'];


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
	'/404': {
		render: NotFoundPage
	}
};

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


const handleLocationChange = () => {
	if (!appElement) return;

    let path = window.location.pathname; // difference const / let
    const accessToken = localStorage.getItem('accessToken');

    // gestion de la route d deconnexion
    if (path === '/logout') {
        handleLogout();
        return;
    }
	// si user connecter -> et que tentative d'aller sur login etc -> redirection home
    if (accessToken && (path === '/' || path === '/login' || path === '/register')) {
        window.history.pushState({}, '', '/home');
        path = '/home';
    }

	// si pas connecte alors redirection landing page
    if (!accessToken && !publicRoutes.includes(path)) {
        window.history.pushState({}, '', '/');
        path = '/';
    }

	// on affiche la page
    const page = routes[path] || routes['/404'];
    appElement.innerHTML = page.render();

    if (page.afterRender) {
        page.afterRender();
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

