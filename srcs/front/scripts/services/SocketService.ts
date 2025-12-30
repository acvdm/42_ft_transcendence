import { io, Socket } from "socket.io-client";

class SocketService {
    private static instance: SocketService;
    public socket: Socket | null = null;

    private constructor() {}

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect() {
        // Sécurité: On ne se connecte pas si on déjà connecté
        if (this.socket) return;

        // Récupérer le token
        const token = localStorage.getItem('accessToken');

        // Sécurité: Si pas de token, on ne tente pas la connexion
        if (!token)
        {
            console.error("SocketService: No token found, connection aborted");
            return ;
        }

        // Ajout Anne-Chat pour le token
        this.socket = io("/", {
            path: "/socket.io/",
            auth: {
                token: `Bearer ${token}` // On envoie le JWT
            },
            reconnection: true,
            reconnectionAttemps: 5
        });

        this.socket.on("connect", () => {
            console.log("SocketService: Connection with ID", this.socket?.id);
        });

        this.socket.on("connect_error", (err: any) => {
            console.error("SocketService: Connection error:", err.message);
        });
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default SocketService;