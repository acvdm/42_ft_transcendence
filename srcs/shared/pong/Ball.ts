export class Ball {
    x :number;
    y :number;
    radius :number;
    velocityX :number;
    velocityY :number;
    constructor(x: number = 0, y: number = 0, radius: number = 10) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocityX = 5;
        this.velocityY = 5;
    }

    update(canvas: HTMLCanvasElement) {
        this.x += this.velocityX; // Update ball's position based on velocity
        this.y += this.velocityY;

        // Check for collision with top and bottom walls
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.velocityY = -this.velocityY; // Reverse vertical direction
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'white'; // Ball color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw the ball
        ctx.fill();
        ctx.closePath();
    }

    reset(canvas: HTMLCanvasElement) {
        this.x = canvas.width / 2; // Reset ball to center
        this.y = canvas.height / 2;
        this.velocityX = 5; // Reset velocity
        this.velocityY = 5;
    }
}

export default Ball;