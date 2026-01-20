import { Socket, Server } from 'socket.io';

const privateWaitingRooms = new Map<string, string>();

interface GameState {
	roomId: string;
	player1Id: string;
	player2Id: string;
	ball: { x: number, y: number, vx: number, vy: number, radius: number };
	paddle1: { y: number, height: number, width: number, x: number };
	paddle2: { y: number, height: number, width: number, x: number };
	score: { player1: number, player2: number };
	canvasWidth: number;
	canvasHeight: number;
	intervalId?: NodeJS.Timeout;
	startAt?: number;
	serveDirection: number;
	ballLaunchAt?: number;
}

let waitingQueue: string[] = [];
const activeGames = new Map<string, GameState>();
const GAMESPEED = 1000 / 60;
const WINNING_SCORE = 11;

export function initGameState(roomId: string, p1: string, p2: string): GameState {
	console.log("initRemotGameState");
	return {
		roomId,
		player1Id: p1,
		player2Id: p2,
		canvasWidth: 800,
		canvasHeight: 600,
		ball: { x: 400, y: 300, vx: 5, vy: 5, radius: 10 },
		paddle1: { x: 30, y: 250, width: 10, height: 100 },
		paddle2: { x: 760, y: 250, width: 10, height: 100 },
		score: { player1: 0, player2: 0 },
		startAt: Date.now() + 3500,
		serveDirection: 1
	};
}

function resetBall(game: GameState, dir: number = 1) {
	game.ball.x = game.canvasWidth / 2;
	game.ball.y = game.canvasHeight / 2;
	game.serveDirection = dir;
	const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6);
	const speed = 7;
	const direction = Math.random() > 0.5 ? 1 : -1;
	game.ball.vx = game.serveDirection * speed * Math.cos(angle);
	game.ball.vy = speed * Math.sin(angle);
}

