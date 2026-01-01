import htmlContentLocal from "./LocalGame.html";
import htmlContentRemote from "./RemoteGame.html";
import htmlContentTournament from "./TournamentPage.html";
import { ballEmoticons, gameBackgrounds } from "../components/Data";
import { fetchWithAuth } from "./api";
import { Chat } from "../components/Chat";
import { startTournament, recordMatchResult, tournamentState } from "./Tournament";
import Game from "../../../shared/pong/Game";
import Input from "../../../shared/pong/Input";


let gameChat: Chat | null = null;
let currentGame: any = null; // on stocke l'état du tournoi

// pour nettoyer le tout quand on quitte la page
export function cleanup() {
    if (gameChat) {
        gameChat.destroy();
        gameChat = null;
    }
    if (currentGame && currentGame.stop) {
        currentGame.stop();
    }
    currentGame = null;
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

    if (!modal || !startButton || !nameInput) {
        // potentiellement ca n'existe pas en mode tournoi donc pS DE return immediat
        if (mode !== 'tournament') return;
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
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    } else if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
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
        const startTournamentButton = document.getElementById('start-tournament-btn');
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

        startTournamentButton?.addEventListener('click', () => {
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

            // j'appelle la fonction pour ibitialisaé le tout
            startTournament(tName, players);
            setupView?.classList.add('hidden'); // je degage la modale
            if (gameChat) { // annonce dans le chat
                gameChat.sendSystemNotification(`Tournament "${tName}" started! Participants: ${players.join(', ')}`);
            }
            // affichage du premier match
            showNextMatch();
        });
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

        if (!bracketView) return;

        // on masque le rest e
        document.getElementById('tournament-game-area')?.classList.add('hidden');
        bracketView.classList.remove('hidden');

        // on lit l'etat depuis le fichier tournamenet
        const currentStep = tournamentState.currentStep;

        let p1Name = "?"; // pour le moment?
        let p2Name = "?";

        // qu'est-ce qu'on affiche selon quelle étape du tournoi 
        if (currentStep === 'semi_final_1') {
            title!.innerText = "SEMI-FINAL 1";
            p1Name = tournamentState.players[0].alias;
            p2Name = tournamentState.players[1].alias;
            infoText!.innerText = "The winner goes to the finale!";
            if (gameChat) gameChat.sendSystemNotification(`Next up: ${p1Name} vs ${p2Name}`);
        } 
        else if (currentStep === 'semi_final_2') {
            title!.innerText = "SEMI-FINAL 2";
            p1Name = tournamentState.players[2].alias;
            p2Name = tournamentState.players[3].alias;
            infoText!.innerText = "The winner goes to the finale!";
            if (gameChat) gameChat.sendSystemNotification(`Next up: ${p1Name} vs ${p2Name}`);
        } 
        else if (currentStep === 'final') {
            title!.innerText = "FINALE ";


            // ON REcuperer les gagnants des autres matchs
            p1Name = tournamentState.matches[0].winner;
            p2Name = tournamentState.matches[1].winner;
            infoText!.innerText = "This is the finale countdown TI DI DI DI TI LI LI TI TI !";
            if (gameChat) gameChat.sendSystemNotification(`FINAL: ${p1Name} vs ${p2Name}`);
        }
        else if (currentStep === 'finished') {
            // si c'est la fin, on affiche le resultat
            showSummary(tournamentState.matches[2].winner);
            return;
        }

        if (player1Text) player1Text.innerText = p1Name;
        if (player2Text) player2Text.innerText = p2Name;

        // on supprime les anciens event listeners du play bouton pour éviter les doublons
        const newButton = playButton!.cloneNode(true);
        playButton!.parentNode!.replaceChild(newButton, playButton!);

        newButton.addEventListener('click', () => {
            bracketView.classList.add('hidden');
            launchMatch(p1Name, p2Name);
        });
    }

    function launchMatch(p1: string, p2: string) {
        const gameArea = document.getElementById('tournament-game-area');
        const p1Name = document.getElementById('game-p1-name');
        const p2Name = document.getElementById('game-p2-name');
        const canvasContainer = document.getElementById('game-canvas-container');

        if (gameArea) {
            gameArea.classList.remove('hidden');
            if (p1Name) p1Name.innerText = p1;
            if (p2Name) p2Name.innerText = p2;
        }

        console.log(`Lancement dy jeu: ${p1} vs ${p2}`);
        
        // integration du jeu!!!!
        // simulation du jeu
        if (canvasContainer) {
            canvasContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-white">
                    <h2 class="text-2xl mb-4">MATCH IN PROGRESS...</h2>
                    <p class="mb-4 text-gray-400">Physics engine not loaded yet.</p>
                    <div class="flex gap-4">
                        <button id="sim-win-p1" class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 font-bold">
                            Win ${p1}
                        </button>
                        <button id="sim-win-p2" class="px-4 py-2 bg-red-600 rounded hover:bg-red-500 font-bold">
                            Win ${p2}
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('sim-win-p1')?.addEventListener('click', () => {
                endMatch(p1, 11, 5); // Score de test
            });
            document.getElementById('sim-win-p2')?.addEventListener('click', () => {
                endMatch(p2, 8, 11); // Score de test
            });
        }

    }

    function endMatch(winner: string, score1: number, score2: number) {
        if (currentGame && currentGame.stop) currentGame.stop();
        currentGame = null;

        // on enregistre le resultat, maj de tout 
        recordMatchResult(winner, score1, score2);
        if (gameChat) {
            gameChat.sendSystemNotification(`${winner} wins the match!`);
        }

        if (tournamentState.currentStep === 'finished') {
            showSummary(winner);
        } else {
            showNextMatch();
        }
    }

    function showSummary(champion: string) {
        document.getElementById('tournament-game-area')?.classList.add('hidden');
        document.getElementById('tournament-bracket')?.classList.add('hidden');

        const summaryView = document.getElementById('tournament-summary');
        
        if (summaryView) {
            summaryView.classList.remove('hidden');
            const winnerDisplay = document.getElementById('winner-name');
            const tourNameDisplay = document.getElementById('tour-name-display');
            
            if (winnerDisplay) winnerDisplay.innerText = champion;
            if (tourNameDisplay) tourNameDisplay.innerText = tournamentState.name;
        
            document.getElementById('quit-tournament-btn')?.addEventListener('click', () => {
                cleanup();
                window.history.back();
            });
        }
    }



