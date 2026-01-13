class UI {
    score1: number;
    score2: number;
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        this.score1 = 0;
        this.score2 = 0;
        this.ctx = ctx;
        this.canvas = canvas;
    }

    updateScore(player1Score : number, player2Score : number) {
        this.score1 = player1Score;
        this.score2 = player2Score;
    }

    render(score: { player1: number; player2: number }) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.fillText(`Player 1: ${score.player1}`, 50, 50);
        this.ctx.fillText(`Player 2: ${score.player2}`, this.canvas.width - 150, 50);
    }
}

export default UI;