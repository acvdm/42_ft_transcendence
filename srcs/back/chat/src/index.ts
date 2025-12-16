import Fastify from 'fastify';
import FastifyIO from 'fastify-socket.io';
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import { Socket, Server } from 'socket.io'; // <--- AJOUT DE 'Server' ICI
import * as messRepo from "./repositories/messages.js";
import * as chanRepo from "./repositories/channels.js"; 

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
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

// 1. Définir la logique Socket (se lance quand Fastify est prêt)
fastify.ready().then(() => {
    // Note: On n'initialise plus la DB ici, car main() le fait avant.
    
    // Toute la logique Socket se passe ICI
    fastify.io.on('connection', (socket: Socket) => {
        console.log(`Client connected (Fastify): ${socket.id}`);

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

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
});

// 2. Fonctions de logique métier
async function joinChannel(socket: Socket, io: Server, channelKey: string) {
    try {
        const isExistingChannel = await chanRepo.findChannelByKey(db, channelKey);
        
        // Si le channel n'existe pas en base, on le crée (simplifié)
        if (!isExistingChannel?.id) {
            await chanRepo.createChannel(db, channelKey);
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