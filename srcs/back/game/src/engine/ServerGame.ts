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

	// état et position actuelle dans le jeu
	public gameState: GameState = {
		ball: { x: 400, y: 300},
		paddle1: { y: 250 },
		paddle2: { y: 250 },
		score: { player1: 0, player2: 0}
	};

	// vitesse de la balle
	private ballVelocity = { x:5, y: 5 };

	constructor(public roomId: string, private io: any) {}

	startGameLoop() {
		// on mets 60fps soit 16ms
		setInterval(() => {
			this.update();
			// on envoit ;'etat du jeu a la room
			this.io.to(this.roomId).emit('gameState', this.gameState);
		}, 1000 / 60);
	}

	private update() {
		// on met a jour la position de la balle
		this.gameState.ball.x += this.ballVelocity.x;
		this.gameState.ball.y += this.ballVelocity.y;

		// gestion des collisions avec les murs en haut et en bas
		if (this.gameState.ball.y <= 0 || this.gameState.y >= this.height) {
			this.ballVelocity.y *= -1;
		}

		// gestion des collisions avec le paddle


		// gestion du score 
	}
	

	public handleInput(playerId: string, input: string) {
		// on doit identifier via playerid si c'est l'input de joueur 1 ou 2
		// on met a jour les paddles en conséquences
		const speed = 10;
		if (input === 'w') this.gameState.paddle1.y -= speed;
		if (input === 's') this.gameState.paddle1.y += speed;
		if (input === 'up') this.gameState.paddle2.y -= speed;
		if (input === 'down') this.gameState.paddle2.y += speed;
	}
}