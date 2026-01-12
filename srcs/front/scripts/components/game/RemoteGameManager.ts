import { fetchWithAuth } from "../../services/api";
import SocketService from '../../services/SocketService';
import { ballEmoticons, gameBackgrounds } from "../Data";
import Game from "../../game/Game";
import Input from "../../game/Input";
import { getSqlDate, launchCountdown, showVictoryModal, showRemoteEndModal } from "./GameUI";
import { Chat } from "../Chat";
import { getPlayerAlias } from "../../controllers/GamePage";

interface GameContext {
    setGame: (game: Game | null) => void;
    getGame: () => Game | null;
    chat: Chat | null;
}

export class RemoteGameManager {
    private context: GameContext;
    private currentP1Alias: string = "Player 1";
    private currentP2Alias: string = "Player 2";

    constructor(context: GameContext) {
        this.context = context;
    }

    public init() {
        const socketService = SocketService.getInstance();
        socketService.connectGame();
        const gameSocket = socketService.getGameSocket();

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
        const gameContainer = document.getElementById('left');

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


        const startGameFromData = async (data: any, p1Alias?: string, p2Alias?: string) => {

            const myAlias = await getPlayerAlias();
            const myId = Number(localStorage.getItem('userId'));
            let opponentId = data.opponent ? Number(data.opponent) : null;
            const remoteP1Alias = data.p1?.alias || data.player1?.alias || p1Alias;
            const remoteP2Alias = data.p2?.alias || data.player2?.alias || p2Alias;
            let p1Id: number | null = (data.role === 'player1') ? myId : opponentId;
            let p2Id: number | null = (data.role === 'player2') ? myId : opponentId;
            let opponentAlias = "Opponent";

            if (data.role === 'player1') 
            {
                this.currentP1Alias = myAlias;
                if (remoteP2Alias) {
                    opponentAlias = remoteP2Alias;
				}
                this.currentP2Alias = opponentAlias;
            } 
            else 
            {
                if (remoteP1Alias) {
                    opponentAlias = remoteP1Alias;
				}
                this.currentP1Alias = opponentAlias;
                this.currentP2Alias = myAlias;
            }

            const p1Display = document.getElementById('player-1-name');
            const p2Display = document.getElementById('player-2-name');
            const scoreBoard = document.getElementById('score-board');

            if (scoreBoard) {
                scoreBoard.innerText = "0 - 0";
            }
            if (p1Display && p2Display) 
            {
                p1Display.innerText = (data.role === 'player1') ? `${this.currentP1Alias} (Me)` : this.currentP1Alias;
                p2Display.innerText = (data.role === 'player2') ? `${this.currentP2Alias} (Me)` : this.currentP2Alias;
            }

            let gameStartDate = getSqlDate();

            if (data.opponent) {
                fetchWithAuth(`api/user/${data.opponent}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(userData => {
                        if (userData && userData.alias) {
                            const realOpponentName = userData.alias;
    
                            if (data.role === 'player1') {
                                this.currentP2Alias = realOpponentName;
                                if (p2Display) {
									p2Display.innerText = realOpponentName;
								}
                            } else {
                                this.currentP1Alias = realOpponentName;
                                if (p1Display) {
									p1Display.innerText = realOpponentName;
								}
                            }
                        }
                    })
                    .catch(e => console.error("Error retrieving opponent alias:", e));
            }

            if (this.context.chat) {
                this.context.chat.joinChannel(data.roomId);
                this.context.chat.addSystemMessage(`Match started!`);
            }

            if (status) {
				status.innerText = "We found an opponent ! Starting the game...";
			}
            if (modal) {
				modal.style.display = 'none';
			}

            if (container) {
                container.innerHTML = '';
                const canvas = document.createElement('canvas');
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                container.appendChild(canvas);

                if (canvas.width === 0) {
					canvas.width = 800;
				}
                if (canvas.height === 0) {
					canvas.height = 600;
				}

                const ctx = canvas.getContext('2d');
                const input = new Input();
                const selectedBallSkin = ballInput ? ballInput.value : 'classic';

                if (ctx) {
                    if (this.context.getGame()) {
                        this.context.getGame()!.stop();
                        this.context.setGame(null);
                    }

                    const newGame = new Game(canvas, ctx, input, selectedBallSkin);
                    this.context.setGame(newGame);

					// Rival is leaving the game
                    gameSocket.off('opponentLeft');
                    gameSocket.on('opponentLeft', async (eventData: any) => {
                        const activeGame = this.context.getGame();
                        if (activeGame) {
                            activeGame.isRunning = false;
                            activeGame.stop();
                            gameSocket.off('gameState');
                            gameSocket.off('gameEnded');
                            
                            const s1 = activeGame.score.player1;
                            const s2 = activeGame.score.player2;
                            let winnerAlias = "";

                            if (data.role === 'player1') {
                                winnerAlias = this.currentP1Alias;
                            } else {
                                winnerAlias = this.currentP2Alias;
                            }

                            await this.saveRemoteGameToApi (
                                this.currentP1Alias, s1, p1Id,
                                this.currentP2Alias, s2, p2Id,
                                winnerAlias,
                                gameStartDate
                            )

                            showRemoteEndModal(myAlias, "(Opponent forfeit)");
                            this.context.setGame(null);
                        }
                    });

                    newGame.onGameEnd = async (endData) => {
                        let winnerAlias = "Winner";
                        
                        if (endData.winner === 'player1') {
							winnerAlias = this.currentP1Alias;
						} else if (endData.winner === 'player2') {
							winnerAlias = this.currentP2Alias;
						}

                        const activeGame = this.context.getGame();
                        if (activeGame) {
                            const s1 = activeGame.score.player1;
                            const s2 = activeGame.score.player2;

                            if (data.role === 'player1') {
                                await this.saveRemoteGameToApi(
                                    this.currentP1Alias, s1, p1Id,
                                    this.currentP2Alias, s2, p2Id,
                                    winnerAlias,
                                    gameStartDate
                                )
                            }
                        }
                        
                        showVictoryModal(winnerAlias, this.context.chat);
                        this.context.setGame(null);
                    };

                    newGame.onScoreChange = (score) => {
                        const sb = document.getElementById('score-board');
                        if (sb) {
							sb.innerText = `${score.player1} - ${score.player2}`;
						}
							
                    };

                    launchCountdown(() => {
                        const activeGame = this.context.getGame();
                        if (activeGame) {
                            gameStartDate = getSqlDate();
                            activeGame.startRemote(data.roomId, data.role);
                        }
                    });
                }

            }
        };

		const pendingMatch = sessionStorage.getItem('pendingMatch');
        if (pendingMatch) {
            const data = JSON.parse(pendingMatch);
            sessionStorage.removeItem('pendingMatch');
            startGameFromData(data);
        }
		
        const privateRoomId = sessionStorage.getItem('privateGameId');

        if (btn) {

            // on va cloner le bouton pour supprimer les anciens listeners et commencer avec un truc propre
            const newBtn = btn.cloneNode(true) as HTMLButtonElement;
            btn.parentNode?.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', async () => {
                if (!gameSocket) {
                    alert("Error: lost connexion to game server");
                    return;
                }

                const scoreBoard = document.getElementById('score-board');

                if (scoreBoard) {
                    scoreBoard.innerText = "0 - 0";
                }

                newBtn.disabled = true;

                if (privateRoomId) {
                    if (status) {
						status.innerText = "Waiting for your friend in private room...";
					}

                    newBtn.innerText = "WAITING FOR FRIEND...";
                    gameSocket.off('matchFound');
                    gameSocket.on('matchFound', (data: any) => {
                        sessionStorage.removeItem('privateGameId'); 
                        startGameFromData(data);
                    });

                    const selectedBall = ballInput ? ballInput.value : 'classic';
                    gameSocket.emit('joinPrivateGame', { 
                        roomId: privateRoomId,
                        skin: selectedBall 
                    });
                } else {
                    if (status) {
						status.innerText = "Looking for a rival...";
					}
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

    private async saveRemoteGameToApi(
        p1Alias: string, p1Score: number, p1Id: number | null,
        p2Alias: string, p2Score: number, p2Id: number | null,
        winnerAlias: string,
        startDate: string,
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
                    type: "remote",
                    winner: winnerAlias,
                    status: "finished",
                    round: "1v1",
                    startDate: startDate,
                    endDate: endDate,
                    p1: { alias: p1Alias, score: p1Score, userId: p1Id },
                    p2: { alias: p2Alias, score: p2Score, userId: p2Id}
                })
            });

            if (!response.ok) {
                console.error("Error while saving remote game");
            }
            else {
                console.log("remote game successfully saved");
            }
        } 
        catch (e) 
        { 
            console.error(e); 
        }
    }
}