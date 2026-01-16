import htmlContent from "../pages/GuestPage.html";
import { Chat } from "../components/Chat";
import i18next from "../i18n";

export function render(): string {
	let html = htmlContent;

	html = html.replace(/\{\{guestPage\.title\}\}/g, i18next.t('guestPage.title'));
	html = html.replace(/\{\{guestPage\.welcome\}\}/g, i18next.t('guestPage.welcome'));
	html = html.replace(/\{\{guestPage\.description\}\}/g, i18next.t('guestPage.description'));
	html = html.replace(/\{\{guestPage\.select_mode\}\}/g, i18next.t('guestPage.select_mode'));
	html = html.replace(/\{\{guestPage\.local\}\}/g, i18next.t('guestPage.local'));
	html = html.replace(/\{\{guestPage\.remote\}\}/g, i18next.t('guestPage.remote'));
	html = html.replace(/\{\{guestPage\.tournament\}\}/g, i18next.t('guestPage.tournament'));

	return html;
}

export function afterRender(): void {

	const localButton = document.getElementById('local-game');
	const remoteButton = document.getElementById('remote-game');
	const tournamentButton = document.getElementById('tournament-game');

	if (localButton) {
		localButton.addEventListener('click', () => {
			window.history.pushState({ gameMode: 'local' }, '', '/game?mode=local');
			const navEvent = new PopStateEvent('popstate');
			window.dispatchEvent(navEvent);
		});
	} else {
		console.log("Error: Button local-game cannot be found in the DOM");
	}

	if (remoteButton) {
		remoteButton.addEventListener('click', () => {
			window.history.pushState({ gameMode: 'remote' }, '', '/game?mode=remote');
			const navEvent = new PopStateEvent('popstate');
			window.dispatchEvent(navEvent);
		});
	} else {
		console.log("Error: Button remote-game cannot be found in the DOM");
	}


	if (tournamentButton) {
		tournamentButton.addEventListener('click', () => {
			window.history.pushState({ gameMode: 'tournament' }, '', '/game?mode=tournament');
			const navEvent = new PopStateEvent('popstate');
			window.dispatchEvent(navEvent);
		});
	} else {
		console.log("Error: Button tournament-game cannot be found in the DOM");
	}

	try {
		const guestChat = new Chat();
		guestChat.init();
		guestChat.joinChannel("general_guest");
		guestChat.addSystemMessage(i18next.t('guestPage.chat_welcome'));
	} catch (e) {
		console.error("Error charging chat:", e);
	}

}