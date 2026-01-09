import htmlContentLocal from "./LocalGame.html";
import htmlContentRemote from "./RemoteGame.html";
import htmlContentTournament from "./TournamentPage.html";
import { ballEmoticons, gameBackgrounds } from "../components/Data";
import { fetchWithAuth } from "./api";
import { Chat } from "../components/Chat";
import SocketService from '../services/SocketService';
import { applyTheme } from "./ProfilePage";
import Game from "../game/Game";
import Input from "../game/Input";

// =========================================================
// ===               INTERFACES DU TOURNOI               ===
// =========================================================

// Interface pour la gestion interne du tournois
interface TournamentPlayer 
{
    userId: number | null; // null si c'est un invite qui joue
    alias: string;
    score: number; // score final d'un match
}

// Interface pour un match termine
interface TournamentMatch 
{
    round: 'semi_final_1' | 'semi_final_2' | 'final';
    winner: string | null;
    p1: TournamentPlayer | null;
    p2: TournamentPlayer | null;
    startDate: string;
    endDate?: string | undefined;
}

// Etat global du tournoi en cours
interface TournamentData 
{
    name: string;
    allPlayers: TournamentPlayer[];
    matches: TournamentMatch[];
    currentMatchIdx: number; // on defini l'id du match pour le stocker dans la db
    currentStep: 'registration' | 'semi_final_1' | 'semi_final_2' | 'final' | 'finished';
    settings: { // Ajout pour stocker les préférences graphiques du tournoi
        ballSkin: string;
        bgSkin: string;
    };
    startedAt: string
}



// =========================================================
// ================= FONCTIONS UTILITAIRES =================
// =========================================================

function getSqlDate(): string {
    // 1. On récupère l'heure actuelle
    const now = new Date();
    
    // 2. Astuce rapide : on prend l'ISO, on coupe les ms, et on remplace T par espace
    // .slice(0, 19) garde "YYYY-MM-DDTHH:mm:ss"
    return now.toISOString().slice(0, 19).replace('T', ' ');

}

// =========================================================

let gameChat: Chat | null = null;
let tournamentState: TournamentData | null = null; // on stocke l'état du tournoi (Typé maintenant)
let activeGame: Game | null = null; // Instance du jeu
let spaceKeyListener: ((e: KeyboardEvent) => void) | null = null; // on stocke l'ecoute de l'envoi a l'espace


// Après les imports, avant les variables globales
let isNavigationBlocked = false;

export function isGameRunning(): boolean {
    return activeGame !== null && activeGame.isRunning;
}


//aHelper pour recuperer le nom du n joueur
async function getPlayerAlias(): Promise<string> {
    const cachedAlias = sessionStorage.getItem('cachedAlias');
    if (cachedAlias) return cachedAlias;

    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const isGuest = sessionStorage.getItem('userRole') === 'guest';
    
    if (!userId) return "Player";
    
    try {
        const response = await fetchWithAuth(`api/user/${userId}`);
        if (response.ok) {
            const userData = await response.json();
            const alias = userData.alias || (isGuest ? "Guest" : "Player");
            // Mettre en cache
            sessionStorage.setItem('cachedAlias', alias);
            return userData.alias || (isGuest ? "Guest" : "Player");
        }
    } catch (err) {
        console.error('Cannot fetch player alias:', err);
    }

    const result = sessionStorage.getItem('username') || (isGuest ? "Guest" : "Player");
    
    return (result);
}

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




