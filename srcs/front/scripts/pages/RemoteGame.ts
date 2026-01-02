import GameSocketService from "../services/GameSocketService.js";

export class RemoteGame {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private roomId: string;
    private keysPressed: Set<string> = new Set();

    constructor(roomId: string) {
        this.roomId = roomId;
        console.log("RemoteGame constructor called with room:", roomId);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error("Pas de token ! Redirection vers login...");
            window.location.href = '#login';
            return;
        }

        this.init(token);
    }

    private init(token: string): void {
        console.log("Init called");
        
        setTimeout(() => {
            this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            
            if (!this.canvas) {
                console.error("Canvas introuvable dans init()!");
                return;
            }

            console.log("Canvas found in init:", this.canvas);
            console.log("Canvas dimensions:", this.canvas.width, "x", this.canvas.height);

            this.ctx = this.canvas.getContext('2d');
            
            if (!this.ctx) {
                console.error("Could not get 2D context!");
                return;
            }

            console.log("Context obtained successfully");
            
            // Test: dessiner un rectangle pour vérifier que le canvas fonctionne
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(0, 0, 100, 100);
            console.log("Test rectangle drawn");
            
            // Connexion au serveur
            console.log("Connecting to game server...");
            GameSocketService.connect(token);
            
            // Rejoindre la room
            console.log("Joining room:", this.roomId);
            GameSocketService.joinRoom(this.roomId);

            // Configuration des contrôles
            this.setupControls();

            // Écouter les mises à jour du serveur
            GameSocketService.onGameState((state) => {
                console.log("Game state received:", state);
                this.draw(state);
                this.updateScore(state.score);
            });

        }, 200); // Augmenté à 200ms pour plus de sécurité
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
        const scoreBoard = document.getElementById('score-board');
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