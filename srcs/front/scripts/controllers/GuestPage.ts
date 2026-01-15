import htmlContent from "../pages/GuestPage.html";
import { Chat } from "../components/Chat";
import i18next from "../i18n";

export function render(): string {
    let html = htmlContent;

    html = html.replace(/\{\{guestPage\.title_window\}\}/g, i18next.t('guestPage.title'));
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

    const handleNavigation = (path: string, state: any = {}) => {
        window.history.pushState(state, '', path);
        const navEvent = new PopStateEvent('popstate', { state: state });
        window.dispatchEvent(navEvent);
    };

    if (localButton) {
        localButton.addEventListener('click', () => {
            console.log("Local game starting");
            sessionStorage.setItem('activeGameMode', 'local');
            handleNavigation('/game', { gameMode: 'local' });
        });
    } else {
        console.log("Error: Button local-game cannot be found in the DOM");
    }

    if (remoteButton) {
        remoteButton.addEventListener('click', () => {
            console.log("Remote game starting");
            sessionStorage.setItem('activeGameMode', 'remote');
            handleNavigation('/game', { gameMode: 'remote' });
        });
    } else {
        console.log("Error: Button remote-game cannot be found in the DOM");
    }


    if (tournamentButton) {
        tournamentButton.addEventListener('click', () => {
            console.log("Tournament game starting");
            sessionStorage.setItem('activeGameMode', 'tournament');
            handleNavigation('/game', { gameMode: 'tournament' });
        });
    } else {
        console.log("Error: Button tournament-game cannot be found in the DOM");
    }

    // Adding a message in the notification chat
    try {
        const guestChat = new Chat();
        guestChat.init();
        guestChat.joinChannel("general_guest");
        guestChat.addSystemMessage(i18next.t('guestPage.chat_welcome'));
    } catch (e) {
        console.error("Error charging chat:", e);
    }

}