import htmlContentLocal from "../pages/LocalGame.html";
import htmlContentRemote from "../pages/RemoteGame.html";
import htmlContentTournament from "../pages/TournamentPage.html";
import { fetchWithAuth } from "../services/api";
import { Chat } from "../components/Chat";
import SocketService from '../services/SocketService';
import { applyTheme } from "../controllers/ProfilePage";
import Game from "../game/Game";
import { LocalGameManager } from "../components/game/LocalGameManager";
import { RemoteGameManager } from "../components/game/RemoteGameManager";
import { TournamentManager } from "../components/game/TournamentManager";
import { showVictoryModal, launchConfetti } from "../components/game/GameUI";

let gameChat: Chat | null = null;
let activeGame: Game | null = null;
let spaceKeyListener: ((e: KeyboardEvent) => void) | null = null;
let isNavigationBlocked = false;

export function isGameRunning(): boolean {
    return activeGame !== null && activeGame.isRunning;
}

//================================================
//============ RETRIEVE PLAYER ALIAS =============
//================================================

export async function getPlayerAlias(): Promise<string> {
    const cachedAlias = sessionStorage.getItem('cachedAlias');
    if (cachedAlias) {
        return cachedAlias;
    }

    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const isGuest = sessionStorage.getItem('userRole') === 'guest';
    
    if (!userId) {
        return "Player";
    }
    
    try {
        const response = await fetchWithAuth(`api/user/${userId}`);
        if (response.ok) {
            const userData = await response.json();
            const alias = userData.alias || (isGuest ? "Guest" : "Player");
            sessionStorage.setItem('cachedAlias', alias);
            return userData.alias || (isGuest ? "Guest" : "Player");
        }
    } catch (err) {
        console.error('Cannot fetch player alias:', err);
    }

    const result = sessionStorage.getItem('username') || (isGuest ? "Guest" : "Player");
    return (result);
}


// est-ce que j'en ai encore besoin?
function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (isGameRunning()) {
        e.preventDefault();
        e.returnValue = 'A game is in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
}

function handlePopState(e: PopStateEvent) {
    if (isGameRunning() && !isNavigationBlocked) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.history.pushState({ gameMode: window.history.state?.gameMode || 'local' }, '', '/game');
        showExitConfirmationModal();
    }
}


//================================================
//=========== EXIT GAME CONFIRMATION =============
//================================================

