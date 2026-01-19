
import { io, Socket } from "socket.io-client";
import { Data } from '../components/Data';

export class SocketService {
	private static instance: SocketService;

	public chatSocket: Socket | null = null;
	public gameSocket: Socket | null = null;
	private refreshPromise: Promise<string | null> | null = null;
	private constructor() {}

	public static getInstance(): SocketService {
		if (!SocketService.instance) {
			SocketService.instance = new SocketService();
		}
		return SocketService.instance;
	}


	//================================================
	//================ SOCKET MANAGER ================
	//================================================


	private async createSocketConnection(path: string): Promise<Socket | null> {
		let token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

		if (!token) {
			console.error(`SocketService: No token found, cannot connect to ${path}`);
			return null;
		}

		let finalToken = token as string;

		try {
			const payload = JSON.parse(atob(finalToken.split('.')[1]));
			const now = Math.floor(Date.now() / 1000);
			const timeLeft = payload.exp - now;

			if (timeLeft < 30) {
				console.log(`Token expiring (${timeLeft}s left), launching refresh procedure...`);

				if (!this.refreshPromise) {
					this.refreshPromise = (async () => {
						try {
							const response = await fetch('/api/auth/token', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								credentials: 'include',
								body: JSON.stringify({})
							});

							if (response.ok) {
								const data = await response.json();
								const newToken = data.accessToken;

								// Updating storage
								if (sessionStorage.getItem('isGuest') === 'true')
									sessionStorage.setItem('accessToken', newToken);
								else
									localStorage.setItem('accessToken', newToken);

								console.log("Refresh done !");
								return newToken;
							} else {
								console.error("Refresh API failed:", response.status);
								return null;
							}
						} catch (err) {
							console.error("Network error refreshing:", err);
							return null;
						} finally {
						}
					})();
				}

				const newToken = await this.refreshPromise;
				this.refreshPromise = null;

				if (newToken) {
					finalToken = newToken;
				} else {
					console.error("Cannot retrieve new token. Socket connection cancelled.");
					return null;
				}
			}
		} catch (e) {
			console.error('Error validating token:', e);
			return null;
		}

		const socket = io("/", {
			path: path,
			auth: {
				token: finalToken
			},
			reconnection: true,
			reconnectionAttempts: 5,
			transports: ['websocket', 'polling']
		});

		socket.on("connect", () => {
			console.log(`SocketService: Connected to ${path} with ID: ${socket.id}`);
		});

		socket.on("connect_error", (err) => {
			console.error(`SocketService: Network error on ${path}:`, err.message);
		});

		return socket;
	}


	//================================================
	//================= CHAT MANAGER =================
	//================================================

	public async connectChat() {
		if (this.chatSocket) return;

		console.log("SocketService: Connecting to Chat...");
		this.chatSocket = await this.createSocketConnection("/socket-chat/");

		if (this.chatSocket) {
			this.chatSocket.on('unreadNotification', (payload: any) => {

				if (!window.location.href.includes('/chat')) { 
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
	//================= GAME MANAGER =================
	//================================================


	public async connectGame() {
		if (this.gameSocket) return;
		console.log("SocketService: Connecting to Game...");
		this.gameSocket = await this.createSocketConnection("/socket-game/");
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
	//===================== TOOLS ====================
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