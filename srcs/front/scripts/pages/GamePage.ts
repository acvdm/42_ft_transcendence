import htmlContentLocal from "./LocalGame.html";
import htmlContentRemote from "./RemoteGame.html";
import htmlContentTournament from "./TournamentPage.html";
import { ballEmoticons, gameBackgrounds } from "../components/Data";
import { fetchWithAuth } from "./api";
import { Chat } from "../components/Chat";
import SocketService from '../services/SocketService'; // <--- AJOUT IMPORT

import Game from "../game/Game";
import Input from "../game/Input";

// =========================================================
// ===  INTERFACES DU TOURNOI - debuit tournament.ts.    ===
// =========================================================

// Interface pour la gestion interne du tournois
interface TournamentPlayer 
{
    user_id: number | null; // null si c'est un invite qui joue
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
}

// =========================================================

let gameChat: Chat | null = null;
let tournamenetState: TournamentData | null = null; // on stocke l'état du tournoi (Typé maintenant)
let activeGame: Game | null = null; // Instance du jeu
let spaceKeyListener: ((e: KeyboardEvent) => void) | null = null; // on stocke l'ecoute de l'envoi a l'espace

// pour nettoyer le tout quand on quitte la page
export function cleanup() {
    if (gameChat) {
        gameChat.destroy();
        gameChat = null;
    }
    tournamenetState = null;

    if (activeGame) {
        activeGame.stop();
        activeGame = null;
    }

    // nettoyage de l'ecouteur
    if (spaceKeyListener) {
        document.removeEventListener('keydown', spaceKeyListener);
        spaceKeyListener = null;
    }
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

export function initGamePage(mode: string): void {

    // Récupération des éléments communs
    const player1Display = document.getElementById('player-1-name') as HTMLElement;
    const player2Display = document.getElementById('player-2-name') as HTMLElement;

    // on recupere le username du joueur connecte
    const userId = localStorage.getItem('userId');
    if (userId && player1Display)
    {
        fetchWithAuth(`api/users/${userId}`)
            .then(response => {
                if (response.ok) return response.json();
                throw new Error('Error fetching user');
        })
        .then (userData => {
            if (userData && userData.alias)
                player1Display.innerText = userData.alias;
        })
        .catch(err => console.error('Cannot fetch username for player 1'));

    }

    if (gameChat) gameChat.destroy();
    gameChat = new Chat();
    gameChat.init();

    if (mode == 'remote') {
        gameChat.joinChannel("remote_game_room"); // salle d'attente globale
        // iniitailiastion de la logique de jeu en remote
        initRemoteMode();
    } else if (mode == 'tournament') {
        gameChat.joinChannel("tournament_room"); // same ici
        // initialisation de la logique de jeu en tournoi
        initTournamenetMode();
    } else {
        gameChat.joinChannel("local_game_room");
        initLocalMode();
    }


    function showVictoryModal(winnerName: string) {
        // modal
        const modal = document.getElementById('local-summary-modal');
        const winnerText = document.getElementById('winner-name');
        const quitBtn = document.getElementById('quit-local-btn');

        if (modal && winnerText) {
            winnerText.innerText = winnerName;
            modal.classList.remove('hidden');
            
            // lancement de confettis
            launchConfetti(4000);
        }

        // gestion du bouton retour au menu
        quitBtn?.addEventListener('click', () => {
             window.location.reload(); 
        });
    }

    // ---------------------------------------------------------
    // -------------- WIZZ AVEC BARRE D'ESPACE ------------
    // ---------------------------------------------------------


    // on nettoie les anciens listeners
    if (spaceKeyListener) {
        document.removeEventListener('keydown', spaceKeyListener);
    }

    spaceKeyListener = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            const target = e.target as HTMLElement;

            // aggdngion xi l'uilisateur ecrit dans un input ou dans un truc de texte on ne fait rien
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            if (!activeGame || !activeGame.isRunning) return;

            e.preventDefault();

            if (gameChat) {
                if (mode === 'remote') {
                    // REMOTE : seulement a l'adversaire
                    gameChat.emitWizzOnly();
                    console.log("Wizz envoyé à l'adversaire (Remote)");
                } else {
                    // LOCAL ET TOURNOI : shake shake shake pour tout le monde
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


        const startGameFromData = (data: any) => {
            console.log("Starting game from data:", data);

            if (status) status.innerText = "Adversaire trouvé ! Lancement...";
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

                    activeGame = new Game(canvas, ctx, input, selectedBallSkin);

                    // --- ATTENTE SOCKET PRÊT ---
                    if (!socketService.socket) {
                        console.log("Socket non connecté, attente...");
                        const checkSocket = setInterval(() => {
                            if (socketService.socket) {
                                clearInterval(checkSocket);
                                activeGame?.startRemote(data.roomId, data.role);
                            }
                        }, 100);
                    } else {
                        activeGame.startRemote(data.roomId, data.role);
                    }
                }

                // --- Update UI noms joueurs ---
                const p1Name = document.getElementById('player-1-name');
                const p2Name = document.getElementById('player-2-name');

                if (p1Name) {
                    p1Name.innerText = data.role === 'player1' ? 'Moi' : 'Adversaire';
                }
                if (p2Name) {
                    p2Name.innerText = data.role === 'player2' ? 'Moi' : 'Adversaire';
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

        if (btn) {
            // On clone pour éviter les event listeners multiples si on revient sur la page
            const newBtn = btn.cloneNode(true) as HTMLButtonElement;
            btn.parentNode?.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                if (!socketService.socket) {
                    alert("Erreur: Non connecté au serveur de jeu");
                    return;
                }

                if (status) status.innerText = "Recherche d'un adversaire...";
                newBtn.disabled = true;
                newBtn.innerText = "WAITING...";

                // Ecoute de l'événement de début de match
                socketService.socket.on('matchFound', (data: any) => {
                    console.log("Match Found!", data);
                    
                    if (gameChat) {
                        // on rejoint un canal unique du match et du chat
                        // la class va nettoyer automqtiquement les messages
                        gameChat.joinChannel(data.roomId);
                        gameChat.addSystemMessage("Game found! You are now in a private room.")
                    }
                    
                    if (status) status.innerText = "Adversaire trouvé ! Lancement...";
                    
                    // Cache la modale
                    if (modal) modal.style.display = 'none';

                    if (container) {
                        container.innerHTML = ''; 
                        const canvas = document.createElement('canvas');
                        
                        canvas.width = container.clientWidth;
                        canvas.height = container.clientHeight;
                        canvas.style.width = '100%';
                        canvas.style.height = '100%';
                        
                        container.appendChild(canvas);
                        
                        const ctx = canvas.getContext('2d');
                        const input = new Input();

                        const selectedBallSkin = ballInput ? ballInput.value : 'classic';


                        if (ctx) {
                            if (activeGame) activeGame.isRunning = false;
                            activeGame = new Game(canvas, ctx, input, selectedBallSkin);
                            
                            activeGame.onGameEnd = (endData) => {
                                const winnerName = endData.winnerAlias || "Winner"; 
                                showVictoryModal(winnerName);
                            }
                            activeGame.onScoreChange = (score) => {
                                const sb = document.getElementById('score-board');
                                if (sb) sb.innerText = `${score.player1} - ${score.player2}`;
                            };
                            
                            // On lance le jeu une fois le canvas pret
                            activeGame.startRemote(data.roomId, data.role);
                        }
                    }
                    
                    // Update UI noms
                    const p1Name = document.getElementById('player-1-name');
                    const p2Name = document.getElementById('player-2-name');
                    
                    if (p1Name) p1Name.innerText = (data.role === 'player1') ? "Moi" : "Adversaire";
                    if (p2Name) p2Name.innerText = (data.role === 'player2') ? "Moi" : "Adversaire";
                });

                // Envoi demande au serveur
                socketService.socket.emit('joinQueue');
            });
        }
    }


    // ---------------------------------------------------------
    // -------------- LOGIQUE DU JEU EN TOURNOI ----------------
    // ---------------------------------------------------------

    function initTournamenetMode() {
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
        
        if (userId && username) {
            console.log("Username du user: ", username);
            player1Input.value = username; // doit afficher le nom du user connecté
            player1Input.readOnly = true; // n'affiche rien pour le moment
            player1Input.classList.add('bg-gray-200', 'cursor-not-allowed');
        } else {
            console.log("Username du user: ", username);
            player1Input.value = "";
            player1Input.readOnly = false; // le champs d'input est libre quand la connexion est en guest
            player1Input.classList.remove('bg-gray-200', 'cursor-not-allowed');
        }

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
            user_id: (index === 0) ? userIdNb : null,
            score: 0
        }));

        // maj de l'etat du tournoi, le nom et les joueurs 
        tournamenetState = {
            name: name,
            allPlayers: playersObjects,
            matches: [
                { round: 'semi_final_1', winner: null, p1: playersObjects[0], p2: playersObjects[1] }, // 1er duo
                { round: 'semi_final_2', winner: null, p1: playersObjects[2], p2: playersObjects[3] }, // 2eme duo
                { round: 'final',        winner: null, p1: null,              p2: null }               // finale
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
        if (!bracketModal || !tournamenetState) return;

        // Maj des textes de l'arbre
        const sf1 = document.getElementById('bracket-sf1');
        const sf2 = document.getElementById('bracket-sf2');
        const fin = document.getElementById('bracket-final');
        const msg = document.getElementById('bracket-status-msg');

        // SF1
        const m1 = tournamenetState.matches[0];
        const w1 = m1.winner ? `✅ ${m1.winner}` : null;
        if (sf1) sf1.innerText = w1 || `${m1.p1?.alias} vs ${m1.p2?.alias}`;

        // SF2
        const m2 = tournamenetState.matches[1];
        const w2 = m2.winner ? `✅ ${m2.winner}` : null;
        if (sf2) sf2.innerText = w2 || `${m2.p1?.alias} vs ${m2.p2?.alias}`;

        // Finale
        const mf = tournamenetState.matches[2];
        const p1Final = mf.p1 ? mf.p1.alias : '?';
        const p2Final = mf.p2 ? mf.p2.alias : '?';
        if (fin) fin.innerText = mf.winner ? `👑 ${mf.winner}` : `${p1Final} vs ${p2Final}`;

        // Message contextuel
        const idx = tournamenetState.currentMatchIdx;
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

        if (!nextMatchModal || !tournamenetState) return;

        const matchIdx = tournamenetState.currentMatchIdx;
        const match = tournamenetState.matches[matchIdx];
        
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

    function launchMatch(p1: TournamentPlayer, p2: TournamentPlayer) {
        const p1Name = document.getElementById('game-p1-name');
        const p2Name = document.getElementById('game-p2-name');

        // Mise à jour de l'UI du jeu
        if (p1Name) p1Name.innerText = p1.alias;
        if (p2Name) p2Name.innerText = p2.alias;

        // Appliquer la couleur de fond choisie au conteneur gauche
        const container = document.getElementById('left');
        if(container && tournamenetState) container.style.backgroundColor = tournamenetState.settings.bgSkin;

        console.log(`Lancement dy jeu: ${p1.alias} vs ${p2.alias}`);
        
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
            if (ctx && tournamenetState) {
                const input = new Input();
                if (activeGame) activeGame.isRunning = false;
                
                // Instanciation avec la balle choisie pour le tournoi
                activeGame = new Game(canvas, ctx, input, tournamenetState.settings.ballSkin);
                
                // Connexion du callback de score pour l'affichage dans le header
                activeGame.onScoreChange = (score) => {
                    const scoreBoard = document.getElementById('score-board');
                    if (scoreBoard) {
                        scoreBoard.innerText = `${score.player1} - ${score.player2}`;
                    }
                };
                
                activeGame.start();

                // + fin du jeu (endMatch())
                // on supervise le socre pour s'arreter a 11
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
                        endMatch(winnerAlias, activeGame.score.player1, activeGame.score.player2);
                    }
                }, 500); // on check toutes les demi secondes
            }
        }
    }

    function endMatch(winner: string, scoreP1: number, scoreP2: number) {
        if (!tournamenetState) return;

        const idx = tournamenetState.currentMatchIdx;
        const match = tournamenetState.matches[idx];
        
        match.winner = winner;
        if (match.p1) match.p1.score = scoreP1;
        if (match.p2) match.p2.score = scoreP2;

        if (match.p1 && match.p1.user_id) {
            const isWinner = (match.p1.alias === winner);
            saveGameStats(match.p1.user_id, scoreP1, isWinner);
        }

        // si jamais le joueur 2 a un id (mulitcompte par eemple)
        if (match.p2 && match.p2.user_id) {
            const isWinner = (match.p2.alias === winner);
            saveGameStats(match.p2.user_id, scoreP2, isWinner);
        }


        // Con affiche le resultat dans le chat 
        if (gameChat) gameChat.addSystemMessage(`${winner} wins the match!`);

        if (idx === 0) {
            // vainqueur demi finale 1
            // on recupere le bon objet joueur pour la finale
            const winnerObj = (match.p1?.alias === winner) ? match.p1 : match.p2;
            tournamenetState.matches[2].p1 = winnerObj ? { ...winnerObj } : null;
            
            tournamenetState.currentMatchIdx++;
            tournamenetState.currentStep = 'semi_final_2';
            showBracketModal(); // On réaffiche l'arbre
        } else if (idx === 1) {
            // vainqueur demi finale2 
            const winnerObj = (match.p1?.alias === winner) ? match.p1 : match.p2;
            tournamenetState.matches[2].p2 = winnerObj ? { ...winnerObj } : null;

            tournamenetState.currentMatchIdx++;
            tournamenetState.currentStep = 'final';
            showBracketModal(); // On réaffiche l'arbre
        } else {
            // fin
            tournamenetState.currentStep = 'finished';
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
            if (tourNameDisplay && tournamenetState) tourNameDisplay.innerText = tournamenetState.name;

            const userId = localStorage.getItem('userId');
            if (userId) {
                saveTournamentToApi(champion);
            }

            document.getElementById('quit-tournament-btn')?.addEventListener('click', () => {
                window.history.back();
            });
        }
    }

    async function saveTournamentToApi(winner: string) {
        if (!tournamenetState) return;
        try {
            await fetchWithAuth('api/game/tournament', {
                method: 'POST',
                body: JSON.stringify({
                    name: tournamenetState.name,
                    winner: winner,
                    participants: tournamenetState.allPlayers,
                    // Ajout des details complets pour le format JSON attendu
                    tournament_name: tournamenetState.name,
                    match_list: tournamenetState.matches
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

                // ICI LANCEMENT DU JEU
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

                    // checkeur du score
                    const localLoop = setInterval(async () => {
                        if (!activeGame || !activeGame.isRunning) {
                            clearInterval(localLoop);
                            return;
                        }
                        
                        if (activeGame.score.player1 >= 11 || activeGame.score.player2 >= 11) {
                            activeGame.isRunning = false; // STOP
                            clearInterval(localLoop); 
                            
                            const p1Wins = activeGame.score.player1 >= 11;
                            const winnerName = p1Wins ? player1Display.innerText : opponentName;
                            
                            launchConfetti(4000);
                            const userIdStr = localStorage.getItem('userId');
                            if (userIdStr) {
                                const userId = Number(userIdStr);
                                // on sauvegarde les statistiques
                                await saveGameStats(userId, activeGame.score.player1, p1Wins);
                            }
                            showVictoryModal(winnerName);
                        }
                    }, 500);
                }
            });
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

    // explosion depuis le centre
    function launchConfettiExplosion() {
        const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9'];
        const confettiCount = 100;
        const container = document.body;

        const confettiContainer = document.createElement('div');
        confettiContainer.id = 'confetti-explosion-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            pointer-events: none;
            z-index: 9999;
        `;
        container.appendChild(confettiContainer);

        for (let i = 0; i < confettiCount; i++) {
            createExplosionConfetti(confettiContainer, colors, i, confettiCount);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 4000);
    }

    function createExplosionConfetti(container: HTMLElement, colors: string[], index: number, total: number) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 12 + 6;
        
        // explosion en cerce
        const angle = (index / total) * Math.PI * 2;
        const velocity = Math.random() * 300 + 200; // Distance de projection
        const endX = Math.cos(angle) * velocity;
        const endY = Math.sin(angle) * velocity - 100; // Légère montée
        
        const rotation = Math.random() * 720;
        const duration = Math.random() * 1.5 + 2;

        confetti.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            top: 0;
            left: 0;
            opacity: 1;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            animation: explode-${index} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        `;

        container.appendChild(confetti);

        // animation pour chaque confetti
        const style = document.createElement('style');
        style.textContent = `
            @keyframes explode-${index} {
                0% {
                    transform: translate(0, 0) rotate(0deg) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(${endX}px, ${endY + 500}px) rotate(${rotation}deg) scale(0.3);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}