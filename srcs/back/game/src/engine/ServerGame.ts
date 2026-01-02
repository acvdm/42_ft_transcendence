export interface GameState {
	ball: { x: number, y: number};
	paddle1: { y: number},
	paddle2: { y: number},
	score: { player1: number, player2: number};
}

export class ServerGame {
	// dimensions virtuelles pour le moment -> voir si on les adapte à la taille de la fenètre de jeu
	private width = 800;
	private height = 600;
	private paddleHeight = 100;
	private paddleWidth = 10;

	public player1Id: string | null = null;
	public player2Id: string | null = null;

	// état et position actuelle dans le jeu
	public gameState: GameState = {
		ball: { x: 400, y: 300},
		paddle1: { y: 250 },
		paddle2: { y: 250 },
		score: { player1: 0, player2: 0}
	};

	// vitesse de la balle
	private ballVelocity = { x:5, y: 5 };
	private gameLoopInterval: NodeJS.Timeout | null = null;

	constructor(public roomId: string, private io: any) {}

	startGameLoop() {
		if (this.gameLoopInterval) return; // Évite de lancer deux boucles

		console.log(`Starting game loop for room ${this.roomId}`);
		this.gameLoopInterval = setInterval(() => {
			this.update();
			this.io.to(this.roomId).emit('gameState', this.gameState);
		}, 1000 / 60);
	}

	stopGameLoop() {
		if (this.gameLoopInterval) {
			clearInterval(this.gameLoopInterval);
			this.gameLoopInterval = null;
		}
	}


	private update() {
		// 1. Mise à jour de la position de la balle
		this.gameState.ball.x += this.ballVelocity.x;
		this.gameState.ball.y += this.ballVelocity.y;

		// 2. Collisions avec les murs haut et bas
		// Correction du typo: this.gameState.y -> this.gameState.ball.y
		if (this.gameState.ball.y <= 0 || this.gameState.ball.y >= this.height) {
			this.ballVelocity.y *= -1;
		}

		// 3. Gestion des collisions avec les paddles
		// Paddle 1 (Gauche)
		if (this.gameState.ball.x <= 20 && // Position X proche du paddle
			this.gameState.ball.y >= this.gameState.paddle1.y &&
			this.gameState.ball.y <= this.gameState.paddle1.y + this.paddleHeight) {
			this.ballVelocity.x *= -1; // Rebond
			this.gameState.ball.x = 21; // Évite que la balle reste coincée
		}

		// Paddle 2 (Droite)
		if (this.gameState.ball.x >= this.width - 20 &&
			this.gameState.ball.y >= this.gameState.paddle2.y &&
			this.gameState.ball.y <= this.gameState.paddle2.y + this.paddleHeight) {
			this.ballVelocity.x *= -1;
			this.gameState.ball.x = this.width - 21;
		}

		// 4. Gestion du score et reset (Sortie d'écran)
		if (this.gameState.ball.x <= 0) {
			this.gameState.score.player2 += 1;
			this.resetBall();
		} else if (this.gameState.ball.x >= this.width) {
			this.gameState.score.player1 += 1;
			this.resetBall();
		}
	}
	

	private resetBall() {
		this.gameState.ball = { x: 400, y: 300 };
		// Inverse la direction au service et réinitialise la vitesse
		this.ballVelocity = { x: this.ballVelocity.x > 0 ? -5 : 5, y: 5 };
	}

	public handleInput(playerId: string, input: string) {
		const speed = 10;
		// Sécurité : seul le bon joueur peut bouger sa raquette
		if (playerId === this.player1Id) {
			if (input === 'w' || input === 'ArrowUp') this.gameState.paddle1.y = Math.max(0, this.gameState.paddle1.y - speed);
			if (input === 's' || input === 'ArrowDown') this.gameState.paddle1.y = Math.min(this.height - this.paddleHeight, this.gameState.paddle1.y + speed);
		}
		else if (playerId === this.player2Id) {
			if (input === 'up' || input === 'ArrowUp') this.gameState.paddle2.y = Math.max(0, this.gameState.paddle2.y - speed);
			if (input === 'down' || input === 'ArrowDown') this.gameState.paddle2.y = Math.min(this.height - this.paddleHeight, this.gameState.paddle2.y + speed);
		}
	}
}