export function showExitConfirmationModal() {
    if (document.getElementById('exit-confirm-modal')) {
        return;
    }

    if (activeGame) {
        activeGame.pause();
    }

    const modalHtml = `
        <div id="exit-confirm-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" style="position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center;">
            
            <div class="window w-[600px] bg-white shadow-2xl animate-bounce-in">
                
                <div class="title-bar">
                    <div class="title-bar-text text-white" style="text-shadow: none;">Exit Game</div>
                    <div class="title-bar-controls">
                        <button aria-label="Close" id="modal-close-x"></button>
                    </div>
                </div>

                <div class="window-body bg-gray-100 p-8 flex flex-col items-center gap-8" style="min-height: auto;">
                    
                    <h2 class="text-3xl font-black text-black text-center tracking-wide" style="text-shadow: 1px 1px 0px white;">
                        WAIT A MINUTE !
                    </h2>
                    
                    <div class="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-lg w-full">
                        <p class="text-2xl font-bold text-gray-800 text-center">Are you sure you want to leave?</p>
                        <p class="text-sm text-red-500 font-semibold italic text-center">All current progress will be lost.</p>
                    </div>

                    <div class="flex gap-6 w-full justify-center">
                        
                        <button id="cancel-exit-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                                                px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 
                                                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
                                                                transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">
                            GO BACK TO GAME
                        </button>
                        
                        <button id="confirm-exit-btn" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-6 py-4 text-base font-semibold shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all duration-200 hover:shadow-md" style="width: 200px; padding: 4px;">
                            LEAVE
                        </button>
                    </div>

                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    document.getElementById('confirm-exit-btn')?.addEventListener('click', () => {
        confirmExit();
    });
    
    const closeFunc = () => {
        document.getElementById('exit-confirm-modal')?.remove();

        if (activeGame) {
            activeGame.resume();
        }
    }

    document.getElementById('cancel-exit-btn')?.addEventListener('click', closeFunc);
    document.getElementById('modal-close-x')?.addEventListener('click', closeFunc);
}


//================================================
//================ CONFIRM EXIT ==================
//================================================

function confirmExit() {
    isNavigationBlocked = true;
    
    if (activeGame) {
        const wasRemote = activeGame.isRemote;
        const roomId = activeGame.roomId;
        const playerRole = activeGame.playerRole;
        //const currentScore = { ...activeGame.score };

        activeGame.isRunning = false;
        activeGame.stop();

        if (wasRemote && roomId && SocketService.getInstance().getGameSocket()) {
            SocketService.getInstance().getGameSocket()?.emit('leaveGame', { roomId: roomId });
            
            const userIdStr = localStorage.getItem('userId');
            if (userIdStr && playerRole) {
                // Pour la sauvegarde stats, on pourrait appeler une fonction dans remoteManager, mais c'est ok de laisser la déconnexion "brutale" ici
            }
        }
        activeGame = null;
    }
    
    cleanup();
    document.getElementById('exit-confirm-modal')?.remove();
    
    setTimeout(() => {
        isNavigationBlocked = false;
        window.history.back();
    }, 100);
}

//================================================
//=================== CLEANING ===================
//================================================

export function cleanup() {
    
    if (gameChat) {
        gameChat.destroy();
        gameChat = null;
    }

    if (activeGame) {
        activeGame.isRunning = false;
        activeGame.stop();
        activeGame = null;
    }

    if (spaceKeyListener) {
        document.removeEventListener('keydown', spaceKeyListener);
        spaceKeyListener = null;
    }

    document.getElementById('countdown-modal')?.remove();
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('popstate', handlePopState);
    isNavigationBlocked = false;
}

export function render(): string {
    const state = window.history.state;
    if (state && state.gameMode === 'remote') {
        return htmlContentRemote;
    } else if (state && state.gameMode === 'tournament') {
        return htmlContentTournament;
    }
    return htmlContentLocal;
}

//================================================
//============= MAIN GAME FUNCTION ===============
//================================================

export function initGamePage(mode: string): void {

    const currentTheme = localStorage.getItem('userTheme') || 'basic';
    applyTheme(currentTheme);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    const player1Display = document.getElementById('player-1-name') as HTMLElement;

    if (player1Display) {
        getPlayerAlias().then(alias => {
            player1Display.innerText = alias;
        });
    }

    if (gameChat) {
        gameChat.destroy();
    }
    gameChat = new Chat();
    gameChat.init();

    const gameContext = {
        setGame: (game: Game | null) => { activeGame = game; },
        getGame: () => activeGame,
        chat: gameChat
    };

    if (mode == 'remote') {
        const privateRoomId = sessionStorage.getItem('privateGameId');
        if (privateRoomId) {
            gameChat.joinChannel(`private_wait_${privateRoomId}`);
            
        } else {
            gameChat.joinChannel("remote_game_room");
        }
        const remoteManager = new RemoteGameManager(gameContext);
        remoteManager.init();

    } else if (mode == 'tournament') {
        gameChat.joinChannel("tournament_room");
        const tournamentManager = new TournamentManager(gameContext);
        tournamentManager.init();

    } else {
        gameChat.joinChannel("local_game_room");
        const localManager = new LocalGameManager(gameContext);
        localManager.init();
    }


//================================================
//========= UNSETTLE OPPONENT WITH WIZZ ==========
//================================================

    if (spaceKeyListener) {
        document.removeEventListener('keydown', spaceKeyListener);
    }

    spaceKeyListener = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.key === ' ') {
            const target = e.target as HTMLElement;

            // FAUSTINE: est-ce qu'on modifie ici? a ca permet de pas envoyer de wizz si on est dans la zone de chat
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }
            if (!activeGame || !activeGame.isRunning) {
                return;
            }
            e.preventDefault();

            if (gameChat) {
                if (activeGame.isRemote) {
                    gameChat.emitWizzOnly();
                } else {
                    const wizzContainer = document.getElementById('wizz-container');
                    gameChat.shakeElement(wizzContainer);
                }
            }
        }
    };
    document.addEventListener('keydown', spaceKeyListener);
}