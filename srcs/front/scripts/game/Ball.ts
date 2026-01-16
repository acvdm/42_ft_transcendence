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
		this.x += this.velocityX;
		this.y += this.velocityY;

		if (this.y - this.radius < 0) {
			this.y = this.radius;
			this.velocityY = -this.velocityY;
		} else if (this.y + this.radius > canvas.height) {
			this.y = canvas.height - this.radius;
			this.velocityY = -this.velocityY;
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
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
			ctx.fillStyle = 'white';
			ctx.fill();
			ctx.closePath();
		}
	}

	reset(canvas: HTMLCanvasElement, direction: number = 1) {
		this.x = canvas.width / 2;
		this.y = canvas.height / 2;
		this.velocityX = 5 * direction;
		this.velocityY = 5;
	}
}

export default Ball;