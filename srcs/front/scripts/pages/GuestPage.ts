import htmlContent from "./GuestPage.html";


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
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    localButton?.addEventListener('click', () => {
        console.log("Local game starting");
        handleNavigation('/game', { gameMode: 'local' });
    });

    remoteButton?.addEventListener('click', () => {
        console.log("Remote game starting");
        handleNavigation('/game', { gameMode: 'remote' });
    });

    tournamentButton?.addEventListener('click', () => {
        console.log("Tournament game starting");
        handleNavigation('/game', { gameMode: 'tournament' });
    });
}