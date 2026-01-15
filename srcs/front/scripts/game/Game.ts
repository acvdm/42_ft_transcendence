import Paddle from './Paddle';
import Ball from './Ball';
import Input from './Input';
import SocketService from '../services/SocketService';
import { Socket } from "socket.io-client";
import i18next from "../i18n";

class Game {
	score: { player1: number; player2: number };
	paddle1: Paddle;
	paddle2: Paddle;
	ball: Ball;
	isRunning: boolean;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	input: Input;
	onScoreChange?: (score: { player1: number; player2: number }) => void;
	onGameEnd?: (data: any) => void;

	isRemote: boolean = false;
	roomId: string | null = null;
	playerRole: 'player1' | 'player2' | null = null;
	socket: Socket | null = null;
	lastBallSpeed: number = 0;


	constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, input: Input, ballImageSrc?: string) {
		this.canvas = canvas;
		this.ctx = ctx;
		this.input = input;
		this.score = { player1: 0, player2: 0 };
		const paddleImg = '/assets/basic/paddle.png';
		this.paddle1 = new Paddle(30, canvas.height / 2 - 50, paddleImg);
		this.paddle2 = new Paddle(canvas.width - 40, canvas.height / 2 - 50, paddleImg);
		this.ball = new Ball(canvas.width / 2, canvas.height / 2, ballImageSrc);
		this.isRunning = false;
	}

	stop() {
		this.isRunning = false;
		if (this.socket) {
			this.socket.off('gameState');
			this.socket.off('gameEnded');
		}
	}

	pause() {
		this.isRunning = false;
	}

	resume() {
		if (!this.isRunning) {
			this.isRunning = true;
			console.log("gameloop");
			this.gameLoop();
		}
	}

	resetScore() {
		this.score = { player1: 0, player2: 0 };
		this.notifyScoreUpdate();
	}

	startRemote(roomId: string, role: 'player1' | 'player2') {
		console.log("startRemote Initial score:", this.score);
		this.isRemote = true;
		this.roomId = roomId;
		this.playerRole = role;

		this.score = { player1: 0, player2: 0 };
		const socketService = SocketService.getInstance();
		socketService.connectGame();
		this.socket = socketService.getGameSocket();

		if (!this.socket) {
			console.error("Cannot start remote game: No socket connection");
			return;
		}

		this.socket.off('gameState'); 
		this.socket.off('gameEnded');
		
		console.log(`Starting Remote Game in room ${roomId} as ${role}`);
		this.notifyScoreUpdate();

		this.socket.on('gameState', (data: any) => {
			this.updateFromRemote(data);
		});

		this.socket.on('gameEnded', (data: any) => {
			this.isRunning = false;
			if (data.finalScore) {
				this.score = data.finalScore;
				this.notifyScoreUpdate();
			}
			if (this.onGameEnd) {
				this.onGameEnd(data);
			} else {
				alert(i18next.t('game.game_over', { 
					score1: data.finalScore.player1, 
					score2: data.finalScore.player2 
				}));
			}

			this.socket.off('gameState');
			this.socket.off('gameEnded');
		});

		this.isRunning = true;
		this.gameLoop();
	}

	start() {
		this.isRunning = true;
		this.notifyScoreUpdate();
		this.gameLoop();
	}

	gameLoop() {
		if (this.isRunning) {
			this.update(this.canvas);
			this.render();
			requestAnimationFrame(() => this.gameLoop());
		}
	}

	update(canvas: HTMLCanvasElement) {
		const inputState = this.input.getInput();

		if (this.isRemote && this.socket && this.roomId) {

			const up = inputState.player1.up;
			const down = inputState.player1.down;

			this.socket.emit('gameInput', {
				roomId: this.roomId,
				up: up,
				down: down
			});
			
			const myPaddle = this.playerRole === 'player1' ? this.paddle1 : this.paddle2;
			if (up) {
				myPaddle.move(true);
			}
			if (down) {
				myPaddle.move(false);
			}
			
			const maxY = canvas.height - myPaddle.height;
			if (myPaddle.y < 0) myPaddle.y = 0;
			if (myPaddle.y > maxY) myPaddle.y = maxY;
			
			return; 
		}
		if (inputState.player1.up) {
			this.paddle1.move(true);
		}
		if (inputState.player1.down) {
			this.paddle1.move(false);
		}
		if (inputState.player2.up) {
			this.paddle2.move(true);
		}
		if (inputState.player2.down) {
			this.paddle2.move(false);
		}

		if (this.paddle1.y < 0) this.paddle1.y = 0;
		if (this.paddle1.y + this.paddle1.height > canvas.height) this.paddle1.y = canvas.height - this.paddle1.height;
		if (this.paddle2.y < 0) this.paddle2.y = 0;
		if (this.paddle2.y + this.paddle2.height > canvas.height) this.paddle2.y = canvas.height - this.paddle2.height;

		this.ball.update(canvas);
		this.checkCollisions();
	}

	updateFromRemote(data: any) {
		if (this.roomId && data.roomId && data.roomId !== this.roomId) {
			return;
		}
		const SERVER_WIDTH = 800;
		const SERVER_HEIGHT = 600;
		const scaleX = this.canvas.width / SERVER_WIDTH;
		const scaleY = this.canvas.height / SERVER_HEIGHT;
		const prevBallX = this.ball.x;
		const prevBallY = this.ball.y;
		const newBallX = data.ball.x * scaleX;
		const newBallY = data.ball.y * scaleY;
		const currentBallSpeed = Math.abs(data.ball.vx) + Math.abs(data.ball.vy);
		const ballJustLaunched = this.lastBallSpeed === 0 && currentBallSpeed > 0;
		this.lastBallSpeed = currentBallSpeed;

		const paddle1Right = data.paddle1.x + data.paddle1.width;
		const paddle2Left = data.paddle2.x;
		const distanceToPaddle1 = Math.abs(data.ball.x - paddle1Right);
		const distanceToPaddle2 = Math.abs(data.ball.x - paddle2Left);
		const minDistance = Math.min(distanceToPaddle1, distanceToPaddle2);
		const nearPaddle = minDistance < 50;

		if (ballJustLaunched) {
			this.ball.x = newBallX;
			this.ball.y = newBallY;
		} else if (nearPaddle) {
			this.ball.x = newBallX;
			this.ball.y = newBallY;
		} else {
			this.ball.x = prevBallX + (newBallX - prevBallX) * 0.55;
			this.ball.y = prevBallY + (newBallY - prevBallY) * 0.55;
		}

		this.ball.velocityX = data.ball.vx;
		this.ball.velocityY = data.ball.vy;
		this.paddle1.y = data.paddle1.y * scaleY;
		this.paddle1.x = data.paddle1.x * scaleX;
		this.paddle2.y = data.paddle2.y * scaleY;
		this.paddle2.x = data.paddle2.x * scaleX;
		
		const maxY = this.canvas.height - this.paddle1.height;
		if (this.paddle1.y < 0) this.paddle1.y = 0;
		if (this.paddle1.y > maxY) this.paddle1.y = maxY;
		if (this.paddle2.y < 0) this.paddle2.y = 0;
		if (this.paddle2.y > maxY) this.paddle2.y = maxY;

		// Score
		if (this.score.player1 !== data.score.player1 || this.score.player2 !== data.score.player2) {
			this.score = data.score;
			this.notifyScoreUpdate();
		}
	}

	render() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.strokeStyle = 'white';
		this.ctx.lineWidth = 4;
		this.ctx.setLineDash([10, 10]);
		this.ctx.beginPath();
		this.ctx.moveTo(this.canvas.width / 2, 0);
		this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
		this.ctx.stroke();
		this.ctx.setLineDash([]);
		this.paddle1.draw(this.ctx);
		this.paddle2.draw(this.ctx);
		this.ball.draw(this.ctx);
	}


	checkCollisions() {

		let speed = Math.sqrt(this.ball.velocityX ** 2 + this.ball.velocityY ** 2);
		const MAX_SPEED = 10;
		if (speed > MAX_SPEED) {
			const ratio = MAX_SPEED / speed;
			this.ball.velocityX *= ratio;
			this.ball.velocityY *= ratio;
		}

		
		if (this.ball.velocityX < 0) {
			if (this.ball.x - this.ball.radius <= this.paddle1.x + this.paddle1.width &&
				this.ball.x - this.ball.radius >= this.paddle1.x) {
				
				if (this.ball.y + this.ball.radius >= this.paddle1.y && 
					this.ball.y - this.ball.radius <= this.paddle1.y + this.paddle1.height) {
					
					let hitPos = (this.ball.y - (this.paddle1.y + this.paddle1.height / 2)) / (this.paddle1.height / 2);
					let angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, hitPos * (Math.PI / 4)));
					
					let speed = Math.sqrt(this.ball.velocityX * this.ball.velocityX + this.ball.velocityY * this.ball.velocityY);
					speed *= 1.05;
					if (speed > MAX_SPEED) speed = MAX_SPEED;

					this.ball.velocityX = speed * Math.cos(angle);
					this.ball.velocityY = speed * Math.sin(angle);
					
					this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius + 2;
				}
			}
		}

		if (this.ball.velocityX > 0) {
			 if (this.ball.x + this.ball.radius >= this.paddle2.x &&
				this.ball.x + this.ball.radius <= this.paddle2.x + this.paddle2.width) {
			
				if (this.ball.y + this.ball.radius >= this.paddle2.y && 
					this.ball.y - this.ball.radius <= this.paddle2.y + this.paddle2.height) {
				
					let hitPos = (this.ball.y - (this.paddle2.y + this.paddle2.height / 2)) / (this.paddle2.height / 2);
					let angle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, hitPos * (Math.PI / 4)));
					
					let speed = Math.sqrt(this.ball.velocityX * this.ball.velocityX + this.ball.velocityY * this.ball.velocityY);
					speed *= 1.05;
					
					this.ball.velocityX = -speed * Math.cos(angle);
					this.ball.velocityY = speed * Math.sin(angle);
					
					this.ball.x = this.paddle2.x - this.ball.radius - 2;
				}
			}
		}

		if (this.ball.x < 0) {
			this.score.player2++;
			this.notifyScoreUpdate();
			this.reset(-1);
		} else if (this.ball.x > this.canvas.width) {
			this.score.player1++;
			this.notifyScoreUpdate();
			this.reset(1);
		}
	}

	reset(direction: number = 1) {
		this.ball.reset(this.canvas, direction);
		this.paddle1.reset(this.canvas.height);
		this.paddle2.reset(this.canvas.height);
	}


	notifyScoreUpdate() {
		if (this.onScoreChange) {
			this.onScoreChange(this.score);
		}
	}
}

export default Game;