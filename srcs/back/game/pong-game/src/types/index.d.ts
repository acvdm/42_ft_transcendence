interface Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    move(direction: 'up' | 'down'): void;
    draw(context: CanvasRenderingContext2D): void;
    reset(): void;
}

interface Ball {
    x: number;
    y: number;
    radius: number;
    velocityX: number;
    velocityY: number;
    update(): void;
    draw(context: CanvasRenderingContext2D): void;
    reset(): void;
}

interface Game {
    score: { player1: number; player2: number };
    start(): void;
    update(): void;
    render(context: CanvasRenderingContext2D): void;
}

interface Input {
    addEventListeners(): void;
    getInput(): { up: boolean; down: boolean };
}

interface UI {
    updateScore(player1Score: number, player2Score: number): void;
    render(context: CanvasRenderingContext2D): void;
}