function stopGame(roomId: string, io: Server) {
	console.log("stop game");
	const game = activeGames.get(roomId);
	if (game) {
		if (game.intervalId) clearInterval(game.intervalId);

		let winnerRole = null;
		if (game.score.player1 > game.score.player2) winnerRole = 'player1';
		if (game.score.player2 > game.score.player1) winnerRole = 'player2';
		io.to(roomId).emit('gameEnded', { finalScore: game.score, winner: winnerRole });
		
		
		activeGames.delete(roomId);
		console.log(`Game ${roomId} stopped and cleaned`);
	}
}
export function updateGamePhysics(game: GameState, io: Server) {
	if (game.startAt && Date.now() < game.startAt) {
		io.to(game.roomId).emit('gameState', {
			ball: game.ball,
			paddle1: game.paddle1,
			paddle2: game.paddle2,
			score: game.score,
			waiting: true
		});

		return ;
	}

	if (game.startAt && !game.ballLaunchAt) {
		game.startAt = undefined;
		game.ballLaunchAt = Date.now() + 1000;
		game.ball.x = game.canvasWidth / 2;
		game.ball.y = game.canvasHeight / 2;
		game.ball.vx = 0;
		game.ball.vy = 0;
		
		io.to(game.roomId).emit('gameState', {
			ball: game.ball,
			paddle1: game.paddle1,
			paddle2: game.paddle2,
			score: game.score
		});
		return;
	}

	if (game.ballLaunchAt && Date.now() < game.ballLaunchAt) {
		io.to(game.roomId).emit('gameState', {
			ball: game.ball,
			paddle1: game.paddle1,
			paddle2: game.paddle2,
			score: game.score
		});
		return;
	}

	if (game.ballLaunchAt && game.ball.vx === 0 && game.ball.vy === 0) {
		resetBall(game, game.serveDirection);
		game.ballLaunchAt = undefined;
		
		io.to(game.roomId).emit('gameState', {
			ball: game.ball,
			paddle1: game.paddle1,
			paddle2: game.paddle2,
			score: game.score
		});
		return;
	}


	const prevX = game.ball.x;
	const prevY = game.ball.y;

	let nextX = prevX + game.ball.vx;
	let nextY = prevY + game.ball.vy;

	if (nextY - game.ball.radius < 0 || nextY + game.ball.radius > game.canvasHeight) {
		game.ball.vy = -game.ball.vy;
		nextY = prevY + game.ball.vy;
	}


	const MAX_SPEED = 10;

	if (game.ball.vx < 0) { 
		const paddleRightEdge = game.paddle1.x + game.paddle1.width;
		const TOLERANCE = 5;

		if (prevX - game.ball.radius >= paddleRightEdge - TOLERANCE && 
			nextX - game.ball.radius <= paddleRightEdge + TOLERANCE) {
			
			const ballTop = Math.min(prevY, nextY) - game.ball.radius;
			const ballBottom = Math.max(prevY, nextY) + game.ball.radius;
			const paddleTop = Math.max(0, game.paddle1.y - 5);
			const paddleBottom = Math.min(game.canvasHeight, game.paddle1.y + game.paddle1.height + 5);
			
			if (ballBottom >= paddleTop && ballTop <= paddleBottom) {
				
				let hitPos = (nextY - (game.paddle1.y + game.paddle1.height / 2)) / (game.paddle1.height / 2);
				let angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, hitPos * (Math.PI / 4)));
				
				let speed = Math.sqrt(game.ball.vx * game.ball.vx + game.ball.vy * game.ball.vy);
				speed *= 1.05;
				if (speed > MAX_SPEED) speed = MAX_SPEED;
				
				game.ball.vx = speed * Math.cos(angle);
				game.ball.vy = speed * Math.sin(angle);
				
				nextX = paddleRightEdge + game.ball.radius;
			}
		}
	}

	if (game.ball.vx > 0) { 
		const paddleLeftEdge = game.paddle2.x;
		const TOLERANCE = 5;
		if (prevX + game.ball.radius <= paddleLeftEdge + TOLERANCE && 
			nextX + game.ball.radius >= paddleLeftEdge - TOLERANCE) {
			
			const ballTop = Math.min(prevY, nextY) - game.ball.radius;
			const ballBottom = Math.max(prevY, nextY) + game.ball.radius;
			const paddleTop = Math.max(0, game.paddle2.y - 5);
			const paddleBottom = Math.min(game.canvasHeight, game.paddle2.y + game.paddle2.height + 5);
			
			if (ballBottom >= paddleTop && ballTop <= paddleBottom) {
				
				let hitPos = (nextY - (game.paddle2.y + game.paddle2.height / 2)) / (game.paddle2.height / 2);
				let angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, hitPos * (Math.PI / 4)));
				
				let speed = Math.sqrt(game.ball.vx * game.ball.vx + game.ball.vy * game.ball.vy);
				speed *= 1.05;
				if (speed > MAX_SPEED) speed = MAX_SPEED;
				
				game.ball.vx = -speed * Math.cos(angle);
				game.ball.vy = speed * Math.sin(angle);
				
				nextX = paddleLeftEdge - game.ball.radius;
			}
		}
	}

	const p1Left = game.paddle1.x;
	const p1Right = game.paddle1.x + game.paddle1.width;
	const p1Top = game.paddle1.y;
	const p1Bottom = game.paddle1.y + game.paddle1.height;
	
	if (nextX - game.ball.radius <= p1Right && nextX + game.ball.radius >= p1Left) {
		if (prevY + game.ball.radius <= p1Top && nextY + game.ball.radius >= p1Top && game.ball.vy > 0) {
			game.ball.vy = -game.ball.vy;
			nextY = p1Top - game.ball.radius;
		}
		else if (prevY - game.ball.radius >= p1Bottom && nextY - game.ball.radius <= p1Bottom && game.ball.vy < 0) {
			game.ball.vy = -game.ball.vy;
			nextY = p1Bottom + game.ball.radius;
		}
	}

	const p2Left = game.paddle2.x;
	const p2Right = game.paddle2.x + game.paddle2.width;
	const p2Top = game.paddle2.y;
	const p2Bottom = game.paddle2.y + game.paddle2.height;
	
	if (nextX - game.ball.radius <= p2Right && nextX + game.ball.radius >= p2Left) {
		if (prevY + game.ball.radius <= p2Top && nextY + game.ball.radius >= p2Top && game.ball.vy > 0) {
			game.ball.vy = -game.ball.vy;
			nextY = p2Top - game.ball.radius;
		}
		else if (prevY - game.ball.radius >= p2Bottom && nextY - game.ball.radius <= p2Bottom && game.ball.vy < 0) {
			game.ball.vy = -game.ball.vy;
			nextY = p2Bottom + game.ball.radius;
		}
	}

	game.ball.x = nextX;
	game.ball.y = nextY;

	if (game.ball.x < 0) {
		game.score.player2++;
		game.ballLaunchAt = Date.now() + 500;
		game.ball.x = game.canvasWidth / 2;
		game.ball.y = game.canvasHeight / 2;
		game.ball.vx = 0;
		game.ball.vy = 0;
		game.serveDirection = -1;
	} else if (game.ball.x > game.canvasWidth) {
		game.score.player1++;
		game.ballLaunchAt = Date.now() + 500;
		game.ball.x = game.canvasWidth / 2;
		game.ball.y = game.canvasHeight / 2;
		game.ball.vx = 0;
		game.ball.vy = 0;
		game.serveDirection = +1;
	}

	if (game.score.player1 >= WINNING_SCORE || game.score.player2 >= WINNING_SCORE) {
		stopGame(game.roomId, io);
		return ;
	}

	io.to(game.roomId).emit('gameState', {
		ball: game.ball,
		paddle1: game.paddle1,
		paddle2: game.paddle2,
		score: game.score
	});
}