// =========================================================
// =========       LOGIQUE LOCALE 1v1 ======================
// =========================================================
    function initLocalMode() {
        // On utilise 'startButton' qui est déjà déclaré en haut de initGamePage
        if (startButton) {
            startButton.addEventListener('click', () => {
                const opponentName = nameInput.value.trim();

                if (opponentName === "") {
                    if (errorMsg) errorMsg.classList.remove('hidden');
                    nameInput.classList.add('border-red-500');
                    return;
                }

                // On récupère le container vide dans LocalGame.html
                const gameContainer = document.querySelector('#left .flex-1') as HTMLElement;
                if (gameContainer) {
                    gameContainer.innerHTML = ''; // On nettoie
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = 800; 
                    canvas.height = 600;
                    canvas.style.width = "100%";
                    canvas.style.height = "100%";
                    gameContainer.appendChild(canvas);

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // On instancie TON code (Input, Game)
                        const input = new Input(); 
                        const game = new Game(canvas, ctx, input);
                        
                        // On applique ton fond choisi
                        canvas.style.backgroundColor = bgValueInput.value;

                        game.start();
                        currentGame = game; // Pour le nettoyage (cleanup)

                        if (gameChat) {
                            gameChat.sendSystemNotification(`Game started: ${player1Display.innerText} vs ${opponentName}`);
                        }
                    }
                }

                if (player2Display) {
                    player2Display.innerText = opponentName;
                }
                
                modal?.classList.add('hidden');
                modal?.classList.remove('flex');
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
    // resrt erreur ecritur e
    nameInput.addEventListener('input', () => {
        if (errorMsg) errorMsg.classList.add('hidden');
        nameInput.classList.remove('border-red-500');
    });
}