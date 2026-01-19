import Fastify from 'fastify';
import FastifyIO from 'fastify-socket.io';
import jwt from 'jsonwebtoken';
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import { Socket, Server } from 'socket.io'; // <--- AJOUT DE 'Server' ICI
import * as messRepo from "./repositories/messages.js";
import * as chanRepo from "./repositories/channels.js"; 
import { ServiceUnavailableError, UnauthorizedError } from './utils/error.js';

declare module 'fastify' {
  interface FastifyInstance {
	io: Server;
  }
}

declare module 'socket.io' {
	interface Socket {
		user: any;
	}
}

// Creation of Fastify server
const fastify = Fastify({ logger: true });

// Register the socket io plugin.
fastify.register(FastifyIO, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	},
	path: '/socket.io/',
	transports: ['websocket', 'polling']
});

let db: Database;
const JWT_SECRET = process.env.JWT_SECRET!;
const userSockets = new Map<number, string>();

// Middleware de sécurité
const authMiddleware = (socket: any, next: any) => {
	const token = socket.handshake.auth.token?.replace('Bearer ', '');
	if (!token)
		return next(new ServiceUnavailableError("No token"));

	try
	{
		socket.user = jwt.verify(token, JWT_SECRET);
		next();
	}
	catch (e)
	{
		next(new UnauthorizedError("Invalid token"));
	}
}


// Define the Socket logic (launches when Fastify is ready)
fastify.ready().then(() => {
	fastify.io.use(authMiddleware);
	
	fastify.io.on('connection', (socket: Socket) => {
		const userId = socket.user.sub;


		socket.on('registerUser', (userId: string) => {
			const id = Number(userId);
			if (id !== Number(userId)) console.warn(`[Back] Warning: Socket ${socket.id} registering for user ${id} but token is ${userId}`);
			userSockets.set(id, socket.id);
			const roomName = `user_${id}`;
			socket.join(roomName);
		});

		socket.on('sendFriendRequestNotif', (data: { targetId: string }) => {
			fastify.io.to(`user_${data.targetId}`).emit('receiveFriendRequestNotif');
		});

		socket.on('acceptFriendRequest', (data: { targetId: string }) => {
			fastify.io.to(`user_${data.targetId}`).emit('friendRequestAccepted');
		});

		socket.on("joinChannel", async (channelKey: string) => { 
			await joinChannel(socket, fastify.io, channelKey);
		});

		socket.on("leavingChannel", (channelKey: string) => {
			socket.leave(channelKey);
			console.log(`Socket ${socket.id} left room ${channelKey}`);
		})

		socket.on('chatMessage', async (data: any) => { 
			await chatMessage(fastify.io, data, db); 
		});  

		socket.on('sendWizz', (data: any) => { 
			fastify.io.to(data.channel_key).emit('receivedWizz', { author: data.author , channelKey: data.channel_key}); 
		});

		socket.on('sendAnimation', (data: any) => {
			fastify.io.to(data.channel_key).emit('receivedAnimation', { 
				animationKey: data.animationKey, 
				author: data.author 
			}); 
		});

		socket.on('notifyStatusChange', async (data: { userId: number, status: string, username: string }) => {
			try {
				const response = await fetch(`http://user:3004/users/${data.userId}/friends`);
				const result = await response.json();

				if (result.success && result.data) {
					result.data.forEach((friendship: any) => {
						const friendId = (friendship.user.id === data.userId) ? friendship.friend.id : friendship.user.id;
						
						fastify.io.to(`user_${friendId}`).emit('friendStatusUpdate', {
							username: data.username,
							status: data.status
						});
					});
				}
			} catch (err) {
				console.error("Erreur diffusion statut:", err);
			}
		});

		socket.on('notifyProfileUpdate', async (data: any) => {
			const response = await fetch(`http://user:3004/users/${data.userId}/friends`);
			const result = await response.json();

			if (result.success && result.data) {
				result.data.forEach((friendship: any) => {
					const friendId = (friendship.user.id === data.userId) ? friendship.friend.id : friendship.user.id;
					
					fastify.io.to(`user_${friendId}`).emit('friendProfileUpdated', data);
				});
			}
		});
	});
});


// Job-specific logic functions
async function joinChannel(socket: Socket, io: Server, channelKey: string) {
	try {
		let isExistingChannel = await chanRepo.findChannelByKey(db, channelKey);
		
		if (!isExistingChannel?.id) {
			try {
				await chanRepo.createChannel(db, channelKey);
				isExistingChannel = await chanRepo.findChannelByKey(db, channelKey);
			}
			catch (createErr: any) {
				if (createErr.code === 'SQLITE_CONSTRAINT')
				{
					isExistingChannel = await chanRepo.findChannelByKey(db, channelKey);
				}
				else
					throw createErr;
			}
		}
		
		socket.join(channelKey); 
		console.log(`Socket ${socket.id} joined room ${channelKey}`);

		if (isExistingChannel?.id) {
			const msg_history = await messRepo.getHistoryByChannel(db, isExistingChannel.id);
			socket.emit("msg_history", { channelKey, msg_history });
		}
	} catch (err) {
		console.log("error joinChannel: ", err);
	}
}

async function chatMessage(io: Server, data: messRepo.Message, db: Database) {
	const { channel_key, sender_alias, msg_content } = data;
	const sender_id = Number(data.sender_id);

	try {
		const saveMessageID = await messRepo.saveNewMessageinDB(db, channel_key, sender_id, sender_alias, msg_content);
		
		if (!saveMessageID) {
			console.error('Error: message could not be saved');
			return;
		}

		io.to(channel_key).emit('chatMessage', { 
			channelKey: channel_key, 
			msg_content, 
			sender_alias,
			sender_id: sender_id
		});
		
		const ids = channel_key.split('-').map(Number);
		if (ids.length === 2 && !ids.some(isNaN)) {
			const targetId = ids.find(id => id !== sender_id);
			const notifRoom = `user_${targetId}`;

			if (targetId) {

				const room = io.sockets.adapter.rooms.get(notifRoom);
				const clientCount = room ? room.size : 0;
				io.to(notifRoom).emit('unreadNotification', {
					senderId: sender_id,
					content: msg_content
				});
			} else {
				console.warn(`[Back] ⚠️ Cannot determine targetId for notification (Ids: ${ids}, Sender: ${sender_id})`);
			}
		} else {
			console.log(`[Back] Skipped notification (Channel ${channel_key} is not a DM)`);
		}
		
	} catch (err: any) {
		console.error("Critical error in chatMessage :", err);
	}   
}

// Health Check
fastify.get('/health', async () => {
	return { service: 'chat', status: 'ready', port: 3002 };
});

// Global initialization
async function main() {
	db = await initDatabase();
	console.log('Chat database initialised');
}

const start = async () => {
	try {
		await fastify.listen({ port: 3002, host: '0.0.0.0' });
		console.log("Chat server listening on 3002");
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};


main().then(start).catch(err => {
	console.error("Startup error:", err);
	process.exit(1);
});