export function registerRemoteGameEvents(io: Server, socket: Socket, userSockets: Map<number, string>) {

	socket.on('registerGameSocket', () => {
		userSockets.set(socket.user.sub, socket.id);
	})

	socket.on('sendGameInvite', (data: { targetId: string, senderName: string }) => {
		const targetIdNum = Number(data.targetId);
		const targetSocketId = userSockets.get(targetIdNum);
		
		if (targetSocketId) {
			io.to(targetSocketId).emit('receiveGameInvite', {
				senderId: socket.user.sub,
				senderName: data.senderName
			});
		} else {
		console.error(`[SERVER] Cannot find target in users`);
	}
	});

	socket.on('acceptGameInvite', (data: { senderId: string }) => {
		waitingQueue = waitingQueue.filter(id => id !== socket.id);
		const senderIdNum = Number(data.senderId);
		const senderSocketId = userSockets.get(senderIdNum);
		const acceptorSocketId = socket.id;

		if (senderSocketId) {
			const senderSocket = io.sockets.sockets.get(senderSocketId);
			
			if (senderSocket) {
				const roomId = `game_invite_${Date.now()}_${senderIdNum}_${socket.user.sub}`;
				const gameState = initGameState(roomId, senderSocketId, acceptorSocketId);
				activeGames.set(roomId, gameState);

				senderSocket.join(roomId);
				socket.join(roomId);

				setTimeout(() => {
					senderSocket.emit('matchFound', { roomId, role: 'player1', opponent: socket.user.sub });
					socket.emit('matchFound', { roomId, role: 'player2', opponent: senderIdNum });

					gameState.intervalId = setInterval(() => {
						updateGamePhysics(gameState, io);
					}, GAMESPEED);
				}, 100);
			}
		}
	});

	socket.on('declineGameInvite', (data: { senderId: string }) => {
		const senderSocketId = userSockets.get(Number(data.senderId));
		if (senderSocketId) {
			io.to(senderSocketId).emit('gameInviteDeclined', {});
		}
	});


	socket.on('joinQueue', () => {
		if (waitingQueue.includes(socket.id)) {
			return;
		}

		for (const [roomId, socketId] of privateWaitingRooms.entries()) {
			if (socketId === socket.id) {
				privateWaitingRooms.delete(roomId);
			}
		}
		waitingQueue.push(socket.id);

		if (waitingQueue.length >= 2) {
			const p1 = waitingQueue.shift()!;
			const p2 = waitingQueue.shift()!;
			const roomId = `game_${Date.now()}_${p1}_${p2}`;

			const gameState = initGameState(roomId, p1, p2);
			activeGames.set(roomId, gameState);

			const sock1 = io.sockets.sockets.get(p1);
			const sock2 = io.sockets.sockets.get(p2);

			if (sock1 && sock2 && sock1 != sock2) {
				sock1.join(roomId);
				sock2.join(roomId);

				const p1UserId = (sock1 as any).user?.sub || (sock1 as any).decoded?.sub; 
				const p2UserId = (sock2 as any).user?.sub || (sock2 as any).decoded?.sub;

				sock1.emit('matchFound', { roomId, role: 'player1', opponent: p2UserId });
				sock2.emit('matchFound', { roomId, role: 'player2', opponent: p1UserId });

				gameState.intervalId = setInterval(() => {
					updateGamePhysics(gameState, io);
				}, GAMESPEED);
			} else {
				console.error(`[MATCH] Failed to start match: ${roomId}. Sock1: ${!!sock1}, Sock2: ${!!sock2}`);
				if (sock1) waitingQueue.unshift(p1);
				if (sock2) waitingQueue.unshift(p2);
			}
		}
	});

	socket.on('leaveQueue', () => {
		waitingQueue = waitingQueue.filter(id => id !== socket.id);
	});

	socket.on('gameInput', (data: { roomId: string, up: boolean, down: boolean }) => {
		const game = activeGames.get(data.roomId);
		if (!game) return;

		const speed = 10;
		let paddle = null;
		if (socket.id === game.player1Id) paddle = game.paddle1;
		else if (socket.id === game.player2Id) paddle = game.paddle2;

		if (paddle) {
			if (data.up) paddle.y -= speed;
			if (data.down) paddle.y += speed;
			if (paddle.y < 0) paddle.y = 0;
			if (paddle.y + paddle.height > game.canvasHeight) paddle.y = game.canvasHeight - paddle.height;
		}
	});

	socket.on('leaveGame', (data: { roomId: string }) => {
		const game = activeGames.get(data.roomId);

		if (game && (game.player1Id === socket.id || game.player2Id === socket.id)) {

			const opponentSocketId = (game.player1Id === socket.id) ? game.player2Id : game.player1Id;

			io.to(opponentSocketId).emit('opponentLeft', { 
				roomId: data.roomId, 
				leaver: socket.id 
			});

			stopGame(data.roomId, io);
		}
	});

	socket.on('joinPrivateGame', (data: { roomId: string, skin?: string }) => {
		const { roomId } = data;
		const mySocketId = socket.id;

		waitingQueue = waitingQueue.filter(id => id !== mySocketId);
		console.log(`Player ${mySocketId} joining private room ${roomId}`);

		if (privateWaitingRooms.has(roomId)) {
			const opponentSocketId = privateWaitingRooms.get(roomId);

			if (opponentSocketId && opponentSocketId !== mySocketId) {
				privateWaitingRooms.delete(roomId);

				const gameId = `private_${Date.now()}_${roomId}`;
				const gameState = initGameState(gameId, opponentSocketId, mySocketId);
				activeGames.set(gameId, gameState);

				const sock1 = io.sockets.sockets.get(opponentSocketId);
				const sock2 = io.sockets.sockets.get(mySocketId);

				if (sock1 && sock2) {
					sock1.join(gameId);
					sock2.join(gameId);

					const p1UserId = (sock1 as any).user?.sub;
					const p2UserId = (sock2 as any).user?.sub;

					sock1.emit('matchFound', { roomId: gameId, role: 'player1', opponent: p2UserId });
					sock2.emit('matchFound', { roomId: gameId, role: 'player2', opponent: p1UserId });

					gameState.intervalId = setInterval(() => {
						updateGamePhysics(gameState, io);
					}, GAMESPEED);
				} else {
					if (!sock1) console.log("Opponent socket not found for private game");
					if (!sock2) console.log("My socket not found (weird)");
				}
			}
		} else {
			privateWaitingRooms.set(roomId, mySocketId);
			console.log(`Player ${mySocketId} is waiting in private room ${roomId}`);
		}
	});
	

	socket.on('disconnect', () => {
		waitingQueue = waitingQueue.filter(id => id !== socket.id);
		
		for (const [roomId, socketId] of privateWaitingRooms.entries()) {
			if (socketId === socket.id) {
				privateWaitingRooms.delete(roomId);
			}
		}

		for (const [roomId, game] of activeGames.entries()) {
			if (game.player1Id === socket.id || game.player2Id === socket.id) {
				stopGame(roomId, io);
			}
		}
	});
}