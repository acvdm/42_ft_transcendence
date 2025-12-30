// Entry point for the Pong game
import Game from './Game';
import UI from './UI';
import Input from './Input';

// Initialize the game
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error("Canvas non supporté");
document.body.appendChild(canvas);

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create game instance
const game = new Game(canvas, ctx);
const ui = new UI(ctx, canvas);
const input = new Input();

// Game loop
function gameLoop() {
    game.update(canvas);
    ui.render(game.score);
    game.render();
    requestAnimationFrame(gameLoop);
}

// Start the game
game.start();
input.addEventListeners();
gameLoop();