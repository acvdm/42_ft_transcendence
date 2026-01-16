class Input {
	keys : { [key: string]: boolean };
	constructor() {
		this.keys = {};
		this.addEventListeners();
	}

	addEventListeners() {
		window.addEventListener('keydown', (event) => {
			this.keys[event.key] = true;
		});

		window.addEventListener('keyup', (event) => {
			this.keys[event.key] = false;
		});
	}

	getInput() {
		return {
			player1: {
				up: this.keys['w'],
				down: this.keys['s'],
			},
			player2: {
				up: this.keys['ArrowUp'],
				down: this.keys['ArrowDown'],
			}
		};
	}
}

export default Input;