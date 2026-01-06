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
const input = new Input();
const game = new Game(canvas, ctx, input);
const ui = new UI(ctx, canvas);

// Start the game
game.start();
input.addEventListeners();