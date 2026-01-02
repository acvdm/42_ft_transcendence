import { io, Socket } from "socket.io-client";

class GameSocketService {
	public socket: Socket | null = null;

	public connect(token: string) {
		if (this.socket) return; // Évite double connexion
		
		this.socket = io("/", {
			path: "/pong.io",
			auth: { token: `Bearer ${token}` },
			reconnection: true,
		});
	}

	public joinGame(roomId: string) {
		this.socket?.emit('joinGame', roomId);
	}

	public sendInput(roomId: string, key: string) {
		this.socket?.emit('input', { roomId, key });
	}

	public onGameState(callback: (gameState: any) => void) {
		this.socket?.on('gameState', callback);
	}
	
	public onGameInterrupted(callback: (msg: string) => void) {
		this.socket?.on('gameInterrupted', callback);
	}

	public disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}
}

export default new GameSocketService();