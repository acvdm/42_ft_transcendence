import { io, Socket } from "socket.io-client";

class SocketService {
    private static instance: SocketService;

    public chatSocket: Socket | null = null;
    public gameSocket: Socket | null = null;

    private constructor() {}

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    // -- LOGIQUE GÉNÉRIQUE DE CONNEXION
    // Méthode privée pour ne pas dupliquer le code de config
    private createSocketConnection(path: string): Socket | null {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

        if (!token)
        {
            console.error(`SocketService: No token found, cannot connect to ${path}`);
            return null;
        }

        const socket = io("/", {
            path: path,
            auth: {
                token: `Bearer ${token}` // On envoie le JWT
            },
            reconnection: true,
            reconnectionAttemps: 5,
            transports: ['websocket', 'polling']            
        });

        // Listeners pour le debug
        socket.on("connect", () => {
            console.log(`SocketService: Connect to ${path} with ID: ${socket.id}`);
        });

        socket.on("connect_error", (err) => {
            console.error(`SocketService: Connection error on ${path}`, err.message);
        })

        return socket;
    }
    // ---------------------


    // -- GESTION DU CHAT --
    public connectChat() {
        // Sécurité: On ne se connecte pas si on déjà connecté
        if (this.chatSocket) return;

        console.log("SocketService: Connecting to Chat...");
        this.chatSocket = this.createSocketConnection("/socket-chat/");
    }

    public disconnectChat() {
        if (this.chatSocket) {
            this.chatSocket.disconnect();
            this.chatSocket = null;
            console.log("SocketService: Chat disconnected");
        }
    }

    public getChatSocket(): Socket | null {
        return this.chatSocket;
    }
    // ---------------------


    // -- GESTION DU GAME --
    public connectGame() {
        if (this.gameSocket) return;
        console.log("SocketService: Connecting to Game...");
        this.gameSocket = this.createSocketConnection("/socket-game/");
    }

    public disconnectGame() {
        if (this.gameSocket) {
            this.gameSocket.disconnect();
            this.gameSocket = null;
            console.log("SocketService: Game disconnected");
        }
    }

    public getGameSocket(): Socket | null {
        return this.gameSocket;
    }
    // ---------------------


    // -- UTILITAIRE GLOBAL --
    public disconnectAll() {
        this.disconnectChat();
        this.disconnectGame();
    }
}

export default SocketService;