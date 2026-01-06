class Ball {
    x :number;
    y :number;
    radius :number;
    velocityX :number;
    velocityY :number;
    speed: number;
    image: HTMLImageElement | null = null;
    constructor(x: number, y: number, imageSrc?: string) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = 5;
        this.velocityX = 5;
        this.velocityY = 5;

        if (imageSrc && imageSrc !== 'classic') {
            this.image = new Image();
            this.image.src = imageSrc;
        }
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
        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(
                this.image,
                this.x - this.radius * 1.5,
                this.y - this.radius * 1.5,
                this.radius * 3,
                this.radius * 3
            );
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw the ball
            ctx.fillStyle = 'white'; // Ball color
            ctx.fill();
            ctx.closePath();
        }
    }

    reset(canvas: HTMLCanvasElement) {
        this.x = canvas.width / 2; // Reset ball to center
        this.y = canvas.height / 2;
        this.velocityX = 5; // Reset velocity
        this.velocityY = 5;
    }
}

export default Ball;