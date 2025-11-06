// j'importe mes composants c'est a dire les autres fonctions crees qui appelle du html
import { HomePage } from "./pages/HomePage";
import { ProfilPage } from "./pages/ProfilePage";
import { GamePage } from "./pages/GamePage";
import { NotFoundPage } from "./pages/NotFound";

// 1. C'est l'élément principal où le contenu des 'pages' sera injecté
const appElement = document.getElementById('app');

// 2. On va définir nos pages ici, on reste pour le moment sur du HTML simple avant de réaliser les pages de base
// Une fois qu'on aura fait les pages de base, on sera en mesure de link vers les bonnes pages
const routes: { [key: string]: () => string } = {
	'/': HomePage,
	'/profile': ProfilPage,
	'/game': GamePage,
	'/404': NotFoundPage
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
	const renderPage = routes[path] || routes['/404']; // html = routes.count(path) ? route[path] : route[/404]
	appElement.innerHTML = renderPage();
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
	// on va verifier si la cible est un lien interne
	if (event.target instanceof HTMLAnchorElement && event.target.href.startsWith(window.location.origin)) {
		navigate(event);
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

