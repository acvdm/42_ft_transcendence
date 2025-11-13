// j'importe mes composants c'est a dire les autres fonctions crees qui appelle du html
import { LoginPage, authEvents } from "./pages/LoginPage"; // j'importe les fonctions que je veux utiliser dans le fichier x
//import { HomePage } from "./pages/HomePage"
import { ProfilPage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFound";

// 1. C'est l'élément principal où le contenu des 'pages' sera injecté
const appElement = document.getElementById('app');

// 2. ON defini a quoi ressemble une page -> fonction qui donne le html (render) et une fonction qui lance la logique de la page?
interface Page {
	render: () => string;
	afterRender?: () => void;
}



// 3. On va définir nos pages ici, on reste pour le moment sur du HTML simple avant de réaliser les pages de base
// Une fois qu'on aura fait les pages de base, on sera en mesure de link vers les bonnes pages
// on associe chaque route a l'affiche et a la fonction concernée pour faire fonctionner la page
const routes: { [key: string]: Page } = {
	'/': {
		render: ProfilPage,
		afterRender: () => console.log('HomePage chargée')
	},
	'/profile': {
		render: ProfilPage,
		afterRender: () => console.log('Profil page chargée -> modifications de la page de profil, photo etc')
	},
	'/logout': {
		render: LoginPage,
		afterRender: authEvents
	},
	'/404': {
		render: NotFoundPage
	}
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

	const path = window.location.pathname;
	const page = routes[path] || routes['/404']; // html = routes.count(path) ? route[path] : route[/404]
	appElement.innerHTML = page.render(); // on injecte le html

	// on lance la logique js pour faire vivre la page
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
		navigate(event as unknown as MouseEvent);
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

