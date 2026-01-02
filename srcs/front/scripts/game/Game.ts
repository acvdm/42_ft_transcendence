import Paddle from './Paddle';
import Ball from './Ball';
import Input from './Input';

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

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.paddle1.draw(this.ctx);
        this.paddle2.draw(this.ctx);
        this.ball.draw(this.ctx);
        // Render UI (score) -> je supprime pour récupérer dans mon span dédié
        // this.ctx.fillStyle = 'white';
        // this.ctx.font = '30px Arial';
        // this.ctx.fillText(`Player 1: ${this.score.player1}`, 50, 50);
        // this.ctx.fillText(`Player 2: ${this.score.player2}`, this.canvas.width - 150, 50);
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
        this.paddle1.reset();
        this.paddle2.reset();
    }
}

export default Game;