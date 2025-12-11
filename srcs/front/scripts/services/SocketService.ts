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
        if (!this.socket) {
            // est-ce qu'on dois passer le otcken?
            // const token = localStorage.getItem('accessToken');
            this.socket = io("/", {
                path: "/socket.io/",
                // auth: { token }
            });
            console.log("SocketService: Connected");
        }
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export default SocketService;