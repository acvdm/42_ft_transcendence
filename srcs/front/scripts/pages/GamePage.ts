import htmlContentLocal from "./LocalGame.html";
import htmlContentRemote from "./RemoteGame.html";
import htmlContentTournament from "./TournamentPage.html";
import { ballEmoticons, gameBackgrounds } from "../components/Data";
import { fetchWithAuth } from "./api";
import { Chat } from "../components/Chat";

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
}

// =========================================================

let gameChat: Chat | null = null;
let tournamenetState: TournamentData | null = null; // on stocke l'état du tournoi (Typé maintenant)
let activeGame: Game | null = null; // Instance du jeu

// pour nettoyer le tout quand on quitte la page
export function cleanup() {
    if (gameChat) {
        gameChat.destroy();
        gameChat = null;
    }
    tournamenetState = null;

    if (activeGame) {
        activeGame.isRunning = false;
        activeGame = null;
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

    const modal = document.getElementById('game-setup-modal') as HTMLElement;
    const startButton = document.getElementById('start-game-btn') as HTMLButtonElement;
    const nameInput = document.getElementById('opponent-name') as HTMLInputElement;
    const errorMsg = document.getElementById('error-message') as HTMLElement;

    const player1Display = document.getElementById('player-1-name') as HTMLElement;
    const player2Display = document.getElementById('player-2-name') as HTMLElement;
    
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

    // ccondition ne doit pas bloquer si on est en mode tournoi (car modal peut être null en mode tournoi)
    if (mode === 'local' && (!modal || !startButton || !nameInput)) {
        return;
    }


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
        gameChat.joinChannel("remote_game_room"); // on met l'id correspondant pour l room
        // iniitailiastion de la logique de jeu en remote
    } else if (mode == 'tournament') {
        gameChat.joinChannel("tournament_room"); // same ici
        // initialisation de la logique de jeu en tournoi
        initTournamenetMode();
    } else {
        gameChat.joinChannel("local_game_room");
        initLocalMode();
    }

    // affichage selon le mode, on rajoutera remote + tournoi plus tard
    if (mode === 'local') {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }


    // ---------------------------------------------------------
    // -------------- LOGIQUE DU JEU EN TOURNOI ----------------
    // ---------------------------------------------------------

    function initTournamenetMode() {
        const setupView = document.getElementById('tournament-setup');
        const nameInput = document.getElementById('tournament-name-input') as HTMLInputElement;
        const player1Input = document.getElementById('player1-input') as HTMLInputElement;
        const player2Input = document.getElementById('player2-input') as HTMLInputElement;
        const player3Input = document.getElementById('player3-input') as HTMLInputElement;
        const player4Input = document.getElementById('player4-input') as HTMLInputElement;

        const startButton = document.getElementById('start-tournament-btn'); 
        const errorDiv = document.getElementById('setup-error');


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

            // demarrage du tournoi 
            startTournamentLogic(tName, players);
        });
    }

    function startTournamentLogic(name: string, playersAliases: string[]) {
        // on retire la modale de slection des infos de jeu
        document.getElementById('tournament-setup')?.classList.add('hidden');

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
            currentStep: 'semi_final_1'
        };

        // on fait une annonce dans le chat 
        if (gameChat) {
            gameChat.sendSystemNotification(`Tournament "${name}" started! Participants: ${playersAliases.join(', ')}`);
        }

        showNextMatch();
    }

    // on affiche le prochain match, maj du titre finale etc, nom des joueurs, message et bouton play

    function showNextMatch() {
        // recuperation des elements du DOM
        const bracketView = document.getElementById('tournament-bracket'); // ecran pour la transition
        const title = document.getElementById('bracket-title');
        const player1Text = document.getElementById('next-p1');
        const player2Text = document.getElementById('next-p2');
        const infoText = document.getElementById('bracket-info');
        const playButton = document.getElementById('launch-match-btn');
        const gameArea = document.getElementById('tournament-game-area');

        if (!bracketView || !tournamenetState) return;

        // on masque le rest e
        gameArea?.classList.add('hidden');
        bracketView.classList.remove('hidden');

        const matchIdx = tournamenetState.currentMatchIdx;
        const match = tournamenetState.matches[matchIdx];
        
        // Alias safe pour affichage
        const p1Alias = match.p1 ? match.p1.alias : "???";
        const p2Alias = match.p2 ? match.p2.alias : "???";

        // on determinne la logique pour l'affichage des infos du match
        if (matchIdx === 0) {
            title!.innerText = "SEMI-FINAL 1";
            const nextMatch = tournamenetState.matches[1];
            const nextP1 = nextMatch.p1 ? nextMatch.p1.alias : "?";
            const nextP2 = nextMatch.p2 ? nextMatch.p2.alias : "?";
            
            infoText!.innerText = `Next match: ${nextP1} vs ${nextP2}`;
            // affichage dans le chat
            if (gameChat) gameChat.sendSystemNotification(`Next up: ${p1Alias} vs ${p2Alias} ! Later: ${nextP1} vs ${nextP2}`);
        } else if (matchIdx === 1) {
            title!.innerText = "SEMI-FINAL 2";
            infoText!.innerText = "Winner plays in the finale!";
            // affichage dans le chat
            if (gameChat) gameChat.sendSystemNotification(`Next up: ${p1Alias} vs ${p2Alias} ! The winner goes to the Final.`);
        } else {
            title!.innerText = "FINALE";
            infoText!.innerText = "Match de la finale";
            // affichage dans le chat
            if (gameChat) gameChat.sendSystemNotification(`FINAL: ${p1Alias} vs ${p2Alias} !`);
        }

        player1Text!.innerText = p1Alias;
        player2Text!.innerText = p2Alias;

        // on supprime les anciens event listeners du play bouton!
        const newButton = playButton!.cloneNode(true);
        playButton!.parentNode!.replaceChild(newButton, playButton!);

        newButton.addEventListener('click', () => {
            bracketView.classList.add('hidden');
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
        const gameArea = document.getElementById('tournament-game-area');
        const p1Name = document.getElementById('game-p1-name');
        const p2Name = document.getElementById('game-p2-name');

        if (gameArea) {
            gameArea.classList.remove('hidden');
            gameArea.style.display = 'flex'; 

            if (p1Name) p1Name.innerText = p1.alias;
            if (p2Name) p2Name.innerText = p2.alias;
        }

        console.log(`Lancement dy jeu: ${p1.alias} vs ${p2.alias}`);
        
        // on recupere le conteneur dans lequel on mets le jeu 
        let canvasContainer = document.getElementById('game-canvas-container');
        if (!canvasContainer && gameArea) {
             // securite au cas ou on trouve pas l'id
             canvasContainer = document.createElement('div');
             canvasContainer.id = 'game-canvas-container';
             canvasContainer.className = "flex-1 relative bg-black w-full h-full flex items-center justify-center";
             gameArea.appendChild(canvasContainer);
        }
        
        if (canvasContainer) {
            canvasContainer.innerHTML = ''; // on nettoie l'ancien match
            
            const canvas = document.createElement('canvas');
            canvas.id = 'pong-canvas-tournament';
            canvas.width = 1600; // check pour ajuste la taille a la fenetre de jeux
            canvas.height = 900; // check pour ajuste la taille a la fenetre de jeux
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.objectFit = 'contain';
            // Pour le moment, fond noir par defaut mais on ajustera 
            canvas.style.backgroundColor = 'black'; 
            
            canvasContainer.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                const input = new Input();
                if (activeGame) activeGame.isRunning = false;
                activeGame = new Game(canvas, ctx, input);
                activeGame.start();

                // + fin du jeu (endMatch())
                // on supervise le socre pour s'arreter a 11
                const checkInterval = setInterval(() => {
                    if (!activeGame || !activeGame.isRunning) {
                        clearInterval(checkInterval);
                        return;
                    }
                    // condition de victoire : PREMIER A 11
                    if (activeGame.score.player1 >= 11 || activeGame.score.player2 >= 11) {
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
        if (gameChat) gameChat.sendSystemNotification(`${winner} wins the match!`);

        if (idx === 0) {
            // vainqueur demi finale 1
            // on recupere le bon objet joueur pour la finale
            const winnerObj = (match.p1?.alias === winner) ? match.p1 : match.p2;
            tournamenetState.matches[2].p1 = winnerObj ? { ...winnerObj } : null;
            
            tournamenetState.currentMatchIdx++;
            tournamenetState.currentStep = 'semi_final_2';
            showNextMatch();
        } else if (idx === 1) {
            // vainqueur demi finale2 
            const winnerObj = (match.p1?.alias === winner) ? match.p1 : match.p2;
            tournamenetState.matches[2].p2 = winnerObj ? { ...winnerObj } : null;

            tournamenetState.currentMatchIdx++;
            tournamenetState.currentStep = 'final';
            showNextMatch();
        } else {
            // fin
            tournamenetState.currentStep = 'finished';
            showSummary(winner);
        }
    }

    function showSummary(champion: string) {
        document.getElementById('tournament-game-area')?.classList.add('hidden');
        const summaryView = document.getElementById('tournament-summary');
        
        if (summaryView) {
            summaryView.classList.remove('hidden');
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
        if (modal) modal.classList.remove('hidden');

        
        const startButton = document.getElementById('start-game-button');
        
        if (startButton) {
            startButton.addEventListener('click', () => {
            modal?.classList.add('hidden');
                // lancement du jeu!
            });
        }
    }

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
                if (bgDropdown) bgDropdown.classList.add('hidden');
            });

            bgGrid.appendChild(div);
        });

        if (bgResetButton) {
            bgResetButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const resetColor = '#FFFFFF';

                if (selectedBgPreview) selectedBgPreview.style.backgroundColor = resetColor;
                if (bgValueInput) bgValueInput.value = resetColor;
                if (gameField) gameField.style.backgroundColor = resetColor;
                
                bgDropdown.classList.toggle('hidden');
                if (ballDropdown) ballDropdown.classList.add('hidden');
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
        startButton.addEventListener('click', () => {
            const opponentName = nameInput.value.trim(); // l'opposent a besoin du name input

            // est-ce qu'on peut utliser un nom qui est egalement un usrename deja pris?
            if (opponentName === "") {
                if (errorMsg) errorMsg.classList.remove('hidden');
                nameInput.classList.add('border-red-500');
                return;
            }

            // envoi de la notifciation
            if (gameChat) {
                gameChat.sendSystemNotification(`Game is about to start! Match: ${player1Display.innerText} vs ${opponentName}`);
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

            const canvas = document.createElement('canvas');
            canvas.id = 'pong-canvas';
            canvas.width = 1600; // verifier la taille
            canvas.height = 900;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.objectFit = 'contain';
            canvas.style.backgroundColor = selectedBg; // faire la meme chose pour tous les modes 

            // Injection
            const targetContainer = document.getElementById('game-canvas-container') || gameField;
            targetContainer.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                const input = new Input();
                if (activeGame) activeGame.isRunning = false;
                activeGame = new Game(canvas, ctx, input);
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
                        
                        const userIdStr = localStorage.getItem('userId');
                        if (userIdStr) {
                            const userId = Number(userIdStr);
                            // on sauvegarde les statistiques
                            await saveGameStats(userId, activeGame.score.player1, p1Wins);
                        }
                        alert(`GAME OVER ! ${winnerName} remporte la partie !`);
                        window.location.reload();
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