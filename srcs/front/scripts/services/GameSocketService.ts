import { io, Socket } from "socket.io-client";

class GameSocketService {
    private socket: Socket | null = null;

    // Connexion au serveur de jeu
    public connect(url: string, token: string): void {
        if (this.socket) return;

        this.socket = io(url, {
            auth: { token },
            transports: ['websocket'], // Force l'utilisation de WebSocket
            autoConnect: true
        });

        this.socket.on("connect", () => {
            console.log("Connecté au serveur de jeu :", this.socket?.id);
        });

        this.socket.on("disconnect", () => {
            console.log("Déconnecté du serveur de jeu");
        });
    }

    // Rejoindre une partie spécifique
    public joinRoom(roomId: string): void {
        if (this.socket) {
            this.socket.emit("joinGame", { roomId });
        }
    }

    // Envoyer les inputs du joueur (ex: monter/descendre)
    public sendInput(input: any): void {
        if (this.socket) {
            this.socket.emit("input", input);
        }
    }

    // Écouter les mises à jour de l'état du jeu (position balle, raquettes)
    public onGameStateUpdate(callback: (gameState: any) => void): void {
        if (this.socket) {
            this.socket.on("gameState", callback);
        }
    }

    // Écouter la fin de la partie
    public onGameEnd(callback: (result: any) => void): void {
        if (this.socket) {
            this.socket.on("gameEnd", callback);
        }
    }

    // Déconnexion propre
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default new GameSocketService();