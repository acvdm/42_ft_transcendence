import { fetchWithAuth } from "../../services/api";
import { ballEmoticons, gameBackgrounds } from "../Data";
import Game from "../../game/Game";
import Input from "../../game/Input";
import { getSqlDate, launchCountdown, launchConfetti } from "./GameUI";
import { Chat } from "../Chat";
import { getPlayerAlias } from "../../controllers/GamePage";
import i18next from "../../i18n";

interface GameContext {
	setGame: (game: Game | null) => void;
	getGame: () => Game | null;
	chat: Chat | null;
}

export interface TournamentPlayer 
{
	userId: number | null;
	alias: string;
	score: number;
}

export interface TournamentMatch 
{
	round: 'semi_final_1' | 'semi_final_2' | 'final';
	winner: string | null;
	p1: TournamentPlayer | null;
	p2: TournamentPlayer | null;
	startDate: string;
	endDate?: string | undefined;
}

export interface TournamentData 
{
	name: string;
	allPlayers: TournamentPlayer[];
	matches: TournamentMatch[];
	currentMatchIdx: number;
	currentStep: 'registration' | 'semi_final_1' | 'semi_final_2' | 'final' | 'finished';
	settings: {
		ballSkin: string;
		bgSkin: string;
	};
	startedAt: string
}

export class TournamentManager {
	private context: GameContext;
	private tournamentState: TournamentData | null = null;

	constructor(context: GameContext) {
		this.context = context;
	}

	public init() 
	{
		const setupModal = document.getElementById('tournament-setup-modal');
		if (setupModal) {
			setupModal.classList.remove('hidden');
		}

		const nameInput = document.getElementById('tournament-name-input') as HTMLInputElement;
		const player1Input = document.getElementById('player1-input') as HTMLInputElement;
		const player2Input = document.getElementById('player2-input') as HTMLInputElement;
		const player3Input = document.getElementById('player3-input') as HTMLInputElement;
		const player4Input = document.getElementById('player4-input') as HTMLInputElement;
		const startButton = document.getElementById('start-tournament-btn'); 
		const errorDiv = document.getElementById('setup-error');

		if (nameInput) {
			nameInput.maxLength = 45;
		}
		const pInputs = [player1Input, player2Input, player3Input, player4Input];
		pInputs.forEach(input => {
			if (input) {
				input.maxLength = 20;
			}
		});

		this.initTournamentSelectors();

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

		startButton?.addEventListener('click', () => {
			const tName = nameInput.value.trim();
			const players = [
				player1Input.value.trim(), 
				player2Input.value.trim(), 
				player3Input.value.trim(), 
				player4Input.value.trim()
			];

			if (!tName || players.some(p => !p)) {
				if (errorDiv) {
					errorDiv.innerText = i18next.t('tournamentManager.setup_error_fields');
					errorDiv.classList.remove('hidden');
				}
				return;
			}

			if (tName.length > 45 || players.some(p => p.length > 20)) {
				if (errorDiv) {
					errorDiv.innerText = i18next.t('tournamentManager.setup_error_length');
					errorDiv.classList.remove('hidden');
				}
				return ;
			}

			const uniqueCheck = new Set(players);
			if (uniqueCheck.size !== 4) {
				if (errorDiv) {
					errorDiv.innerText = i18next.t('tournamentManager.setup_error_unique');
					errorDiv.classList.remove('hidden');
				}
				return;
			}

			const ballVal = (document.getElementById('tour-ball-value') as HTMLInputElement)?.value || 'classic';
			const bgVal = (document.getElementById('tour-bg-value') as HTMLInputElement)?.value || '#E8F4F8';
			this.startTournamentLogic(tName, players, ballVal, bgVal);
		});
	}

