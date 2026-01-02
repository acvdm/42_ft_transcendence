import GameSocketService from "../services/GameSocketService.js";

export class RemoteGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private roomId: string;
    private isRunning: boolean = false;

    constructor(roomId: string) {
        this.roomId = roomId;
        
        // 1. Récupération du canvas dans le HTML
        const canvasElement = document.getElementById('gameCanvas');
        if (!canvasElement) throw new Error("Canvas element with id 'gameCanvas' not found");
        this.canvas = canvasElement as HTMLCanvasElement;
        
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;

        // Configuration de la taille (doit correspondre au serveur : 800x600)
        this.canvas.width = 800;
        this.canvas.height = 600;
    }

    public async start() {
        console.log(`Initialising Remote Game for room: ${this.roomId}`);
        
        // 2. Connexion au service Socket (assurez-vous d'avoir un token valide stocké)
        const token = localStorage.getItem('accessToken') || ""; 
        GameSocketService.connect(token);

        // 3. Rejoindre la partie
        GameSocketService.joinGame(this.roomId);

        // 4. Écouter les mises à jour du serveur
        GameSocketService.onGameState((state: any) => {
            this.render(state);
            this.updateScore(state.score);
        });

        // 5. Écouter les interruptions (déconnexion adversaire)
        GameSocketService.onGameInterrupted((msg: string) => {
            alert(msg);
            this.stop();
        });

        // 6. Activer les contrôles
        this.startInputListener();
        this.isRunning = true;
    }

    public stop() {
        this.isRunning = false;
        this.stopInputListener();
        GameSocketService.disconnect();
    }

    // --- GESTION DES INPUTS ---
    
    private handleKey = (event: KeyboardEvent) => {
        if (!this.isRunning) return;
        
        // On envoie la touche brute au serveur qui décidera si c'est valide ou non
        // On filtre un peu pour éviter d'envoyer n'importe quoi
        const validKeys = ['ArrowUp', 'ArrowDown', 'w', 's', 'up', 'down'];
        if (validKeys.includes(event.key)) {
            GameSocketService.sendInput(this.roomId, event.key);
        }
    };

    private startInputListener() {
        window.addEventListener('keydown', this.handleKey);
    }

    private stopInputListener() {
        window.removeEventListener('keydown', this.handleKey);
    }

    // --- RENDER (AFFICHAGE) ---

    private render(state: any) {
        // Nettoyer le canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner la balle
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2); // Rayon 10
        this.ctx.fill();

        // Dessiner Paddle 1 (Gauche)
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(10, state.paddle1.y, 10, 100); // x, y, width, height

        // Dessiner Paddle 2 (Droite)
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.canvas.width - 20, state.paddle2.y, 10, 100);
        
        // Dessiner la ligne centrale (optionnel)
        this.ctx.strokeStyle = 'white';
        this.ctx.setLineDash([5, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
    }

    private updateScore(score: { player1: number, player2: number }) {
        const scoreElement = document.getElementById('scoreBoard');
        if (scoreElement) {
            scoreElement.innerText = `J1: ${score.player1} - J2: ${score.player2}`;
        }
    }
}