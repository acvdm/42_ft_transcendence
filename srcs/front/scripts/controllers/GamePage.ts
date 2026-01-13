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
import i18next from "../i18n";

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

// Dans srcs/front/scripts/controllers/GamePage.ts

export async function getPlayerAlias(): Promise<string> {

    const isGuest = sessionStorage.getItem('userRole') === 'guest';

    if (isGuest) {
        const cachedAlias = sessionStorage.getItem('cachedAlias');
        if (cachedAlias) {
            return cachedAlias;
        }
    }

    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (!userId) {
        return "Player";
    }
    
    try {
        const response = await fetchWithAuth(`api/user/${userId}`);
        if (response.ok) {
            const userData = await response.json();
            const alias = userData.alias || (isGuest ? "Guest" : "Player");
            
            if (isGuest) {
                sessionStorage.setItem('cachedAlias', alias);
            }
            return alias;
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
    let html = "";

    // 1. SÉLECTION DU TEMPLATE SELON LE MODE
    if (state && state.gameMode === 'remote') {
        html = htmlContentRemote;
    } else if (state && state.gameMode === 'tournament') {
        html = htmlContentTournament;
    } else {
        html = htmlContentLocal;
    }

    // 2. REPLACEMENTS POUR LE MODE REMOTE
    if (state && state.gameMode === 'remote') {
        html = html.replace(/\{\{remotePage\.title\}\}/g, i18next.t('remotePage.title'));
        html = html.replace(/\{\{remotePage\.p1\}\}/g, i18next.t('remotePage.p1'));
        html = html.replace(/\{\{remotePage\.p2\}\}/g, i18next.t('remotePage.p2'));
        html = html.replace(/\{\{remotePage\.start_game\}\}/g, i18next.t('remotePage.start_game'));
        html = html.replace(/\{\{remotePage\.game_instr\}\}/g, i18next.t('remotePage.game_instr'));
        html = html.replace(/\{\{remotePage\.ws\}\}/g, i18next.t('remotePage.ws'));
        html = html.replace(/\{\{remotePage\.up_down\}\}/g, i18next.t('remotePage.up_down'));
        html = html.replace(/\{\{remotePage\.space_bar\}\}/g, i18next.t('remotePage.space_bar'));
        html = html.replace(/\{\{remotePage\.choose_ball\}\}/g, i18next.t('remotePage.choose_ball'));
        html = html.replace(/\{\{remotePage\.select_ball\}\}/g, i18next.t('remotePage.select_ball'));
        html = html.replace(/\{\{remotePage\.choose_bg\}\}/g, i18next.t('remotePage.choose_bg'));
        html = html.replace(/\{\{remotePage\.select_bg\}\}/g, i18next.t('remotePage.select_bg'));
        html = html.replace(/\{\{remotePage\.reset_color\}\}/g, i18next.t('remotePage.reset_color'));
        html = html.replace(/\{\{remotePage\.play\}\}/g, i18next.t('remotePage.play'));
        html = html.replace(/\{\{remotePage\.countdown_title\}\}/g, i18next.t('remotePage.countdown_title'));
        // Remote Summary
        html = html.replace(/\{\{remotePage\.summary_modal\.title\}\}/g, i18next.t('remotePage.summary_modal.title'));
        html = html.replace(/\{\{remotePage\.summary_modal\.congrat\}\}/g, i18next.t('remotePage.summary_modal.congrat'));
        html = html.replace(/\{\{remotePage\.summary_modal\.name\}\}/g, i18next.t('remotePage.summary_modal.name'));
        html = html.replace(/\{\{remotePage\.summary_modal\.back_menu\}\}/g, i18next.t('remotePage.summary_modal.back_menu'));
        // Remote Chat
        html = html.replace(/\{\{remotePage\.chat\.title\}\}/g, i18next.t('remotePage.chat.title'));
        html = html.replace(/\{\{remotePage\.chat\.info\}\}/g, i18next.t('remotePage.chat.info'));
        html = html.replace(/\{\{remotePage\.chat\.choose_bg\}\}/g, i18next.t('remotePage.chat.choose_bg'));
        html = html.replace(/\{\{remotePage\.chat\.default_bg\}\}/g, i18next.t('remotePage.chat.default_bg'));
    } 

    // 3. REPLACEMENTS POUR LE MODE TOURNAMENT
    else if (state && state.gameMode === 'tournament') {
        html = html.replace(/\{\{tournamentPage\.title\}\}/g, i18next.t('tournamentPage.title'));
        html = html.replace(/\{\{tournamentPage\.p1\}\}/g, i18next.t('tournamentPage.p1'));
        html = html.replace(/\{\{tournamentPage\.p2\}\}/g, i18next.t('tournamentPage.p2'));
        // Setup Modal
        html = html.replace(/\{\{tournamentPage\.setup_modal\.title_modal\}\}/g, i18next.t('tournamentPage.setup_modal.title_modal'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.game_instr\}\}/g, i18next.t('tournamentPage.setup_modal.game_instr'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.ws\}\}/g, i18next.t('tournamentPage.setup_modal.ws'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.up_down\}\}/g, i18next.t('tournamentPage.setup_modal.up_down'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.space_bar\}\}/g, i18next.t('tournamentPage.setup_modal.space_bar'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.tournament_name\}\}/g, i18next.t('tournamentPage.setup_modal.tournament_name'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.placeholder_trnmt\}\}/g, i18next.t('tournamentPage.setup_modal.placeholder_trnmt'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.participant\}\}/g, i18next.t('tournamentPage.setup_modal.participant'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.p1\}\}/g, i18next.t('tournamentPage.setup_modal.p1'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.p2\}\}/g, i18next.t('tournamentPage.setup_modal.p2'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.p3\}\}/g, i18next.t('tournamentPage.setup_modal.p3'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.p4\}\}/g, i18next.t('tournamentPage.setup_modal.p4'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.choose__ball_bg\}\}/g, i18next.t('tournamentPage.setup_modal.choose__ball_bg'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.choose__ball\}\}/g, i18next.t('tournamentPage.setup_modal.choose__ball'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.choose_bg\}\}/g, i18next.t('tournamentPage.setup_modal.choose_bg'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.select_bg\}\}/g, i18next.t('tournamentPage.setup_modal.select_bg'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.reset_color\}\}/g, i18next.t('tournamentPage.setup_modal.reset_color'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.play\}\}/g, i18next.t('tournamentPage.setup_modal.play'));
        html = html.replace(/\{\{tournamentPage\.setup_modal\.countdown_title\}\}/g, i18next.t('tournamentPage.setup_modal.countdown_title'));
        // Bracket Modal
        html = html.replace(/\{\{tournamentPage\.tournament_bracket_modal\.title\}\}/g, i18next.t('tournamentPage.tournament_bracket_modal.title'));
        html = html.replace(/\{\{tournamentPage\.tournament_bracket_modal\.heading\}\}/g, i18next.t('tournamentPage.tournament_bracket_modal.heading'));
        html = html.replace(/\{\{tournamentPage\.tournament_bracket_modal\.semi_final_1\}\}/g, i18next.t('tournamentPage.tournament_bracket_modal.semi_final_1'));
        html = html.replace(/\{\{tournamentPage\.tournament_bracket_modal\.semi_final_2\}\}/g, i18next.t('tournamentPage.tournament_bracket_modal.semi_final_2'));
        html = html.replace(/\{\{tournamentPage\.tournament_bracket_modal\.final\}\}/g, i18next.t('tournamentPage.tournament_bracket_modal.final'));
        html = html.replace(/\{\{tournamentPage\.tournament_bracket_modal\.status_ready\}\}/g, i18next.t('tournamentPage.tournament_bracket_modal.status_ready'));
        html = html.replace(/\{\{tournamentPage\.tournament_bracket_modal\.continue_btn\}\}/g, i18next.t('tournamentPage.tournament_bracket_modal.continue_btn'));
        // Next Match Modal
        html = html.replace(/\{\{tournamentPage\.tournament_next_match_modal\.title\}\}/g, i18next.t('tournamentPage.tournament_next_match_modal.title'));
        html = html.replace(/\{\{tournamentPage\.tournament_next_match_modal\.match_title\}\}/g, i18next.t('tournamentPage.tournament_next_match_modal.match_title'));
        html = html.replace(/\{\{tournamentPage\.tournament_next_match_modal\.player_vs\}\}/g, i18next.t('tournamentPage.tournament_next_match_modal.player_vs'));
        html = html.replace(/\{\{tournamentPage\.tournament_next_match_modal\.start_info\}\}/g, i18next.t('tournamentPage.tournament_next_match_modal.start_info'));
        html = html.replace(/\{\{tournamentPage\.tournament_next_match_modal\.play_btn\}\}/g, i18next.t('tournamentPage.tournament_next_match_modal.play_btn'));
        // Summary Modal
        html = html.replace(/\{\{tournamentPage\.tournament_summary_modal\.title\}\}/g, i18next.t('tournamentPage.tournament_summary_modal.title'));
        html = html.replace(/\{\{tournamentPage\.tournament_summary_modal\.congratulations\}\}/g, i18next.t('tournamentPage.tournament_summary_modal.congratulations'));
        html = html.replace(/\{\{tournamentPage\.tournament_summary_modal\.winner_name\}\}/g, i18next.t('tournamentPage.tournament_summary_modal.winner_name'));
        html = html.replace(/\{\{tournamentPage\.tournament_summary_modal\.back_menu\}\}/g, i18next.t('tournamentPage.tournament_summary_modal.back_menu'));
        html = html.replace(/\{\{tournamentPage\.chat\.title\}\}/g, i18next.t('tournamentPage.chat.title'));
        html = html.replace(/\{\{tournamentPage\.chat\.info\}\}/g, i18next.t('tournamentPage.chat.info'));
        html = html.replace(/\{\{tournamentPage\.chat\.placeholder_input\}\}/g, i18next.t('tournamentPage.chat.placeholder_input'));
        
    } 

    // 4. REPLACEMENTS POUR LE MODE LOCAL (PAR DÉFAUT)
    else {
        html = html.replace(/\{\{localPage\.title\}\}/g, i18next.t('localPage.title'));
        html = html.replace(/\{\{localPage\.p1\}\}/g, i18next.t('localPage.p1'));
        html = html.replace(/\{\{localPage\.p2\}\}/g, i18next.t('localPage.p2'));
        html = html.replace(/\{\{localPage\.start_game\}\}/g, i18next.t('localPage.start_game'));
        html = html.replace(/\{\{localPage\.game_instr\}\}/g, i18next.t('localPage.game_instr'));
        html = html.replace(/\{\{localPage\.ws\}\}/g, i18next.t('localPage.ws'));
        html = html.replace(/\{\{localPage\.up_down\}\}/g, i18next.t('localPage.up_down'));
        html = html.replace(/\{\{localPage\.space_bar\}\}/g, i18next.t('localPage.space_bar'));
        html = html.replace(/\{\{localPage\.opp_name\}\}/g, i18next.t('localPage.opp_name'));
        html = html.replace(/\{\{localPage\.placeholder_opp\}\}/g, i18next.t('localPage.placeholder_opp'));
        html = html.replace(/\{\{localPage\.err_message\}\}/g, i18next.t('localPage.err_message'));
        html = html.replace(/\{\{localPage\.choose_ball\}\}/g, i18next.t('localPage.choose_ball'));
        html = html.replace(/\{\{localPage\.select_ball\}\}/g, i18next.t('localPage.select_ball'));
        html = html.replace(/\{\{localPage\.choose_bg\}\}/g, i18next.t('localPage.choose_bg'));
        html = html.replace(/\{\{localPage\.select_bg\}\}/g, i18next.t('localPage.select_bg'));
        html = html.replace(/\{\{localPage\.reset_color\}\}/g, i18next.t('localPage.reset_color'));
        html = html.replace(/\{\{localPage\.play\}\}/g, i18next.t('localPage.play'));
        html = html.replace(/\{\{localPage\.countdown_title\}\}/g, i18next.t('localPage.countdown_title'));
        // Local Summary
        html = html.replace(/\{\{localPage\.summary_modal\.title\}\}/g, i18next.t('localPage.summary_modal.title'));
        html = html.replace(/\{\{localPage\.summary_modal\.congrat\}\}/g, i18next.t('localPage.summary_modal.congrat'));
        html = html.replace(/\{\{localPage\.summary_modal\.name\}\}/g, i18next.t('localPage.summary_modal.name'));
        html = html.replace(/\{\{localPage\.summary_modal\.back_menu\}\}/g, i18next.t('localPage.summary_modal.back_menu'));
        // Local Chat
        html = html.replace(/\{\{localPage\.chat\.title\}\}/g, i18next.t('localPage.chat.title'));
        html = html.replace(/\{\{localPage\.chat\.info\}\}/g, i18next.t('localPage.chat.info'));
        html = html.replace(/\{\{localPage\.chat\.placeholder_input\}\}/g, i18next.t('localPage.chat.placeholder_input'));
        
    }

    return html;
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