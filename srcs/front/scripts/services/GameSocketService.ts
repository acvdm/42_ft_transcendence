import { io, Socket } from "socket.io-client";

class GameSocketService {
	public socket: Socket | null = null;

	public connect(token: string) {
		this.socket = io("/", {
			path: "/pong.io", // chemin defini dans la gateway
			auth: { token: `Bearer ${token}` },
			reconnection: true,
		});
	}

	// gestion de la deconnexion ici
}

export default new GameSocketService();