	private initTournamentSelectors() {
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
		const gameContainer = document.getElementById('left');

		// Ball selection
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
						if(ballImg) {
							ballImg.src = imgUrl;
						}
						if(ballInput) {
							ballInput.value = imgUrl;
						}
						ballDrop.classList.add('hidden');
					});
					ballGrid.appendChild(div);
				}
			});
			ballBtn.addEventListener('click', (e) => { e.stopPropagation(); ballDrop.classList.toggle('hidden'); });
			document.addEventListener('click', (e) => { if (!ballDrop.contains(e.target as Node) && !ballBtn.contains(e.target as Node)) ballDrop.classList.add('hidden'); });
		}

		// Background selection
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
					if(bgPrev) {
						bgPrev.style.backgroundColor = color;
					}
					if(bgInput) {
						bgInput.value = color;
					}
					if(gameContainer) {
						gameContainer.style.backgroundColor = color;
					}
					bgDrop.classList.add('hidden');
				});
				bgGrid.appendChild(div);
			});

			// Reset button
			if (bgResetBtn) {
				bgResetBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					const resetColor = '#E8F4F8';
					if (bgPrev) {
						bgPrev.style.backgroundColor = resetColor;
					}
					if (bgInput) {
						bgInput.value = resetColor;
					}
					if (gameContainer) {
						gameContainer.style.backgroundColor = resetColor;
					}
					bgDrop.classList.add('hidden');
				});
			}

			bgBtn.addEventListener('click', (e) => { e.stopPropagation(); bgDrop.classList.toggle('hidden'); });
			document.addEventListener('click', (e) => { if (!bgDrop.contains(e.target as Node) && !bgBtn.contains(e.target as Node)) bgDrop.classList.add('hidden'); });
		}
	}

	private startTournamentLogic(name: string, playersAliases: string[], ballSkin: string, bgSkin: string) {
	   
		document.getElementById('tournament-setup-modal')?.classList.add('hidden');
		const userIdStr = localStorage.getItem('userId');
		const userIdNb = userIdStr ? Number(userIdStr) : null;
		const playersObjects: TournamentPlayer[] = playersAliases.map((alias, index) => ({
			alias: alias,
			userId: (index === 0) ? userIdNb : null,
			score: 0
		}));

		const startDate = getSqlDate();
		this.tournamentState = {
			name: name,
			startedAt: startDate,
			allPlayers: playersObjects,
			matches: [
				{ round: 'semi_final_1', winner: null, p1: playersObjects[0], p2: playersObjects[1], startDate: startDate, endDate: startDate }, // 1er duo
				{ round: 'semi_final_2', winner: null, p1: playersObjects[2], p2: playersObjects[3], startDate: startDate, endDate: startDate }, // 2eme duo
				{ round: 'final',        winner: null, p1: null,              p2: null, startDate: startDate, endDate: startDate }               // finale
			],
			currentMatchIdx: 0,
			currentStep: 'semi_final_1',
			settings: { ballSkin, bgSkin }
		};

		if (this.context.chat) {
			this.context.chat.addSystemMessage(i18next.t('tournamentManager.chat_start', { 
				name: name, 
				players: playersAliases.join(', ') 
			}));
		}
		this.showBracketModal();
	}


	private showBracketModal() {
		const bracketModal = document.getElementById('tournament-bracket-modal');
		if (!bracketModal || !this.tournamentState) {
			return;
		}

		const sf1 = document.getElementById('bracket-sf1');
		const sf2 = document.getElementById('bracket-sf2');
		const fin = document.getElementById('bracket-final');
		const msg = document.getElementById('bracket-status-msg');

		// SF1
		const m1 = this.tournamentState.matches[0];
		const w1 = m1.winner ? `✅ ${m1.winner}` : null;
		if (sf1) {
			sf1.innerText = w1 || `${m1.p1?.alias} vs ${m1.p2?.alias}`;
		}

		// SF2
		const m2 = this.tournamentState.matches[1];
		const w2 = m2.winner ? `✅ ${m2.winner}` : null;
		if (sf2) {
			sf2.innerText = w2 || `${m2.p1?.alias} vs ${m2.p2?.alias}`;
		}

		// Finale
		const mf = this.tournamentState.matches[2];
		const p1Final = mf.p1 ? mf.p1.alias : '?';
		const p2Final = mf.p2 ? mf.p2.alias : '?';
		if (fin) {
			fin.innerText = mf.winner ? `👑 ${mf.winner}` : `${p1Final} vs ${p2Final}`;
		}

		const idx = this.tournamentState.currentMatchIdx;
		if (msg) {
			if (idx === 0) {
				msg.innerText = i18next.t('tournamentManager.bracket_next_sf1');
			} else if (idx === 1) {
				msg.innerText = i18next.t('tournamentManager.bracket_next_sf2');
			} else if (idx === 2) {
				msg.innerText = i18next.t('tournamentManager.bracket_next_final');
			}
		}

		bracketModal.classList.remove('hidden');
		const btn = document.getElementById('bracket-continue-btn');
		const newBtn = btn?.cloneNode(true) as HTMLElement;
		btn?.parentNode?.replaceChild(newBtn, btn!);

		newBtn.addEventListener('click', () => {
			 bracketModal.classList.add('hidden');
			 this.showNextMatchModal();
		});
	}

	private showNextMatchModal() {
		const nextMatchModal = document.getElementById('tournament-next-match-modal');
		const title = document.getElementById('match-title');
		const player1Text = document.getElementById('next-p1');
		const player2Text = document.getElementById('next-p2');
		const playButton = document.getElementById('launch-match-btn');

		if (!nextMatchModal || !this.tournamentState) {
			return;
		}

		const matchIdx = this.tournamentState.currentMatchIdx;
		const match = this.tournamentState.matches[matchIdx];
		const p1Alias = match.p1 ? match.p1.alias : "???";
		const p2Alias = match.p2 ? match.p2.alias : "???";

		if (matchIdx === 0) {
			if(title) {
				title.innerText = i18next.t('tournamentManager.match_sf1');
			}
			if (this.context.chat) {
				this.context.chat.addSystemMessage(i18next.t('tournamentManager.chat_next_match', { p1: p1Alias, p2: p2Alias }));
			}
		} else if (matchIdx === 1) {
			if(title) {
				title.innerText = i18next.t('tournamentManager.match_sf2');
			}
			if (this.context.chat) {
				this.context.chat.addSystemMessage(i18next.t('tournamentManager.chat_next_match', { p1: p1Alias, p2: p2Alias }));
			}
		} else {
			if(title) {
				title.innerText = i18next.t('tournamentManager.match_final');
			}
			if (this.context.chat) {
				this.context.chat.addSystemMessage(i18next.t('tournamentManager.chat_final_match', { p1: p1Alias, p2: p2Alias }));
			}
		}

		if(player1Text) {
			player1Text.innerText = p1Alias;
		}
		if(player2Text) {
			player2Text.innerText = p2Alias;
		}
		nextMatchModal.classList.remove('hidden');
		const newButton = playButton!.cloneNode(true);
		playButton!.parentNode!.replaceChild(newButton, playButton!);

		newButton.addEventListener('click', () => {
			nextMatchModal.classList.add('hidden');
			if (match.p1 && match.p2) {
				this.launchMatch(match.p1, match.p2);
			}
		});
	}

	private launchMatch(p1: TournamentPlayer, p2: TournamentPlayer) {
		const p1Name = document.getElementById('player-1-name');
		const p2Name = document.getElementById('player-2-name');
		const gameStartDate = getSqlDate();
		
		if (p1Name) {
			p1Name.innerText = p1.alias;
		}
		if (p2Name) {
			p2Name.innerText = p2.alias;
		}

		const scoreBoard = document.getElementById('score-board');
			if (scoreBoard) {
				console.log("TournamentManager.ts, line 349");
				scoreBoard.innerText = "0 - 0";
			}

		const container = document.getElementById('left');
		if (container && this.tournamentState) {
			container.style.backgroundColor = this.tournamentState.settings.bgSkin;
		}

		let canvasContainer = document.getElementById('game-canvas-container');
		if (canvasContainer) {
			canvasContainer.innerHTML = '';
			
			const canvas = document.createElement('canvas');
			canvas.id = 'pong-canvas-tournament';
			canvas.width = canvasContainer.clientWidth;
			canvas.height = canvasContainer.clientHeight;
			console.log("heigh:", canvasContainer.clientHeight);
			console.log("width:", canvasContainer.clientWidth);
			canvas.style.width = '100%';
			canvas.style.height = '100%';
			canvasContainer.appendChild(canvas);

			const ctx = canvas.getContext('2d');
			if (ctx && this.tournamentState) {
				const input = new Input();
				if (this.context.getGame()) {
					this.context.getGame()!.isRunning = false;
				}
				
				const newGame = new Game(canvas, ctx, input, this.tournamentState.settings.ballSkin);
				this.context.setGame(newGame);
				newGame.onScoreChange = (score) => {
					const scoreBoard = document.getElementById('score-board');
					if (scoreBoard) {
						scoreBoard.innerText = `${score.player1} - ${score.player2}`;
					}
				};
				
				newGame.start();

				const checkInterval = setInterval(() => {
					const activeGame = this.context.getGame();
					if (!activeGame || !activeGame.isRunning) {
						clearInterval(checkInterval);
						return;
					}

					if (activeGame.score.player1 >= 5 || activeGame.score.player2 >= 5) {
						activeGame.isRunning = false;
						clearInterval(checkInterval);
						const winnerAlias = activeGame.score.player1 > activeGame.score.player2 ? p1.alias : p2.alias;
						this.endMatch(winnerAlias, activeGame.score.player1, activeGame.score.player2, gameStartDate);
					}
				}, 500);
			}
		}
	}

	private endMatch(winner: string, scoreP1: number, scoreP2: number, gameStartDate: string) {
		if (!this.tournamentState) {
			return;
		}

		const idx = this.tournamentState.currentMatchIdx;
		const match = this.tournamentState.matches[idx];

		match.startDate = gameStartDate;
		match.endDate = getSqlDate();
		match.winner = winner;

		if (match.p1) {
			match.p1.score = scoreP1;
		}
		if (match.p2) {
			match.p2.score = scoreP2;
		}
		if (match.p1 && match.p1.userId) {
			const isWinner = (match.p1.alias === winner);
		}
		if (match.p2 && match.p2.userId) {
			const isWinner = (match.p2.alias === winner);
		}
		if (this.context.chat) {
			this.context.chat.addSystemMessage(i18next.t('tournamentManager.chat_winner', { winner: winner }));
		}
		if (idx === 0) {
			const winnerObj = (match.p1?.alias === winner) ? match.p1 : match.p2;
			this.tournamentState.matches[2].p1 = winnerObj ? { ...winnerObj } : null;
			this.tournamentState.currentMatchIdx++;
			this.tournamentState.currentStep = 'semi_final_2';
			this.showBracketModal();
		} else if (idx === 1) {
			const winnerObj = (match.p1?.alias === winner) ? match.p1 : match.p2;
			this.tournamentState.matches[2].p2 = winnerObj ? { ...winnerObj } : null;
			this.tournamentState.currentMatchIdx++;
			this.tournamentState.currentStep = 'final';
			this.showBracketModal();
		} else {
			this.tournamentState.currentStep = 'finished';
			this.showSummary(winner);
		}
	}


	private showSummary(champion: string) {
		launchConfetti(4000);
		const container = document.getElementById('left');
		if (container) {
			container.style.backgroundColor = 'white';
		}
		
		const summaryModal = document.getElementById('tournament-summary-modal');
		
		if (summaryModal) {
			summaryModal.classList.remove('hidden');
			const winnerDisplay = document.getElementById('winner-name');
			const tourNameDisplay = document.getElementById('tour-name-display');
			
			if (winnerDisplay) {
				winnerDisplay.innerText = champion;
			}
			if (tourNameDisplay && this.tournamentState) {
				tourNameDisplay.innerText = this.tournamentState.name;
			}
			if (this.context.chat) {
				this.context.chat.addSystemMessage(i18next.t('tournamentManager.chat_winner', { winner: champion }));
			}

			const userId = localStorage.getItem('userId');
			if (userId) {
				this.saveTournamentToApi(champion);
			}

			document.getElementById('quit-tournament-btn')?.addEventListener('click', () => {
				window.history.back();
			});

			document.getElementById('quit-remote-btn')?.addEventListener('click', () => {
				window.history.back();
			});
		}
	}

	private async saveTournamentToApi(winner: string) {
		
		if (!this.tournamentState) {
			return;
		}

		try {
			await fetchWithAuth('api/game/tournaments', {
				method: 'POST',
				body: JSON.stringify({
					name: this.tournamentState.name,
					winner: winner,
					participants: this.tournamentState.allPlayers,
					tournamentName: this.tournamentState.name,
					matchList: this.tournamentState.matches,
					startedAt: this.tournamentState.startedAt
				})
			});
		} catch (e) { console.error(e); }
	}
}