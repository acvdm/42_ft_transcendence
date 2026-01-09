import htmlContent from "./GuestPage.html";
import { Chat } from "../components/Chat";


// on va exportrter une fonction qui renvoie du html 
export function render(): string {
    return htmlContent;
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
            handleNavigation('/game', { gameMode: 'local' });
        });
    } else {
        console.log("Error: Button local-game cannot be found in the DOM");
    }

    if (remoteButton) {
        remoteButton.addEventListener('click', () => {
            console.log("Remote game starting");
            handleNavigation('/game', { gameMode: 'remote' });
        });
    } else {
        console.log("Error: Button remote-game cannot be found in the DOM");
    }


    if (tournamentButton) {
        tournamentButton.addEventListener('click', () => {
            console.log("Tournament game starting");
            handleNavigation('/game', { gameMode: 'tournament' });
        });
    } else {
        console.log("Error: Button tournament-game cannot be found in the DOM");
    }

    try {
        // pour la partie chat/notifcations
        const guestChat = new Chat();
        guestChat.init();
        guestChat.joinChannel("general_guest");
        guestChat.addSystemMessage("Welcome to Guest Mode. Select a game mode to start chatting with your opponents.")
    } catch (e) {
        console.error("Error charging chat:", e);
    }

}