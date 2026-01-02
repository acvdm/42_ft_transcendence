import { io, Socket } from 'socket.io-client';

class GameSocketServiceClass {
    private socket: Socket | null = null;
    private currentRoomId: string | null = null;

    connect(token: string) {
        if (this.socket?.connected) {
            console.log('Already connected');
            return;
        }

        // Connexion au serveur Socket.IO sur le port 3003
        this.socket = io('/', { // // On se connecte à l'URL courante ('/'), Nginx fera le proxy pass basé sur le path '/pong.io'
            path: '/pong.io',
            auth: { token },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to game server:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from game server');
        });

        this.socket.on('gameInterrupted', (message: string) => {
            alert(message);
            window.history.back();
        });
    }

    joinRoom(roomId: string) {
        if (!this.socket) {
            console.error('Socket not connected!');
            return;
        }
        
        this.currentRoomId = roomId;
        this.socket.emit('joinGame', roomId);
        console.log(`Joining room: ${roomId}`);
    }

    sendInput(key: string) {
        if (!this.socket || !this.currentRoomId) return;
        
        this.socket.emit('input', {
            roomId: this.currentRoomId,
            key: key
        });
    }

	joinQueue() {
        if (!this.socket) return;
        this.socket.emit('joinQueue');
    }

    onMatchFound(callback: (roomId: string) => void) {
        if (!this.socket) return;
        this.socket.on('matchFound', callback);
    }

    onGameState(callback: (state: any) => void) {
        if (!this.socket) return;
        
        this.socket.on('gameState', callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.currentRoomId = null;
        }
    }
}

const GameSocketService = new GameSocketServiceClass();
export default GameSocketService;