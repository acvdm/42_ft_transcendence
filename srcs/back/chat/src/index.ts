import Fastify from 'fastify';
import FastifyIO from 'fastify-socket.io';
import jwt from 'jsonwebtoken';
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import { Socket, Server } from 'socket.io'; // <--- AJOUT DE 'Server' ICI
import * as messRepo from "./repositories/messages.js";
import * as chanRepo from "./repositories/channels.js"; 
import { UnauthorizedError } from './utils/error.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

declare module 'socket.io' {
    interface Socket {
        user: any; // On ajoute la propriété user (type any ou { sub: number, ... })
    }
}

// Creation of Fastify server
const fastify = Fastify({ logger: true });

// On enregistre le plugin socket io
fastify.register(FastifyIO, {
    cors: {
        origin: "*", // Pense à mettre l'URL du front en prod
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
        return next(new Error("No token"));

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


// 1. Définir la logique Socket (se lance quand Fastify est prêt)
fastify.ready().then(() => {
    console.log("container chat");
    // Application de sécurité
    fastify.io.use(authMiddleware);
    
    // Toute la logique Socket se passe ICI
    fastify.io.on('connection', (socket: Socket) => {
        console.log(`Client connected (Fastify): ${socket.id}`);

        socket.on('registerUser', (userId: string) => {
            const id = Number(userId);
            userSockets.set(id, socket.id); // AJOUT: on stocke le socket id
            socket.join(`user_${userId}`);
            console.log(`User ${userId} registered for notifications`);
        });

        // On envoie le signal uniquement à la personne concernée
        socket.on('sendFriendRequestNotif', (data: { targetId: string }) => {
            fastify.io.to(`user_${data.targetId}`).emit('receiveFriendRequestNotif');
        });

        // acceptation de l'amitie
        socket.on('acceptFriendRequest', (data: { targetId: string }) => {
            fastify.io.to(`user_${data.targetId}`).emit('friendRequestAccepted');
        });

        socket.on("joinChannel", async (channelKey: string) => { 
            await joinChannel(socket, fastify.io, channelKey); 
        });
        
        socket.on('chatMessage', async (data: any) => { 
            await chatMessage(fastify.io, data); 
        });  

        socket.on('sendWizz', (data: any) => { 
            // Envoi uniquement au channel concerné
            fastify.io.to(data.channel_key).emit('receivedWizz', { author: data.author }); 
        });

        socket.on('sendAnimation', (data: any) => {
            fastify.io.to(data.channel_key).emit('receivedAnimation', { 
                animationKey: data.animationKey, 
                author: data.author 
            }); 
        });

        socket.on('notifyStatusChange', async (data: { userId: number, status: string, username: string }) => {
            try {
                // On récupère la liste d'amis via le service User (port 3004 selon votre docker-compose)
                const response = await fetch(`http://user:3004/users/${data.userId}/friends`);
                const result = await response.json();

                if (result.success && result.data) {
                    // On prévient chaque ami connecté
                    result.data.forEach((friendship: any) => {
                        const friendId = (friendship.user.id === data.userId) ? friendship.friend.id : friendship.user.id;
                        
                        // On envoie le message "friendStatusUpdate" que votre FriendList écoute déjà
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
                    
                    // Envoyer l'info à l'ami
                    fastify.io.to(`user_${friendId}`).emit('friendProfileUpdated', data);
                });
            }
        });
    });
});


// 2. Fonctions de logique métier
async function joinChannel(socket: Socket, io: Server, channelKey: string) {
    try {
        let isExistingChannel = await chanRepo.findChannelByKey(db, channelKey);
        
        // Si le channel n'existe pas en base, on le crée (simplifié)
        if (!isExistingChannel?.id) {
            try {
                await chanRepo.createChannel(db, channelKey);
                isExistingChannel = await chanRepo.findChannelByKey(db, channelKey);
            }
            catch (createErr: any) {
                if (createErr.code === 'SQLITE_CONSTRAINT')
                {
                    console.log("Channel créé simultanément par l'autre joueur");
                    isExistingChannel = await chanRepo.findChannelByKey(db, channelKey);
                }
                else
                    throw createErr;
            }
        }
        
        // IMPORTANT: Le socket rejoint la "room" Socket.IO
        socket.join(channelKey); 
        console.log(`Socket ${socket.id} joined room ${channelKey}`);

        // On renvoie l'historique si le channel existe
        if (isExistingChannel?.id) {
            const msg_history = await messRepo.getHistoryByChannel(db, isExistingChannel.id);
            // On envoie l'historique juste à celui qui vient d'arriver
            socket.emit("msg_history", { channelKey, msg_history });
        }
    } catch (err) {
        console.log("error joinChannel: ", err);
    }
}

async function chatMessage(io: Server, data: messRepo.Message) {
    const { channel_key, sender_id, sender_alias, msg_content } = data;
    console.log("Back: chatMessage ligne 654")

    try {
        const saveMessageID = await messRepo.saveNewMessageinDB(db, channel_key, sender_id, sender_alias, msg_content);
        
        if (!saveMessageID) {
            console.error('Error: message could not be saved');
            return;
        }

        // CORRECTION IMPORTANTE : On utilise .to(channel_key)
        // Sinon tout le serveur reçoit le message, même ceux dans d'autres chats !
        io.to(channel_key).emit('chatMessage', { 
            channelKey: channel_key, 
            msg_content, 
            sender_alias 
        });
        
    } catch (err: any) {
        console.error("Critical error in chatMessage :", err);
    }   
}

// 3. Route Health Check
fastify.get('/health', async () => {
    return { service: 'chat', status: 'ready', port: 3002 };
});

// 4. Initialisation Globale
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

// Lancement
main().then(start).catch(err => {
    console.error("Startup error:", err);
    process.exit(1);
});