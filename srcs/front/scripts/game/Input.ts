class Input {
	keys : { [key: string]: boolean };
	constructor() {
		this.keys = {};
		this.addEventListeners();
	}

	addEventListeners() {
		window.addEventListener('keydown', (event) => {

			const target = event.target as HTMLElement;

            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return ;
            }

			if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
				event.preventDefault();
			}
			this.keys[event.key] = true;
		});

		window.addEventListener('keyup', (event) => {
			const target = event.target as HTMLElement;

            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return ;
            }
			if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
				event.preventDefault();
			}
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