import GameSocketService from "../services/GameSocketService.js";

export class RemoteGame {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private roomId: string = ""; // On initialise vide
    private keysPressed: Set<string> = new Set();

    // On retire roomId du constructeur car on ne le connait pas encore
    constructor() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '#login';
            return;
        }
        this.init(token);
    }

    private init(token: string): void {
        setTimeout(() => {
            // 1. Initialisation Canvas (Ton code existant...)
            this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) return;

            // 2. Connexion au socket
            GameSocketService.connect(token);

            // 3. MATCHMAKING : On écoute si on trouve un match
            const scoreBoard = document.getElementById('scoreBoard'); // Attention à l'ID (voir étape 4)
            if (scoreBoard) scoreBoard.innerText = "Recherche d'un adversaire...";

            GameSocketService.onMatchFound((roomId) => {
                console.log("Adversaire trouvé ! Room :", roomId);
                this.roomId = roomId;
                if (scoreBoard) scoreBoard.innerText = "Match commencé !";
                
                // On rejoint la salle donnée par le serveur
                GameSocketService.joinRoom(this.roomId);
            });

            // 4. On demande à rejoindre la file d'attente
            console.log("Joining matchmaking queue...");
            GameSocketService.joinQueue();

            // 5. Setup des contrôles (Ton code existant)
            this.setupControls();

            // 6. Écouter les mises à jour (Ton code existant)
            GameSocketService.onGameState((state) => {
                this.draw(state);
                this.updateScore(state.score);
            });

        }, 200);
    }

    private setupControls(): void {
        console.log("Setting up controls");
        
        // Gestion des touches pressées
        window.addEventListener('keydown', (e) => {
            if (this.keysPressed.has(e.key)) return;
            this.keysPressed.add(e.key);
            
            if (e.key === 'ArrowUp' || e.key === 'w') {
                console.log("Sending ArrowUp");
                GameSocketService.sendInput('ArrowUp');
            }
            if (e.key === 'ArrowDown' || e.key === 's') {
                console.log("Sending ArrowDown");
                GameSocketService.sendInput('ArrowDown');
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.key);
        });
    }

    private draw(state: any): void {
        if (!this.ctx || !this.canvas) {
            console.error("Cannot draw: ctx or canvas is null");
            return;
        }

        // 1. Effacer l'écran
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Dessiner la ligne centrale
        this.ctx.strokeStyle = 'white';
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 3. Dessiner la balle
        if (state.ball) {
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 4. Dessiner les raquettes
        this.ctx.fillStyle = 'white';
        
        // Raquette gauche (paddle1)
        if (state.paddle1) {
            this.ctx.fillRect(10, state.paddle1.y, 10, 100);
        }
        
        // Raquette droite (paddle2)
        if (state.paddle2) {
            this.ctx.fillRect(this.canvas.width - 20, state.paddle2.y, 10, 100);
        }
    }

    private updateScore(score: any): void {
        const scoreBoard = document.getElementById('scoreBoard');
        if (scoreBoard && score) {
            scoreBoard.innerText = `Score: ${score.player1} - ${score.player2}`;
        }
    }

    public start(): void {
        console.log(`Game started in room: ${this.roomId}`);
    }

    public stop(): void {
        console.log('Stopping remote game');
        GameSocketService.disconnect();
    }
}