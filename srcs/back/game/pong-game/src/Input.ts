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
            up: this.keys['ArrowUp'] || this.keys['w'],
            down: this.keys['ArrowDown'] || this.keys['s'],
        };
    }
}

export default Input;