export function showExitConfirmationModal() {
    if (document.getElementById('exit-confirm-modal')) return;

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

function confirmExit() {
    isNavigationBlocked = true;
    
    if (activeGame) {
        const wasRemote = activeGame.isRemote;
        const roomId = activeGame.roomId;
        const playerRole = activeGame.playerRole;
        const currentScore = { ...activeGame.score };

        activeGame.isRunning = false;
        activeGame.stop();

        if (wasRemote && roomId && SocketService.getInstance().getGameSocket()) {
            SocketService.getInstance().getGameSocket()?.emit('leaveGame', { roomId: roomId });
            
            const userIdStr = localStorage.getItem('userId');
            if (userIdStr && playerRole) {
                const myScore = playerRole === 'player1' ? currentScore.player1 : currentScore.player2;
                saveGameStats(Number(userIdStr), myScore, false);
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


// pour nettoyer le tout quand on quitte la page
export function cleanup() {
    
    if (gameChat) {
        gameChat.destroy();
        gameChat = null;
    }
    tournamentState = null;

    if (activeGame) {
        activeGame.isRunning = false;
        activeGame.stop();
        activeGame = null;
    }

    // nettoyage de l'ecouteur
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
    // ici le routage selon le mode de jeu sélectionné
    if (state && state.gameMode === 'remote') {
        return htmlContentRemote;
    } else if (state && state.gameMode === 'tournament') {
        return htmlContentTournament;
    }
    return htmlContentLocal;
}


async function saveGameStats(userId: number, score: number, isWinner: boolean) {
    try {
        // ne renvoit pas correctement les stats -> trouver pourquoi 
       await fetchWithAuth(`api/game/users/${userId}/games/stats`, {
            method: 'PATCH',
            body: JSON.stringify({
                userScore: score,
                isWinner: isWinner ? 1 : 0
            })
        });
        console.log(`Stats sauvegardées pour le user ${userId}`);
    } catch (error) {
        console.error("Erreur lors de la sauvegarde des stats:", error);
    }
}



//////////////////////////////////////
////// REMOTE MODALE DE VICTOIRE /////
//////////////////////////////////////


    function showRemoteEndModal(winnerName: string, message: string) {
    if (document.getElementById('remote-end-modal')) return;

    
    const modalHtml = `
        <div id="remote-end-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" style="position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center;">
            <div class="window w-[600px] bg-white shadow-2xl animate-bounce-in">

                <div class="title-bar">
                    <div class="title-bar-text text-white" style="text-shadow: none;">Game Over</div>
                    <div class="title-bar-controls"></div>
                </div>

                <div class="window-body bg-gray-100 p-8 flex flex-col items-center gap-8">

                    <h1 class="text-4xl font-black text-yellow-600 uppercase tracking-widest">CONGRATULATIONS</h1>

                    <div class="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-lg w-full">
                        <p class="text-2xl font-bold text-gray-800 text-center">
                            ${winnerName}
                        </p>
                        <p class="text-sm text-gray-600 font-semibold italic text-center">
                            ${message}
                        </p>
                    </div>

                    <div class="flex gap-6 w-full justify-center">
                        <button id="remote-quit-btn"
                                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm
                                    px-6 py-4 text-base font-semibold shadow-sm
                                    hover:from-gray-200 hover:to-gray-400
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
                                    transition-all duration-200 hover:shadow-md"
                                style="width: 200px; padding: 4px;">
                            RETURN TO MENU
                        </button>
                    </div>

                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    document.getElementById('remote-quit-btn')?.addEventListener('click', () => {
        document.getElementById('remote-end-modal')?.remove();
        window.history.back();
    });
}


// =========================================================
// ==========--====== TOP DEPART DECOMPTE ==================
// =========================================================

function launchCountdown(onComplete: () => void) {
    const modal = document.getElementById('countdown-modal');
    const text = document.getElementById('countdown-text');
    
    if (!modal || !text) {
        onComplete();
        return;
    }

    modal.classList.remove('hidden');
    
    let count = 3;
    text.innerText = count.toString();
    text.className = "text-[150px] font-black text-white animate-bounce"; // Reset animation

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            text.innerText = count.toString();
        } else if (count === 0) {
            text.innerText = "GO!";
            text.classList.remove('animate-bounce');
            text.classList.add('animate-ping');
        } else {
            clearInterval(interval);
            modal.classList.add('hidden');
            onComplete(); // lancement du jeu 
        }
    }, 1000);
}


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


    if (gameChat) gameChat.destroy();
    gameChat = new Chat();
    gameChat.init();

    if (mode == 'remote') {
        const privateRoomId = sessionStorage.getItem('privateGameId');
        if (privateRoomId) {
            // si la partie est privée on fait une route dediée
            console.log(`Lancement d'un chat privé dans la waitroom numéro${privateRoomId}`);
            gameChat.joinChannel(`private_wait_${privateRoomId}`);
            
        } else {
            gameChat.joinChannel("remote_game_room"); // salle d'attente globale
        }
        // iniitailiastion de la logique de jeu en remote
        initRemoteMode();
    } else if (mode == 'tournament') {
        gameChat.joinChannel("tournament_room"); // same ici
        // initialisation de la logique de jeu en tournoi
        inittournamentMode();
    } else {
        gameChat.joinChannel("local_game_room");
        initLocalMode();
    }



    function showVictoryModal(winnerName: string) {
        // modal
        const modal = document.getElementById('local-summary-modal');
        const winnerText = document.getElementById('winner-name');
        const quitLocalBtn = document.getElementById('quit-local-btn');
        const quitRemoteBtn = document.getElementById('quit-remote-btn');

        if (modal && winnerText) {
            winnerText.innerText = winnerName;
            modal.classList.remove('hidden');
            
            if (gameChat) gameChat.addSystemMessage(`${winnerName} wins the match!`);
            // lancement de confettis
            launchConfetti(4000);
        }

        const backAction = () => {
            window.history.back();
        }
        // gestion du bouton retour au menu
        quitLocalBtn?.addEventListener('click', backAction);
        quitRemoteBtn?.addEventListener('click', backAction);

    }


    // ---------------------------------------------------------
    // -------------- WIZZ AVEC BARRE D'ESPACE ------------
    // ---------------------------------------------------------


    // on nettoie les anciens listeners
    if (spaceKeyListener) {
        document.removeEventListener('keydown', spaceKeyListener);
    }

    spaceKeyListener = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.key === ' ') {
            const target = e.target as HTMLElement;

            // aggdngion xi l'uilisateur ecrit dans un input ou dans un truc de texte on ne fait rien
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            if (!activeGame || !activeGame.isRunning) return;

            e.preventDefault();

            if (gameChat) {
                if (activeGame.isRemote) {
                    // REMOTE : On envoie via la socket seulement à l'adversaire
                    gameChat.emitWizzOnly();
                    console.log("Wizz envoyé à l'adversaire (Remote)");
                } else {
                    // LOCAL / TOURNOI : On fait trembler l'écran localement
                    const wizzContainer = document.getElementById('wizz-container');
                    gameChat.shakeElement(wizzContainer);
                    console.log("Wizz local déclenché");
                }
            }
        }
    };

    document.addEventListener('keydown', spaceKeyListener);



    // ---------------------------------------------------------
    // -------------- LOGIQUE DU JEU REMOTE (AJOUT) ------------
    // ---------------------------------------------------------
    function initRemoteMode() {
        const socketService = SocketService.getInstance();

        // 1. On lance le connexion spécifique au jeu
        socketService.connectGame();

        // 2. On récupère le socket jeu
        const gameSocket = socketService.getGameSocket();

        // Si pas de token ou erreur de connexion
        if (!gameSocket) {
            console.error("Cannot connect to server");
            return ;
        }

        const btn = document.getElementById('start-game-btn') as HTMLButtonElement;
        const status = document.getElementById('queue-status');
        const modal = document.getElementById('game-setup-modal');
        const container = document.getElementById('game-canvas-container');


        const ballBtn = document.getElementById('ball-selector-button');
        const ballDrop = document.getElementById('ball-selector-dropdown');
        const ballGrid = document.getElementById('ball-grid');
        const ballImg = document.getElementById('selected-ball-img') as HTMLImageElement;
        const ballInput = document.getElementById('ball-value') as HTMLInputElement;

        const bgBtn = document.getElementById('bg-selector-button');
        const bgDrop = document.getElementById('bg-selector-dropdown');
        const bgGrid = document.getElementById('bg-grid');
        const bgPrev = document.getElementById('selected-bg-preview');
        const bgInput = document.getElementById('bg-value') as HTMLInputElement;
        const bgResetBtn = document.getElementById('bg-reset-button');
        
        const gameContainer = document.getElementById('left'); // conteneur du jeu pour le background

        if (ballBtn && ballDrop && ballGrid) {
            const uniqueUrls = new Set<string>();
            ballGrid.innerHTML = '';
            Object.keys(ballEmoticons).forEach(key => {
                const imgUrl = ballEmoticons[key];
                if (!uniqueUrls.has(imgUrl)) {
                    uniqueUrls.add(imgUrl);
                    const div = document.createElement('div');
                    div.className = "cursor-pointer p-1 hover:bg-blue-100 rounded flex justify-center items-center";
                    div.innerHTML = `<img src="${imgUrl}" class="w-6 h-6 object-contain pointer-events-none">`;
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if(ballImg) ballImg.src = imgUrl;
                        if(ballInput) ballInput.value = imgUrl;
                        ballDrop.classList.add('hidden');
                    });
                    ballGrid.appendChild(div);
                }
            });
            ballBtn.addEventListener('click', (e) => { e.stopPropagation(); ballDrop.classList.toggle('hidden'); });
            document.addEventListener('click', (e) => { if (!ballDrop.contains(e.target as Node) && !ballBtn.contains(e.target as Node)) ballDrop.classList.add('hidden'); });
        }


        if (bgBtn && bgDrop && bgGrid) {
            bgGrid.innerHTML = '';
            Object.keys(gameBackgrounds).forEach(key => {
                const color = gameBackgrounds[key];
                const div = document.createElement('div');
                div.className = "cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-full flex justify-center items-center";
                div.style.width = "35px";
                div.style.height = "35px";
                div.style.padding = "2px";
                
                const circle = document.createElement('div');
                circle.className = "w-full h-full rounded-full border border-gray-300";
                circle.style.backgroundColor = color;
                div.appendChild(circle);
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(bgPrev) bgPrev.style.backgroundColor = color;
                    if(bgInput) bgInput.value = color;
                    if(gameContainer) gameContainer.style.backgroundColor = color; 
                    bgDrop.classList.add('hidden');
                });
                bgGrid.appendChild(div);
            });

            if (bgResetBtn) {
                bgResetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const resetColor = '#E8F4F8';
                    if (bgPrev) bgPrev.style.backgroundColor = resetColor;
                    if (bgInput) bgInput.value = resetColor;
                    if (gameContainer) gameContainer.style.backgroundColor = resetColor;
                    bgDrop.classList.add('hidden');
                });
            }

            bgBtn.addEventListener('click', (e) => { e.stopPropagation(); bgDrop.classList.toggle('hidden'); });
            document.addEventListener('click', (e) => { if (!bgDrop.contains(e.target as Node) && !bgBtn.contains(e.target as Node)) bgDrop.classList.add('hidden'); });
        }

        let currentP1Alias = "Player 1";
        let currentP2Alias = "Player 2";

        const startGameFromData = async (data: any, p1Alias?: string, p2Alias?: string) => {
            console.log("Starting game from data:", data);

            const myAlias = await getPlayerAlias();
            const remoteP1Alias = data.p1?.alias || data.player1?.alias || p1Alias;
            const remoteP2Alias = data.p2?.alias || data.player2?.alias || p2Alias;
            let opponentAlias = "Opponent";

            if (data.role === 'player1') {
                currentP1Alias = myAlias;
                if (remoteP2Alias) opponentAlias = remoteP2Alias;
                currentP2Alias = opponentAlias;
            } else {
                currentP1Alias = opponentAlias;
                if (remoteP1Alias) opponentAlias = remoteP1Alias;
                currentP2Alias = myAlias;
            }

            // 3. Mise à jour de l'affichage INITIAL (Immédiat)
            const p1Display = document.getElementById('player-1-name');
            const p2Display = document.getElementById('player-2-name');

            if (p1Display && p2Display) {
                p1Display.innerText = (data.role === 'player1') ? `${currentP1Alias} (Me)` : currentP1Alias;
                p2Display.innerText = (data.role === 'player2') ? `${currentP2Alias} (Me)` : currentP2Alias;
            }

            // 4. Récupération de l'adversaire en arrière-plan (si disponible)
            if (data.opponent) {
                fetchWithAuth(`api/user/${data.opponent}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(userData => {
                        if (userData && userData.alias) {
                            const realOpponentName = userData.alias;
                            
                            // On ne met à jour QUE l'élément qui correspond à l'adversaire
                            if (data.role === 'player1') {
                                // Je suis P1, donc l'adversaire est P2
                                currentP2Alias = realOpponentName;
                                if (p2Display) p2Display.innerText = realOpponentName;
                            } else {
                                // Je suis P2, donc l'adversaire est P1
                                currentP1Alias = realOpponentName;
                                if (p1Display) p1Display.innerText = realOpponentName;
                            }
                        }
                    })
                    .catch(e => console.error("Error retrieving opponent alias:", e));
            }

            // Sync du chat sur la room du jeu
            if (gameChat) {
                gameChat.joinChannel(data.roomId);
                gameChat.addSystemMessage(`Match started!`);
            }

            if (status) status.innerText = "We found an opponent ! Starting the game...";
            if (modal) modal.style.display = 'none';

            if (container) {
                container.innerHTML = '';
                const canvas = document.createElement('canvas');
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                container.appendChild(canvas);

                // Fallback si le container n'a pas encore de taille
                if (canvas.width === 0) canvas.width = 800;
                if (canvas.height === 0) canvas.height = 600;

                const ctx = canvas.getContext('2d');
                const input = new Input();
                const selectedBallSkin = ballInput ? ballInput.value : 'classic';

                if (ctx) {
                    // Stop propre de l'ancien jeu
                    if (activeGame) {
                        activeGame.stop();
                        activeGame = null;
                    }

                    console.log("Player aliases set:", currentP1Alias, currentP2Alias);
                    activeGame = new Game(canvas, ctx, input, selectedBallSkin);
                    console.log("Player aliases set:", currentP1Alias, currentP2Alias);
                    // gestion quand on opposant se casse du jeu 
                    gameSocket.off('opponentLeft');
                    gameSocket.on('opponentLeft', async (eventData: any) => {
                        if (activeGame) {
                            console.log("Opponent left the game! Victory by forfeit!");
                            activeGame.isRunning = false;
                            activeGame.stop();

                            gameSocket.off('gameState');
                            gameSocket.off('gameEnded');
                            let myScore = data.role === 'player1' ? activeGame.score.player1 : activeGame.score.player2;

                            const myAlias = await getPlayerAlias();
                            const userIdStr = localStorage.getItem('userId');
                            if (userIdStr) {
                                saveGameStats(Number(userIdStr), myScore, true);
                            }

                            showRemoteEndModal(myAlias, "(Opponent forfeit)");
                            activeGame = null;
                        }
                    });

                    activeGame.onGameEnd = (endData) => {
                        let winnerName = "Winner";
                        
                        if (endData.winner === 'player1') winnerName = currentP1Alias;
                        else if (endData.winner === 'player2') winnerName = currentP2Alias;
                        
                        console.log("WinnerName:", winnerName);
                        showVictoryModal(winnerName);
                    };

                    activeGame.onScoreChange = (score) => {
                        const sb = document.getElementById('score-board');
                        if (sb) sb.innerText = `${score.player1} - ${score.player2}`;
                    };

                    launchCountdown(() => {
                        if (activeGame)
                            activeGame.startRemote(data.roomId, data.role);
                    });
                }

            }
        };
        // vérification du match en attente
        const pendingMatch = sessionStorage.getItem('pendingMatch');
        if (pendingMatch) {
            const data = JSON.parse(pendingMatch);
            sessionStorage.removeItem('pendingMatch'); // On nettoie
            startGameFromData(data); // Lancement auto !
        }
//faustine
        const privateRoomId = sessionStorage.getItem('privateGameId'); // on recuperer notre id
        console.log("privategame:", sessionStorage.getItem('privateGameId'));

        // gestion du bouton de jeu
        if (btn) {

            // on va cloner le bouton pour supprimer les anciens listeners et commencer avec un truc propre
            const newBtn = btn.cloneNode(true) as HTMLButtonElement;
            btn.parentNode?.replaceChild(newBtn, btn);

            // clic du bouton
            newBtn.addEventListener('click', async () => {
                if (!gameSocket) {
                    alert("Error: lost connexion to game server");
                    return;
                }

                const myAlias = await getPlayerAlias();
                newBtn.disabled = true;

                // on detecte que c'est une partie privee car j'ai le proviate room id 
                if (privateRoomId) {
                    if (status) status.innerText = "Waiting for your friend in private room...";
                    newBtn.innerText = "WAITING FOR FRIEND...";
                    
                    // Écoute du début de match
                    gameSocket.off('matchFound');
                    gameSocket.on('matchFound', (data: any) => {
                        console.log("Private Match Started!", data);
                        // on nettoie l'id pour ne pas rester bloqué en mode privé au prochain passage dans la room
                        sessionStorage.removeItem('privateGameId'); 
                        startGameFromData(data);
                    });

                    // Envoi de la demande pour savoir quelle room et quelle balle
                    const selectedBall = ballInput ? ballInput.value : 'classic';
                    gameSocket.emit('joinPrivateGame', { 
                        roomId: privateRoomId,
                        skin: selectedBall 
                    });
                } 
                // sinon c;est du public et on reste en remote classique
                else {
                    if (status) status.innerText = "Recherche d'un adversaire...";
                    newBtn.innerText = "WAITING...";

                    gameSocket.off('matchFound');
                    gameSocket.on('matchFound', (data: any) => {
                        startGameFromData(data);
                    });

                    gameSocket.emit('joinQueue');
                }
            });
        }
    }


    // ---------------------------------------------------------
    // -------------- LOGIQUE DU JEU EN TOURNOI ----------------
    // ---------------------------------------------------------

    function inittournamentMode() {
        // Affiche la MODALE de setup (et non plus la div intégrée)
        const setupModal = document.getElementById('tournament-setup-modal');
        if (setupModal) setupModal.classList.remove('hidden');

        const nameInput = document.getElementById('tournament-name-input') as HTMLInputElement;
        const player1Input = document.getElementById('player1-input') as HTMLInputElement;
        const player2Input = document.getElementById('player2-input') as HTMLInputElement;
        const player3Input = document.getElementById('player3-input') as HTMLInputElement;
        const player4Input = document.getElementById('player4-input') as HTMLInputElement;

        const startButton = document.getElementById('start-tournament-btn'); 
        const errorDiv = document.getElementById('setup-error');

        // Initialisation des sélecteurs spécifiques au tournoi
        initTournamentSelectors();

        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        
        const isGuest = sessionStorage.getItem('userRole') === 'guest';

        getPlayerAlias().then(alias => {
            player1Input.value = alias;
        
            if (!isGuest) {
                player1Input.readOnly = true;
                player1Input.classList.add('bg-gray-200', 'cursor-not-allowed');
            } else {
                player1Input.readOnly = false;
                player1Input.classList.remove('bg-gray-200', 'cursor-not-allowed');
            }
        })

        console.log("Username du user: ", username);

        startButton?.addEventListener('click', () => {
            const tName = nameInput.value.trim();
            const players = [
                player1Input.value.trim(), 
                player2Input.value.trim(), 
                player3Input.value.trim(), 
                player4Input.value.trim()
            ];

            // verification de la validation, est-ce que tous les chamos sont bien bien remplis
            if (!tName || players.some(p => !p)) {
                if (errorDiv) {
                    errorDiv.innerText = "Please fill all fields.";
                    errorDiv.classList.remove('hidden');
                }
                return;
            }

            // on verifie que on a pas de nom en doublon
            const uniqueCheck = new Set(players);
            if (uniqueCheck.size !== 4) {
                if (errorDiv) {
                    errorDiv.innerText = "All player aliases must be unique.";
                    errorDiv.classList.remove('hidden');
                }
                return;
            }

            // Récupération des choix graphiques du tournoi
            const ballVal = (document.getElementById('tour-ball-value') as HTMLInputElement)?.value || 'classic';
            const bgVal = (document.getElementById('tour-bg-value') as HTMLInputElement)?.value || '#E8F4F8';

            // demarrage du tournoi 
            startTournamentLogic(tName, players, ballVal, bgVal);
        });
    }

    function initTournamentSelectors() {
        const ballBtn = document.getElementById('tour-ball-selector-button');
        const ballDrop = document.getElementById('tour-ball-selector-dropdown');
        const ballGrid = document.getElementById('tour-ball-grid');
        const ballImg = document.getElementById('tour-selected-ball-img') as HTMLImageElement;
        const ballInput = document.getElementById('tour-ball-value') as HTMLInputElement;

        const bgBtn = document.getElementById('tour-bg-selector-button');
        const bgDrop = document.getElementById('tour-bg-selector-dropdown');
        const bgGrid = document.getElementById('tour-bg-grid');
        const bgPrev = document.getElementById('tour-selected-bg-preview');
        const bgInput = document.getElementById('tour-bg-value') as HTMLInputElement;
        const bgResetBtn = document.getElementById('bg-reset-button'); // Récupération du bouton reset

        // Récupération du conteneur "window-body" pour appliquer le background
        const gameContainer = document.getElementById('left');

        // --- GESTION DE LA BALLE ---
        if (ballBtn && ballDrop && ballGrid) {
            const uniqueUrls = new Set<string>();
            ballGrid.innerHTML = '';
            Object.keys(ballEmoticons).forEach(key => {
                const imgUrl = ballEmoticons[key];
                if (!uniqueUrls.has(imgUrl)) {
                    uniqueUrls.add(imgUrl);
                    const div = document.createElement('div');
                    div.className = "cursor-pointer p-1 hover:bg-blue-100 rounded flex justify-center items-center";
                    div.innerHTML = `<img src="${imgUrl}" class="w-6 h-6 object-contain pointer-events-none">`;
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Mise à jour de l'image de prévisualisation
                        if(ballImg) ballImg.src = imgUrl;
                        if(ballInput) ballInput.value = imgUrl;
                        ballDrop.classList.add('hidden');
                    });
                    ballGrid.appendChild(div);
                }
            });
            ballBtn.addEventListener('click', (e) => { e.stopPropagation(); ballDrop.classList.toggle('hidden'); });
            document.addEventListener('click', (e) => { if (!ballDrop.contains(e.target as Node) && !ballBtn.contains(e.target as Node)) ballDrop.classList.add('hidden'); });
        }

        // --- GESTION DU BACKGROUND ---
        if (bgBtn && bgDrop && bgGrid) {
            bgGrid.innerHTML = '';
            Object.keys(gameBackgrounds).forEach(key => {
                const color = gameBackgrounds[key];
                const div = document.createElement('div');
                div.className = "cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-full flex justify-center items-center";
                div.style.width = "35px";
                div.style.height = "35px";
                div.style.padding = "2px";
                
                const circle = document.createElement('div');
                circle.className = "w-full h-full rounded-full border border-gray-300";
                circle.style.backgroundColor = color;
                div.appendChild(circle);
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // 1. Mise à jour de la pastille dans le menu
                    if(bgPrev) bgPrev.style.backgroundColor = color;
                    // 2. Mise à jour de la valeur cachée pour le lancement
                    if(bgInput) bgInput.value = color;
                    // 3. Application immédiate au conteneur de jeu (Effet dynamique)
                    if(gameContainer) gameContainer.style.backgroundColor = color;

                    bgDrop.classList.add('hidden');
                });
                bgGrid.appendChild(div);
            });

            // Gestion du bouton Reset
            if (bgResetBtn) {
                bgResetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const resetColor = '#E8F4F8';
                    if (bgPrev) bgPrev.style.backgroundColor = resetColor;
                    if (bgInput) bgInput.value = resetColor;
                    if (gameContainer) gameContainer.style.backgroundColor = resetColor;
                    bgDrop.classList.add('hidden');
                });
            }

            bgBtn.addEventListener('click', (e) => { e.stopPropagation(); bgDrop.classList.toggle('hidden'); });
            document.addEventListener('click', (e) => { if (!bgDrop.contains(e.target as Node) && !bgBtn.contains(e.target as Node)) bgDrop.classList.add('hidden'); });
        }
    }

    function startTournamentLogic(name: string, playersAliases: string[], ballSkin: string, bgSkin: string) {
        // on retire la modale de slection des infos de jeu
        document.getElementById('tournament-setup-modal')?.classList.add('hidden');

        // recuperation de l'id du user connecté
        const userIdStr = localStorage.getItem('userId');
        const userIdNb = userIdStr ? Number(userIdStr) : null;

        // creation des joueurs avec des ids
        const playersObjects: TournamentPlayer[] = playersAliases.map((alias, index) => ({
            alias: alias,
            userId: (index === 0) ? userIdNb : null,
            score: 0
        }));

        const startDate = getSqlDate();
        // maj de l'etat du tournoi, le nom et les joueurs 
        tournamentState = {
            name: name,
            startedAt: startDate,
            allPlayers: playersObjects,
            matches: [
                { round: 'semi_final_1', winner: null, p1: playersObjects[0], p2: playersObjects[1], startDate: startDate, endDate: startDate }, // 1er duo
                { round: 'semi_final_2', winner: null, p1: playersObjects[2], p2: playersObjects[3], startDate: startDate, endDate: startDate }, // 2eme duo
                { round: 'final',        winner: null, p1: null,              p2: null, startDate: startDate, endDate: startDate }               // finale
            ],
            currentMatchIdx: 0, // on defini l'id du match pour le stocker dans la db
            currentStep: 'semi_final_1',
            settings: { ballSkin, bgSkin }
        };

        // on fait une annonce dans le chat 
        if (gameChat) {
            gameChat.addSystemMessage(`Tournament "${name}" started! Participants: ${playersAliases.join(', ')}`);
        }

        // On affiche l'arbre (Bracket)
        showBracketModal();
    }

    // Affiche la modale de l'arbre du tournoi
    function showBracketModal() {
        const bracketModal = document.getElementById('tournament-bracket-modal');
        if (!bracketModal || !tournamentState) return;

        // Maj des textes de l'arbre
        const sf1 = document.getElementById('bracket-sf1');
        const sf2 = document.getElementById('bracket-sf2');
        const fin = document.getElementById('bracket-final');
        const msg = document.getElementById('bracket-status-msg');

        // SF1
        const m1 = tournamentState.matches[0];
        const w1 = m1.winner ? `✅ ${m1.winner}` : null;
        if (sf1) sf1.innerText = w1 || `${m1.p1?.alias} vs ${m1.p2?.alias}`;

        // SF2
        const m2 = tournamentState.matches[1];
        const w2 = m2.winner ? `✅ ${m2.winner}` : null;
        if (sf2) sf2.innerText = w2 || `${m2.p1?.alias} vs ${m2.p2?.alias}`;

        // Finale
        const mf = tournamentState.matches[2];
        const p1Final = mf.p1 ? mf.p1.alias : '?';
        const p2Final = mf.p2 ? mf.p2.alias : '?';
        if (fin) fin.innerText = mf.winner ? `👑 ${mf.winner}` : `${p1Final} vs ${p2Final}`;

        // Message contextuel
        const idx = tournamentState.currentMatchIdx;
        if (msg) {
            if (idx === 0) msg.innerText = "Next: Semi-Final 1";
            else if (idx === 1) msg.innerText = "Next: Semi-Final 2";
            else if (idx === 2) msg.innerText = "Next: The Grand Finale!";
        }

        bracketModal.classList.remove('hidden');

        // Bouton Continue -> Affiche l'annonce du match
        const btn = document.getElementById('bracket-continue-btn');
        const newBtn = btn?.cloneNode(true) as HTMLElement;
        btn?.parentNode?.replaceChild(newBtn, btn!);

        newBtn.addEventListener('click', () => {
             bracketModal.classList.add('hidden');
             showNextMatchModal();
        });
    }

    // on affiche le prochain match, maj du titre finale etc, nom des joueurs, message et bouton play
    function showNextMatchModal() {
        // recuperation des elements du DOM
        const nextMatchModal = document.getElementById('tournament-next-match-modal');
        const title = document.getElementById('match-title');
        const player1Text = document.getElementById('next-p1');
        const player2Text = document.getElementById('next-p2');
        const playButton = document.getElementById('launch-match-btn');

        if (!nextMatchModal || !tournamentState) return;

        const matchIdx = tournamentState.currentMatchIdx;
        const match = tournamentState.matches[matchIdx];
        
        // Alias safe pour affichage
        const p1Alias = match.p1 ? match.p1.alias : "???";
        const p2Alias = match.p2 ? match.p2.alias : "???";

        // on determinne la logique pour l'affichage des infos du match
        if (matchIdx === 0) {
            if(title) title.innerText = "SEMI-FINAL 1";
            // affichage dans le chat
            if (gameChat) gameChat.addSystemMessage(`Next up: ${p1Alias} vs ${p2Alias} !`);
        } else if (matchIdx === 1) {
            if(title) title.innerText = "SEMI-FINAL 2";
            // affichage dans le chat
            if (gameChat) gameChat.addSystemMessage(`Next up: ${p1Alias} vs ${p2Alias} !`);
        } else {
            if(title) title.innerText = "FINALE";
            // affichage dans le chat
            if (gameChat) gameChat.addSystemMessage(`FINAL: ${p1Alias} vs ${p2Alias} !`);
        }

        if(player1Text) player1Text.innerText = p1Alias;
        if(player2Text) player2Text.innerText = p2Alias;

        nextMatchModal.classList.remove('hidden');

        // on supprime les anciens event listeners du play bouton!
        const newButton = playButton!.cloneNode(true);
        playButton!.parentNode!.replaceChild(newButton, playButton!);

        newButton.addEventListener('click', () => {
            nextMatchModal.classList.add('hidden');
            if (match.p1 && match.p2) {
                launchMatch(match.p1, match.p2);
            }
        });
    }

    function launchMatch(p1: TournamentPlayer, p2: TournamentPlayer) {
        const p1Name = document.getElementById('player-1-name');
        const p2Name = document.getElementById('player-2-name');

        const gameStartDate = getSqlDate();
        // Mise à jour de l'UI du jeu
        if (p1Name) p1Name.innerText = p1.alias;
        if (p2Name) p2Name.innerText = p2.alias;

        const scoreBoard = document.getElementById('score-board');
            if (scoreBoard) {
                scoreBoard.innerText = "0 - 0";
            }
        // Appliquer la couleur de fond choisie au conteneur gauche
        const container = document.getElementById('left');
        if(container && tournamentState) container.style.backgroundColor = tournamentState.settings.bgSkin;

        console.log(`Lancement du jeu: ${p1.alias} vs ${p2.alias}`);
        
        // on recupere le conteneur dans lequel on mets le jeu 
        let canvasContainer = document.getElementById('game-canvas-container');
        if (canvasContainer) {
            canvasContainer.innerHTML = ''; // on nettoie l'ancien match
            
            const canvas = document.createElement('canvas');
            canvas.id = 'pong-canvas-tournament';
            canvas.width = canvasContainer.clientWidth; // check pour ajuste la taille a la fenetre de jeux
            canvas.height = canvasContainer.clientHeight; // check pour ajuste la taille a la fenetre de jeux
            console.log("heigh:", canvasContainer.clientHeight);
            console.log("width:", canvasContainer.clientWidth);
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            // canvas.style.objectFit = 'contain';
            
            canvasContainer.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (ctx && tournamentState) {
                const input = new Input();
                if (activeGame) activeGame.isRunning = false;
                
                // Instanciation avec la balle choisie pour le tournoi
                activeGame = new Game(canvas, ctx, input, tournamentState.settings.ballSkin);
                
                // Connexion du callback de score pour l'affichage dans le header
                activeGame.onScoreChange = (score) => {
                    const scoreBoard = document.getElementById('score-board');
                    if (scoreBoard) {
                        scoreBoard.innerText = `${score.player1} - ${score.player2}`;
                    }
                };
                
                activeGame.start();

                const checkInterval = setInterval(() => {
                    if (!activeGame || !activeGame.isRunning) {
                        clearInterval(checkInterval);
                        return;
                    }
                    // condition de victoire : PREMIER A 11
                    if (activeGame.score.player1 >= 3 || activeGame.score.player2 >= 3) {
                        activeGame.isRunning = false; // STOP LE JEU
                        clearInterval(checkInterval);
                        const winnerAlias = activeGame.score.player1 > activeGame.score.player2 ? p1.alias : p2.alias;
                        endMatch(winnerAlias, activeGame.score.player1, activeGame.score.player2, gameStartDate);
                    }
                }, 500); // on check toutes les demi secondes
            }
        }
    }

    function endMatch(winner: string, scoreP1: number, scoreP2: number, gameStartDate: string) {
        if (!tournamentState) return;

        const idx = tournamentState.currentMatchIdx;
        const match = tournamentState.matches[idx];

        match.startDate = gameStartDate;
        match.endDate = getSqlDate();

        match.winner = winner;
        if (match.p1) match.p1.score = scoreP1;
        if (match.p2) match.p2.score = scoreP2;

        if (match.p1 && match.p1.userId) {
            const isWinner = (match.p1.alias === winner);
            // saveGameStats(match.p1.userId, scoreP1, isWinner);
        }

        // si jamais le joueur 2 a un id (mulitcompte par eemple)
        if (match.p2 && match.p2.userId) {
            const isWinner = (match.p2.alias === winner);
            // saveGameStats(match.p2.userId, scoreP2, isWinner);
        }


        // Con affiche le resultat dans le chat 
        if (gameChat) gameChat.addSystemMessage(`${winner} wins the match!`);

        if (idx === 0) {
            // vainqueur demi finale 1
            // on recupere le bon objet joueur pour la finale
            const winnerObj = (match.p1?.alias === winner) ? match.p1 : match.p2;
            tournamentState.matches[2].p1 = winnerObj ? { ...winnerObj } : null;
            
            tournamentState.currentMatchIdx++;
            tournamentState.currentStep = 'semi_final_2';
            showBracketModal(); // On réaffiche l'arbre
        } else if (idx === 1) {
            // vainqueur demi finale2 
            const winnerObj = (match.p1?.alias === winner) ? match.p1 : match.p2;
            tournamentState.matches[2].p2 = winnerObj ? { ...winnerObj } : null;

            tournamentState.currentMatchIdx++;
            tournamentState.currentStep = 'final';
            showBracketModal(); // On réaffiche l'arbre
        } else {
            // fin
            tournamentState.currentStep = 'finished';
            showSummary(winner);
        }
    }

    function showSummary(champion: string) {
        // Reset background
        
        launchConfetti(4000);
        const container = document.getElementById('left');
        if (container) container.style.backgroundColor = 'white';
        
        const summaryModal = document.getElementById('tournament-summary-modal');
        
        if (summaryModal) {
            summaryModal.classList.remove('hidden');
            const winnerDisplay = document.getElementById('winner-name');
            const tourNameDisplay = document.getElementById('tour-name-display');
            
            if (winnerDisplay) winnerDisplay.innerText = champion;
            if (tourNameDisplay && tournamentState) tourNameDisplay.innerText = tournamentState.name;

            if (gameChat) gameChat.addSystemMessage(`${champion} wins the match!`);
            const userId = localStorage.getItem('userId');
            if (userId) {
                saveTournamentToApi(champion);
            }

            document.getElementById('quit-tournament-btn')?.addEventListener('click', () => {
                window.history.back();
            });

            document.getElementById('quit-remote-btn')?.addEventListener('click', () => {
                window.history.back();
            });
        }
    }

    async function saveTournamentToApi(winner: string) {
        
        if (!tournamentState) return;
        else
        {
            console.log("DEBUG FRONTEND - Matches à envoyer :", tournamentState.matches);
            console.log("DEBUG FRONTEND - Nombre de matches :", tournamentState.matches.length);
        }
        try {
            await fetchWithAuth('api/game/tournaments', {
                method: 'POST',
                body: JSON.stringify({
                    name: tournamentState.name,
                    winner: winner,
                    participants: tournamentState.allPlayers,
                    // Ajout des details complets pour le format JSON attendu
                    tournamentName: tournamentState.name,  // modif de tournament_name en tournamentName pour le back
                    matchList: tournamentState.matches, // modif de match_list en matchList pour le back
                    startedAt: tournamentState.startedAt
                })
            });
        } catch (e) { console.error(e); }
    }



// =========================================================
// =========       LOGIQUE LOCALE 1v1 ======================
// =========================================================
    function initLocalMode() {
        const modal = document.getElementById('game-setup-modal');
        const startButton = document.getElementById('start-game-btn');
        const nameInput = document.getElementById('opponent-name') as HTMLInputElement;
        const errorMsg = document.getElementById('error-message') as HTMLElement;
        const ballButton = document.getElementById('ball-selector-button') as HTMLButtonElement;
        const ballDropdown = document.getElementById('ball-selector-dropdown') as HTMLElement;
        const ballGrid = document.getElementById('ball-grid') as HTMLElement;
        const selectedBallImg = document.getElementById('selected-ball-img') as HTMLImageElement;
        const ballValueInput = document.getElementById('ball-value') as HTMLInputElement;
        const bgButton = document.getElementById('bg-selector-button') as HTMLButtonElement;
        const bgDropdown = document.getElementById('bg-selector-dropdown') as HTMLElement;
        const bgGrid = document.getElementById('bg-grid') as HTMLElement;
        const selectedBgPreview = document.getElementById('selected-bg-preview') as HTMLElement;
        const bgValueInput = document.getElementById('bg-value') as HTMLInputElement;
        const gameField = document.getElementById('left') as HTMLElement;
        const bgResetButton = document.getElementById('bg-reset-button') as HTMLButtonElement;
        const player2Display = document.getElementById('player-2-name') as HTMLElement;

        if (modal) modal.classList.remove('hidden');

        // ---------------------------------------------------------
        // --- LOGIQUE DU SÉLECTEUR DE BALLE (EMOTICONS) -----------
        // ---------------------------------------------------------

        if (ballButton && ballDropdown && ballGrid) {
            // la grille des emotifcones
            const uniqueUrls = new Set<string>();
            ballGrid.innerHTML = '';
            Object.keys(ballEmoticons).forEach(key => {
                const imgUrl = ballEmoticons[key];
                // on evite les doublons
                if (!uniqueUrls.has(imgUrl)) {
                    uniqueUrls.add(imgUrl);
                    const div = document.createElement('div');
                    div.className = "cursor-pointer p-1 hover:bg-blue-100 rounded border border-transparent hover:border-blue-300 flex justify-center items-center";
                    div.innerHTML = `<img src="${imgUrl}" alt="${key}" class="w-6 h-6 object-contain pointer-events-none">`;
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectedBallImg.src = imgUrl;
                        ballValueInput.value = imgUrl;
                        ballDropdown.classList.add('hidden');
                    });
                    ballGrid.appendChild(div);
                }
            });
            ballButton.addEventListener('click', (e) => {
                e.stopPropagation();
                ballDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (!ballDropdown.contains(target) && !ballButton.contains(target)) {
                    ballDropdown.classList.add('hidden');
                }
            });
        }

        // ---------------------------------------------------------
        // --- LOGIQUE DU SÉLECTEUR DE BACKGROUND -------------------
        // ---------------------------------------------------------

        if (bgButton && bgDropdown && bgGrid) {
            // geneere la grille de couleurs -> penser a ajouter un reset
            bgGrid.innerHTML = '';
            Object.keys(gameBackgrounds).forEach(key => {
                const color = gameBackgrounds[key];
                const div = document.createElement('div');
                div.className = "cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-full";
                div.style.padding = "4px";
                div.style.display = "flex";
                div.style.justifyContent = "center";
                div.style.alignItems = "center";
                div.style.width = "36px";
                div.style.height = "36px";
                const colorCircle = document.createElement('div');
                colorCircle.className = "w-full h-full rounded-full border-2 border-gray-300";
                colorCircle.style.backgroundColor = color;
                div.appendChild(colorCircle);
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedBgPreview.style.backgroundColor = color;
                    bgValueInput.value = color;
                    if (gameField) {
                        gameField.style.backgroundColor = color;
                    }
                    bgDropdown.classList.toggle('hidden');
                });
                bgGrid.appendChild(div);
            });

            if (bgResetButton) {
                bgResetButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const resetColor = '#E8F4F8';
                    if (selectedBgPreview) selectedBgPreview.style.backgroundColor = resetColor;
                    if (bgValueInput) bgValueInput.value = resetColor;
                    if (gameField) gameField.style.backgroundColor = resetColor;
                    bgDropdown.classList.toggle('hidden');
                });
            }
            bgButton.addEventListener('click', (e) => {
                e.stopPropagation();
                bgDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (!bgDropdown.contains(target) && !bgButton.contains(target)) {
                    bgDropdown.classList.add('hidden');
                }
            });
        }

        // on clique sur play
        if (startButton) {
            // Clone pour éviter duplication d'events si on revient sur la page
            const newStartBtn = startButton.cloneNode(true);
            startButton.parentNode?.replaceChild(newStartBtn, startButton);

            newStartBtn.addEventListener('click', () => {
                const opponentName = nameInput.value.trim(); // l'opposent a besoin du name input

                // est-ce qu'on peut utliser un nom qui est egalement un usrename deja pris?
                if (opponentName === "") {
                    if (errorMsg) errorMsg.classList.remove('hidden');
                    nameInput.classList.add('border-red-500');
                    return;
                }

                // envoi de la notifciation
                if (gameChat) {
                    gameChat.addSystemMessage(`Game is about to start! Match: ${player1Display.innerText} vs ${opponentName}`);
                }

                // valeur par default 
                const selectedBall = ballValueInput ? ballValueInput.value : 'classic';
                const selectedBg = bgValueInput ? bgValueInput.value : '#E8F4F8';
                // on met a jour le nom du second joueur
                if (player2Display) {
                    player2Display.innerText = opponentName;
                }

                if (gameField) {
                    gameField.style.backgroundColor = selectedBg;
                }

                // on ferme la modale 
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }

                launchCountdown(() => {
                    const canvasContainer = document.getElementById('game-canvas-container');
                    if (!canvasContainer) {
                        console.error("Conteneur canvas introuvable, creation auto...");
                        const container = document.createElement('div');
                        container.id = 'game-canvas-container';
                        container.className = "w-full flex-1";
                        gameField.appendChild(container);
                    } else {
                        canvasContainer.innerHTML = '';
                    }
    
                    const scoreBoard = document.getElementById('score-board');
                    const canvas = document.createElement('canvas');
                    canvas.id = 'pong-canvas';
                    canvas.width = canvasContainer ? canvasContainer.clientWidth : 800; // verifier la taille
                    canvas.height = canvasContainer ? canvasContainer.clientHeight : 600;
                    console.log("heigh:", canvasContainer.clientHeight);
                    console.log("width:", canvasContainer.clientWidth);
                    canvas.style.width = '100%';
                    canvas.style.height = '100%';
                    //canvas.style.objectFit = 'contain';
                    canvas.style.backgroundColor = selectedBg; // faire la meme chose pour tous les modes 
    
                    // Injection
                    const targetContainer = document.getElementById('game-canvas-container') || gameField;
                    targetContainer.appendChild(canvas);
    
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        const input = new Input();
                        if (activeGame) activeGame.isRunning = false;
                        activeGame = new Game(canvas, ctx, input, selectedBall);
                        
                        activeGame.onScoreChange = (score) => {
                            if (scoreBoard) {
                                scoreBoard.innerText = `${score.player1} - ${score.player2}`;
                            }
                        }
    
                        console.log("Démarrage du jeu Local...");
                        activeGame.start();
                        const startDate = getSqlDate();
    
                        // checkeur du score
                        const localLoop = setInterval(async () => {
                            if (!activeGame || !activeGame.isRunning) {
                                clearInterval(localLoop);
                                return;
                            }                    
                        
                            if (activeGame.score.player1 >= 11 || activeGame.score.player2 >= 11) {
                                activeGame.isRunning = false; // STOP
                                clearInterval(localLoop); 
                                
                                // 1. Récupération des données
                                const p1Score = activeGame.score.player1;
                                const p2Score = activeGame.score.player2;
                                const p1Alias = player1Display.innerText;
                                const p2Alias = opponentName;
                                const p1Wins = p1Score > p2Score;
                                const winnerAlias = p1Wins ? p1Alias : p2Alias;
        
                                // 2. Sauvegarde si l'utilistauer est connecté
                                const userIdStr = localStorage.getItem('userId');
                                if (userIdStr) {
                                    const userId = Number(userIdStr);
                                    // on sauvegarde les statistiques
                                    console.log(`gamepage, ${userId}`);
                                    await saveLocalGameToApi(p1Alias, p2Alias, p1Score, p2Score, winnerAlias, startDate, userId);
                                }
                                
                                // 3. Feedback et Reload
                                showVictoryModal(winnerAlias);
                            }
                        }, 500);
                    }
                });
            });
        }
    }

    async function saveLocalGameToApi(
        p1Alias: string,
        p2Alias: string,
        p1Score: number,
        p2Score: number,
        winnerAlias: string,
        startDate: string,
        userId: number
    ) {
    
        try 
        {
            const endDate = getSqlDate()
            const response = await fetchWithAuth('api/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: "local",
                    winner: winnerAlias,
                    status: "finished",
                    round: "1v1",
                    startDate: startDate,
                    endDate: endDate,
                    p1: {
                        alias: p1Alias,
                        score: p1Score,
                        userId: userId
                    },
                    p2: {
                        alias: p2Alias,
                        score: p2Score,
                        userId: null                        
                    }
                })
            });

            if (!response.ok) {
                console.error("Error while saving local game");
            }
            else {
                console.log("Local game successfully saved");
            }
        } 
        catch (e) 
        { 
            console.error(e); 
        }
    }
    
    // resrt erreur ecritur e
    nameInput.addEventListener('input', () => {
        if (errorMsg) errorMsg.classList.add('hidden');
        nameInput.classList.remove('border-red-500');
    });
}



//////////////////////////////////////////////
//// LANCEMENT DE CONFETTIS A LA VICTOIRE ////
/////////////////////////////////////////////

    function launchConfetti(duration: number = 3000) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
        const confettiCount = 150;
        const container = document.body;

        // CONTAINER A CONFFETI
        const confettiContainer = document.createElement('div');
        confettiContainer.id = 'confetti-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        container.appendChild(confettiContainer);

        // creation des confesttis
        for (let i = 0; i < confettiCount; i++) {
            createConfetti(confettiContainer, colors);
        }

        // renmove des confittos
        setTimeout(() => {
            confettiContainer.remove();
        }, duration);
    }

    function createConfetti(container: HTMLElement, colors: string[]) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5; // 5-15px
        const startX = Math.random() * window.innerWidth;
        const endX = startX + (Math.random() - 0.5) * 200; // Dérive horizontale
        const rotation = Math.random() * 360;
        const duration = Math.random() * 2 + 2; // 2-4 secondes
        const delay = Math.random() * 0.5; // Délai aléatoire

        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            top: -20px;
            left: ${startX}px;
            opacity: 1;
            transform: rotate(${rotation}deg);
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'}; /* Rond ou carré */
            animation: fall ${duration}s ease-in ${delay}s forwards;
        `;

        container.appendChild(confetti);

        // css inline pour l'animation
        const style = document.createElement('style');
        if (!document.getElementById('confetti-animation-style')) {
            style.id = 'confetti-animation-style';
            style.textContent = `
                @keyframes fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(${window.innerHeight + 50}px) translateX(${endX - startX}px) rotate(${rotation + 720}deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
