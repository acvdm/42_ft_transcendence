import { io, Socket } from "socket.io-client";
import { Data } from '../components/Data'; // Assure-toi que ce chemin est bon

export class SocketService {
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

    private createSocketConnection(path: string): Socket | null {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

        if (!token) {
            console.error(`SocketService: No token found, cannot connect to ${path}`);
            return null;
        }

        const socket = io("/", {
            path: path,
            auth: {
                token: `Bearer ${token}`
            },
            reconnection: true,
            reconnectionAttempts: 5, // Correction typo: reconnectionAttemps -> reconnectionAttempts
            transports: ['websocket', 'polling']            
        });

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
    // ---------------------
    public connectChat() {
        if (this.chatSocket) return;

        console.log("SocketService: Connecting to Chat...");
        this.chatSocket = this.createSocketConnection("/socket-chat/");

        // --- CORRECTION MAJEURE ICI ---
        if (this.chatSocket) {
            // 1. On écoute le BON événement envoyé par le back (unreadNotification)
            // 2. On le place ICI, pas dans connectGame
            this.chatSocket.on('unreadNotification', (payload: any) => {
                console.log("SocketService: Notification reçue (Global):", payload);

                // Si l'URL ne contient pas 'chat', on considère que c'est non lu
                // (Tu peux affiner cette condition si tu veux)
                if (!window.location.href.includes('/chat')) { 

                    c
                    console.log("-> Activation de la notif persistante");
                    Data.hasUnreadMessage = true; // Sauvegarde dans localStorage via ton setter
                    this.showNotificationIcon();  // Affichage visuel immédiat
                }
            });
        }
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
    // ---------------------
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
    // -- UTILITAIRES    --
    // ---------------------

    // Méthode privée pour manipuler le DOM direct
    private showNotificationIcon() {
        const notifElement = document.getElementById('message-notification'); 
        if (notifElement) {
            notifElement.style.display = 'block';
        }
    }

    public disconnectAll() {
        this.disconnectChat();
        this.disconnectGame();
    }
}

export default SocketService;