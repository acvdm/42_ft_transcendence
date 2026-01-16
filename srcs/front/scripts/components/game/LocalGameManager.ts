import { fetchWithAuth } from "../../services/api";
import { ballEmoticons, gameBackgrounds } from "../Data";
import Game from "../../game/Game";
import Input from "../../game/Input";
import { getSqlDate, launchCountdown, showVictoryModal } from "./GameUI";
import { Chat } from "../Chat";
import i18next from "../../i18n";

interface GameContext {
	setGame: (game: Game | null) => void;
	getGame: () => Game | null;
	chat: Chat | null;
}

function escapeHtml(text: string): string {
	if (!text) return text;
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}


//================================================
//============ LOCAL GAME MANAGEMENT =============
//================================================

export class LocalGameManager {
	private context: GameContext;

	constructor(context: GameContext) {
		this.context = context;
	}


	public init() {
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

		if (nameInput) {
			nameInput.maxLength = 30;
		}

		if (modal) {
			modal.classList.remove('hidden');
		}

		if (ballButton && ballDropdown && ballGrid) {

			const uniqueUrls = new Set<string>();
			ballGrid.innerHTML = '';
			
			Object.keys(ballEmoticons).forEach(key => {
				const imgUrl = ballEmoticons[key];
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

		// Background selection
		if (bgButton && bgDropdown && bgGrid) {
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


		// Starting the game
		if (startButton) 
		{
			let p1Alias = localStorage.getItem('username') || sessionStorage.getItem('cachedAlias') || i18next.t('gamePage.default_guest');
			
			const newStartBtn = startButton.cloneNode(true);
			startButton.parentNode?.replaceChild(newStartBtn, startButton);
			newStartBtn.addEventListener('click', () => {
				const rawName = nameInput.value.trim();
				const opponentName = escapeHtml(rawName);

				if (opponentName === "") {
					if (errorMsg) errorMsg.classList.remove('hidden');
					nameInput.classList.add('border-red-500');
					return;
				}

				if (opponentName.length > 30)
				{
					if (errorMsg)
					{
						errorMsg.innerText = i18next.t('localPage.erro_name_length');
						errorMsg.classList.remove('hidden');
					}
					return ;
				}

				if (this.context.chat) {
					this.context.chat.addSystemMessage(i18next.t('localPage.chat_start_match', {
						p1: p1Alias,
						p2: opponentName
					}));
				}

				const selectedBall = ballValueInput ? ballValueInput.value : 'classic';
				const selectedBg = bgValueInput ? bgValueInput.value : '#E8F4F8';

				if (player2Display) {
					player2Display.innerText = opponentName;
				}

				if (gameField) {
					gameField.style.backgroundColor = selectedBg;
				}

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
					console.log("localGameManager line 184");
					const canvas = document.createElement('canvas');
					canvas.id = 'pong-canvas';
					canvas.width = canvasContainer ? canvasContainer.clientWidth : 800;
					canvas.height = canvasContainer ? canvasContainer.clientHeight : 600;
					console.log("heigh:", canvasContainer?.clientHeight);
					console.log("width:", canvasContainer?.clientWidth);
					canvas.style.width = '100%';
					canvas.style.height = '100%';
					canvas.style.backgroundColor = selectedBg;
	
					const targetContainer = document.getElementById('game-canvas-container') || gameField;
					targetContainer.appendChild(canvas);
	
					const ctx = canvas.getContext('2d');
					if (ctx) {
						const input = new Input();
						if (this.context.getGame()) {
							this.context.getGame()!.isRunning = false;
						}

						const newGame = new Game(canvas, ctx, input, selectedBall);
						this.context.setGame(newGame);
						
						newGame.onScoreChange = (score) => {
							if (scoreBoard) {
								scoreBoard.innerText = `${score.player1} - ${score.player2}`;
							}
						}
	
						newGame.start();
						const startDate = getSqlDate();
						const localLoop = setInterval(async () => {
							const activeGame = this.context.getGame();
							if (!activeGame || !activeGame.isRunning) {
								clearInterval(localLoop);
								return;
							}                    
						
							if (activeGame.score.player1 >= 11 || activeGame.score.player2 >= 11) {
								activeGame.isRunning = false;
								clearInterval(localLoop); 

								const p1Score = activeGame.score.player1;
								const p2Score = activeGame.score.player2;
								const p1Alias = localStorage.getItem('username') || sessionStorage.getItem('cachedAlias') || i18next.t('gamePage.default_guest');
								const p2Alias = opponentName;
								const p1Wins = p1Score > p2Score;
								const winnerAlias = p1Wins ? p1Alias : p2Alias;
								const userIdStr = localStorage.getItem('userId');
								if (userIdStr) 
								{
									const userId = Number(userIdStr);
									await this.saveLocalGameToApi(p1Alias, p2Alias, p1Score, p2Score, winnerAlias, startDate, userId);
								}
								showVictoryModal(winnerAlias, this.context.chat);
							}
						}, 500);
					}
				});
			});
		}

		if (nameInput) {
			nameInput.addEventListener('input', () => {
				if (errorMsg) errorMsg.classList.add('hidden');
				nameInput.classList.remove('border-red-500');
			});
		}
	}


//================================================
//================= SAVING DATAS =================
//================================================

	private async saveLocalGameToApi(
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
			} else {
				console.log("Local game successfully saved");
			}
		} catch (e) { 
			console.error(e); 
		}
	}
}