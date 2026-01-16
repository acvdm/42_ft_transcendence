import { io, Socket } from "socket.io-client";
import { Data } from '../components/Data';

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
		const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

		if (!token) {
			console.error(`SocketService: No token found, cannot connect to ${path}`);
			return null;
		}

		const socket = io("/", {
			path: path,
			auth: {
				token: token
			},
			reconnection: true,
			reconnectionAttempts: 5,
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

//================================================
//================ CHAT MANAGEMENT ===============
//================================================

	public connectChat() {
		if (this.chatSocket) return;

		console.log("SocketService: Connecting to Chat...");
		this.chatSocket = this.createSocketConnection("/socket-chat/");

		if (this.chatSocket) {
			this.chatSocket.on('unreadNotification', (payload: any) => {

				if (!window.location.href.includes('/chat')) { 
					console.log("-> Activation de la notif persistante");
					Data.hasUnreadMessage = true;
					this.showNotificationIcon();
					const event = new CustomEvent('notificationUpdate', {
						detail: { type: 'chat', payload }
					});
					window.dispatchEvent(event);
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

//================================================
//=============== GAME MANAGEMENT ================
//================================================

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

//================================================
//==================== TOOLS =====================
//================================================

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