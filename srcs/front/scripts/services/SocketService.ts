import { io, Socket } from "socket.io-client";
import { Data } from '../components/Data'

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
        if (this.chatSocket) {
            // On écoute globalement les messages entrants
            this.chatSocket.on('receive_message', (payload: any) => {
                console.log("SocketService: Message reçu (Global):", payload);

                // 1. On vérifie si on est PAS DÉJÀ en train de lire ce chat
                // (Optionnel : tu peux affiner cette condition si tu veux que la notif
                // apparaisse même si tu es dans le chat)
                const isChatOpen = window.location.hash === '#chat'; 
                
                if (!isChatOpen) {
                    // 2. On met à jour la variable globale pour la persistance
                    Data.hasUnreadMessage = true; 

                    // 3. On met à jour l'interface visuelle tout de suite
                    this.showNotificationIcon();
                }
            });
        }
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

    private showNotificationIcon() {
        // Remplace 'message-notification' par l'ID réel de ton élément HTML de notif
        const notifElement = document.getElementById('message-notification'); 
        if (notifElement) {
            notifElement.style.display = 'block'; // Ou remove la classe 'hidden'
        }
    }

    // -- UTILITAIRE GLOBAL --
    public disconnectAll() {
        this.disconnectChat();
        this.disconnectGame();
    }


    
}

export default SocketService;