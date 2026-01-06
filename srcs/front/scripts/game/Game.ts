import Paddle from './Paddle';
import Ball from './Ball';
import Input from './Input';
import SocketService from '../services/SocketService'; // Import pour le remote

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

    // --- REMOTE PROPS ---
    isRemote: boolean = false;
    roomId: string | null = null;
    playerRole: 'player1' | 'player2' | null = null;
    socket: any = null;
    // --------------------

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
            //this.socket.off('opponentLeft');
        }
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            console.log("gameloop");
            this.gameLoop(); // relance de la boucle
        }
    }

    // Fonction pour démarrer le jeu en remote
    startRemote(roomId: string, role: 'player1' | 'player2') {
        this.isRemote = true;
        this.roomId = roomId;
        this.playerRole = role;
        this.socket = SocketService.getInstance().socket;

        if (!this.socket) {
            console.error("Cannot start remote game: No socket connection");
            return;
        }

        this.socket.off('gameState'); 
        this.socket.off('gameEnded');
        
        console.log(`Starting Remote Game in room ${roomId} as ${role}`);

        // Écouter les mises à jour du serveur
        this.socket.on('gameState', (data: any) => {
            this.updateFromRemote(data);
        });

        this.socket.on('gameEnded', (data: any) => {
            this.isRunning = false;
            if (this.onGameEnd) {
                this.onGameEnd(data);
            } else {
                alert(`Game Over! Final Score: ${data.finalScore.player1} - ${data.finalScore.player2}`);
            }
            // Retour menu ou nettoyage
            this.socket.off('gameState');
            this.socket.off('gameEnded');
        });

        this.isRunning = true;
        this.gameLoop();
    }

    start() {
        this.isRunning = true;
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
        
        // --- MODE REMOTE ---
        if (this.isRemote && this.socket && this.roomId) {
            // On envoie juste les inputs au serveur
            // On détermine si on bouge (Up ou Down)
            const up = (this.playerRole === 'player1' ? inputState.player1.up : inputState.player2.up) || inputState.player1.up; // Support fleches pour les deux
            const down = (this.playerRole === 'player1' ? inputState.player1.down : inputState.player2.down) || inputState.player1.down;

            this.socket.emit('gameInput', {
                roomId: this.roomId,
                up: up,
                down: down
            });
            // On ne calcule PAS la physique locale, on attend le 'gameState' du serveur
            return; 
        }
        // -------------------

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

        // Limit paddle movements
        if (this.paddle1.y < 0) this.paddle1.y = 0;
        if (this.paddle1.y + this.paddle1.height > canvas.height) this.paddle1.y = canvas.height - this.paddle1.height;
        if (this.paddle2.y < 0) this.paddle2.y = 0;
        if (this.paddle2.y + this.paddle2.height > canvas.height) this.paddle2.y = canvas.height - this.paddle2.height;

        this.ball.update(canvas);
        this.checkCollisions();
        // Additional game update logic
    }

    // Nouvelle fonction pour mettre à jour l'état visuel depuis le serveur
    updateFromRemote(data: any) {
        // Le serveur utilise une base 800x600, on adapte à notre canvas
        const SERVER_WIDTH = 800;
        const SERVER_HEIGHT = 600;
        
        const scaleX = this.canvas.width / SERVER_WIDTH;
        const scaleY = this.canvas.height / SERVER_HEIGHT;
        
        // Adapter les positions de la balle
        this.ball.x = data.ball.x * scaleX;
        this.ball.y = data.ball.y * scaleY;
        
        // Adapter les raquettes
        this.paddle1.y = data.paddle1.y * scaleY;
        this.paddle1.x = data.paddle1.x * scaleX;
        
        this.paddle2.y = data.paddle2.y * scaleY;
        this.paddle2.x = data.paddle2.x * scaleX;

        // Score
        if (this.score.player1 !== data.score.player1 || this.score.player2 !== data.score.player2) {
            this.score = data.score;
            this.notifyScoreUpdate();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Ligne centrale en pointillés
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 10]); // Pointillés: 10px trait, 10px espace
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset pour les autres dessins
        
        this.paddle1.draw(this.ctx);
        this.paddle2.draw(this.ctx);
        this.ball.draw(this.ctx);
    }

    checkCollisions() {
        // Ball collision with left paddle
        if (this.ball.velocityX < 0 && 
            this.ball.x - this.ball.radius <= this.paddle1.x + this.paddle1.width &&
            this.ball.x - this.ball.radius >= this.paddle1.x &&
            this.ball.y >= this.paddle1.y &&
            this.ball.y <= this.paddle1.y + this.paddle1.height) {
            
            // Calculate where ball hit paddle (-1 to 1, center is 0)
            let hitPos = (this.ball.y - (this.paddle1.y + this.paddle1.height / 2)) / (this.paddle1.height / 2);
            let angle = hitPos * (Math.PI / 4); // Max 45 degree angle
            
            let speed = Math.sqrt(this.ball.velocityX * this.ball.velocityX + this.ball.velocityY * this.ball.velocityY);
            speed *= 1.05; // 5% speed increase on hit
            
            this.ball.velocityX = speed * Math.cos(angle);
            this.ball.velocityY = speed * Math.sin(angle);
            
            // Push ball out of paddle to prevent double collision
            this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius;
        }

        // Ball collision with right paddle
        if (this.ball.velocityX > 0 && 
            this.ball.x + this.ball.radius >= this.paddle2.x &&
            this.ball.x + this.ball.radius <= this.paddle2.x + this.paddle2.width &&
            this.ball.y >= this.paddle2.y &&
            this.ball.y <= this.paddle2.y + this.paddle2.height) {
            
            // Calculate where ball hit paddle (-1 to 1, center is 0)
            let hitPos = (this.ball.y - (this.paddle2.y + this.paddle2.height / 2)) / (this.paddle2.height / 2);
            let angle = hitPos * (Math.PI / 4); // Max 45 degree angle
            
            let speed = Math.sqrt(this.ball.velocityX * this.ball.velocityX + this.ball.velocityY * this.ball.velocityY);
            speed *= 1.05; // 5% speed increase on hit
            
            this.ball.velocityX = -speed * Math.cos(angle);
            this.ball.velocityY = speed * Math.sin(angle);
            
            // Push ball out of paddle to prevent double collision
            this.ball.x = this.paddle2.x - this.ball.radius;
        }

        // Ball out of bounds (scoring)
        if (this.ball.x < 0) {
            this.score.player2++;
            this.notifyScoreUpdate();
            this.reset();
        } else if (this.ball.x > this.canvas.width) {
            this.score.player1++;
            this.notifyScoreUpdate();
            this.reset();
        }
    }

    notifyScoreUpdate() {
        if (this.onScoreChange) {
            this.onScoreChange(this.score);
        }
    }

    reset() {
        this.ball.reset(this.canvas);
        this.paddle1.reset(this.canvas.height);
        this.paddle2.reset(this.canvas.height);
    }
}

export default Game;