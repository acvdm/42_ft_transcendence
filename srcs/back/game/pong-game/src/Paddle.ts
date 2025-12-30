class Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    constructor(x: number, y: number, width: number = 10, height: number = 100) {
        this.x = x; // Paddle's x position
        this.y = y; // Paddle's y position
        this.width = width; // Paddle's width
        this.height = height; // Paddle's height
        this.speed = 5; // Paddle's movement speed
    }

    move(up : boolean) {
        if (up) {
            this.y -= this.speed; // Move paddle up
        } else {
            this.y += this.speed; // Move paddle down
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'white'; // Paddle color
        ctx.fillRect(this.x, this.y, this.width, this.height); // Draw paddle
    }

    reset(y: number = this.y) { // A verifier si le paddle est bien remis a sa position initiale sinon creer default x et y pour le reassigner
        this.y = y;
    }
}

export default Paddle;