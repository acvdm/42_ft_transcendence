class Paddle {
	x: number;
	y: number;
	width: number;
	height: number;
	speed: number;
	color: string;
	image: HTMLImageElement | null = null;
	constructor(x: number, y: number, imageSrc: string = '/assets/basic/block.png') {
		this.x = x; // Paddle's x position
		this.y = y; // Paddle's y position
		this.width = 10; // Paddle's width
		this.height = 100; // Paddle's height
		this.speed = 6; // Paddle's movement speed
		this.color = 'white';

		if (imageSrc) {
			this.image = new Image();
			this.image.src = imageSrc;
		}
	}

	move(up : boolean) {
		if (up) {
			this.y -= this.speed; // Move paddle up
		} else {
			this.y += this.speed; // Move paddle down
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
			ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
		} else {
			ctx.fillStyle = 'white'; // Paddle color
			ctx.fillRect(this.x, this.y, this.width, this.height); // Draw paddle
		}
	}

	reset(canvasHeight: number) {
		this.y = (canvasHeight / 2) - (this.height / 2); // Reset to initial position
	}
}

export default Paddle;