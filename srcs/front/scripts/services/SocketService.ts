
import { io, Socket } from "socket.io-client";
import { Data } from '../components/Data';

export class SocketService {
	private static instance: SocketService;

	public chatSocket: Socket | null = null;
	public gameSocket: Socket | null = null;

	// Promesse partagée pour le refresh ( pour éviter les appels simultanés)
	private refreshPromise: Promise<string | null> | null = null;

	private constructor() {}

	public static getInstance(): SocketService {
		if (!SocketService.instance) {
			SocketService.instance = new SocketService();
		}
		return SocketService.instance;
	}

	private async createSocketConnection(path: string): Promise<Socket | null> {
		let token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');

		if (!token) {
			console.error(`SocketService: No token found, cannot connect to ${path}`);
			return null;
		}

		let finalToken = token as string;

		// bloc pour gerer les appels simultanes
		try {
			// Décodage du token pour vérifier l'expiration
			const payload = JSON.parse(atob(finalToken.split('.')[1]));
			const now = Math.floor(Date.now() / 1000);
			const timeLeft = payload.exp - now;

			// Si le token expire dans moins de 30s (ou est déjà expiré)
			if (timeLeft < 30) {
				console.log(`Token expirant (reste ${timeLeft}s), lancement procédure refresh...`);

				// Si aucun refresh n'est en cours, on en lance un
				if (!this.refreshPromise) {
					this.refreshPromise = (async () => {
						try {
							const response = await fetch('/api/auth/token', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								credentials: 'include', // Important pour le cookie
								body: JSON.stringify({}) // Important pour Fastify
							});

							if (response.ok) {
								const data = await response.json();
								const newToken = data.accessToken;

								// Mise à jour du stockage
								if (sessionStorage.getItem('isGuest') === 'true')
									sessionStorage.setItem('accessToken', newToken);
								else
									localStorage.setItem('accessToken', newToken);

								console.log("Refresh réussi !");
								return newToken;
							} else {
								console.error("Echec du refresh API:", response.status);
								return null;
							}
						} catch (err) {
							console.error("Erreur réseau pendant le refresh:", err);
							return null;
						} finally {
							// On laisse la promesse se résoudre pour tous les appelants
						}
					})();
				}

				// Tout le monde attend le résultat de la promesse unique
				const newToken = await this.refreshPromise;
				
				// Une fois fini, on nettoie la promesse
				this.refreshPromise = null;

				if (newToken) {
					finalToken = newToken;
				} else {
					console.error("Impossible d'obtenir un nouveau token. Connexion socket annulée.");
					return null; // STOP : On ne connecte pas le socket avec un token mort
				}
			}
		} catch (e) {
			console.error('Erreur lors de la validation du token:', e);
			return null;
		}

		// Connexion Socket avec le token valide
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
			console.log(`SocketService: Connecté à ${path} avec ID: ${socket.id}`);
		});

		socket.on("connect_error", (err) => {
			console.error(`SocketService: Erreur de connexion sur ${path}:`, err.message);
		});

		return socket;
	}

	// ---------------------
	// -- GESTION DU CHAT --
	// ---------------------
	public async connectChat() {
		if (this.chatSocket) return;

		console.log("SocketService: Connecting to Chat...");
		this.chatSocket = await this.createSocketConnection("/socket-chat/");

		if (this.chatSocket) {
			this.chatSocket.on('unreadNotification', (payload: any) => {
				console.log("SocketService: Notification reçue (Global):", payload);

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

	// ---------------------
	// -- GESTION DU GAME --
	// ---------------------
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

	// ---------------------
	// -- UTILITAIRES	--
	// ---------------------

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