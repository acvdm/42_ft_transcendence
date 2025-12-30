import Paddle from './Paddle';
import Ball from './Ball';

class Game {
    score: { player1: number; player2: number };
    paddle1: Paddle;
    paddle2: Paddle;
    ball: Ball;
    isRunning: boolean;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.score = { player1: 0, player2: 0 };
        this.paddle1 = new Paddle(30, 100); // on peut definir les valeurs de la taille du paddle si besoin apres les numbers
        this.paddle2 = new Paddle(750, 100);
        this.ball = new Ball(); // on peut definir les valeurs de la taille de la balle si besoin
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
        this.ball.update(canvas);
        this.checkCollisions();
        // Additional game update logic
    }

    render() {
        // Clear the canvas and redraw paddles, ball, and UI
    }

    checkCollisions() {
        // Logic for detecting collisions between paddles and ball
    }

    reset() {
        this.ball.reset(this.canvas);
        this.paddle1.reset();
        this.paddle2.reset();
        this.score = { player1: 0, player2: 0 };
    }
}

export default Game;