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

const socketAliases = new Map<string, string>();

// --- STRUCTURES JEU REMOTE ---
interface GameState {
    roomId: string;
    player1Id: string;
    player2Id: string;
    player1Alias: string;
    player2Alias: string;
    ball: { x: number, y: number, vx: number, vy: number, radius: number };
    paddle1: { y: number, height: number, width: number, x: number };
    paddle2: { y: number, height: number, width: number, x: number };
    score: { player1: number, player2: number };
    canvasWidth: number;
    canvasHeight: number;
    intervalId?: NodeJS.Timeout;
}

let waitingQueue: string[] = []; // ID des sockets en attente
const activeGames = new Map<string, GameState>();

// --- LOGIQUE JEU SERVEUR ---
const GAMESPEED = 1000 / 60; // 60 FPS

function initGameState(roomId: string, p1: string, p2: string, alias1: string, alias2: string): GameState {
    return {
        roomId,
        player1Id: p1,
        player2Id: p2,
        player1Alias: alias1, // Stockage
        player2Alias: alias2,
        canvasWidth: 800, // Taille de référence serveur
        canvasHeight: 600,
        ball: { x: 400, y: 300, vx: 5, vy: 5, radius: 10 },
        paddle1: { x: 30, y: 250, width: 10, height: 100 },
        paddle2: { x: 760, y: 250, width: 10, height: 100 },
        score: { player1: 0, player2: 0 }
    };
}

function resetBall(game: GameState) {
    game.ball.x = game.canvasWidth / 2;
    game.ball.y = game.canvasHeight / 2;
    // Vitesse aléatoire mais constante
    const angle = (Math.random() * Math.PI / 2) - (Math.PI / 4);
    const speed = 7;
    const direction = Math.random() > 0.5 ? 1 : -1;
    game.ball.vx = direction * speed * Math.cos(angle);
    game.ball.vy = speed * Math.sin(angle);
}

function updateGamePhysics(game: GameState, io: Server) {
    // Bouger la balle
    game.ball.x += game.ball.vx;
    game.ball.y += game.ball.vy;

    // Collision murs (Haut/Bas)
    if (game.ball.y - game.ball.radius < 0 || game.ball.y + game.ball.radius > game.canvasHeight) {
        game.ball.vy = -game.ball.vy;
    }

    // Collision Raquettes (Simplifiée)
    // P1
    if (game.ball.x - game.ball.radius < game.paddle1.x + game.paddle1.width &&
        game.ball.x + game.ball.radius > game.paddle1.x &&
        game.ball.y > game.paddle1.y &&
        game.ball.y < game.paddle1.y + game.paddle1.height) {
            game.ball.vx = Math.abs(game.ball.vx); // Rebond vers la droite
            game.ball.vx *= 1.05; // Accélération
    }
    // P2
    if (game.ball.x + game.ball.radius > game.paddle2.x &&
        game.ball.x - game.ball.radius < game.paddle2.x + game.paddle2.width &&
        game.ball.y > game.paddle2.y &&
        game.ball.y < game.paddle2.y + game.paddle2.height) {
            game.ball.vx = -Math.abs(game.ball.vx); // Rebond vers la gauche
            game.ball.vx *= 1.05; // Accélération
    }

    // Score
    if (game.ball.x < 0) {
        game.score.player2++;
        resetBall(game);
    } else if (game.ball.x > game.canvasWidth) {
        game.score.player1++;
        resetBall(game);
    }

    // Fin de partie (exemple: 5 points)
    if (game.score.player1 >= 5 || game.score.player2 >= 5) {
        stopGame(game.roomId, io);
    }

    // Envoi de l'état
    io.to(game.roomId).emit('gameState', {
        ball: game.ball,
        paddle1: game.paddle1,
        paddle2: game.paddle2,
        score: game.score
    });
}

function stopGame(roomId: string, io: Server) {
    const game = activeGames.get(roomId);
    if (game) {
        if (game.intervalId) clearInterval(game.intervalId);


        const isP1Winner = game.score.player1 > game.score.player2;
        const winnerRole = isP1Winner ? 'player1' : 'player2';
        const winnerName = isP1Winner ? game.player1Alias : game.player2Alias;



        io.to(roomId).emit('gameEnded', { finalScore: game.score, winner: winnerRole, winnerAlias: winnerName });
        activeGames.delete(roomId);
    }
}

// 1. Définir la logique Socket (se lance quand Fastify est prêt)
fastify.ready().then(() => {
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

        // ------------------------------------
        // --- EVENTS DU JEU REMOTE (AJOUT) ---
        // ------------------------------------

        // gestion des invitations
        socket.on('sendGameInvite', (data: { targetId: string, senderName: string }) => {
            const targetIdNum = Number(data.targetId);
            const targetSocketId = userSockets.get(targetIdNum);
            
            if (targetSocketId) {
                // nitifcations a l'ami via son socket
                fastify.io.to(targetSocketId).emit('receiveGameInvite', {
                    senderId: socket.user.sub, // son id
                    senderName: data.senderName
                });
            }
        });

        socket.on('acceptGameInvite', (data: { senderId: string, senderAlias?: string, acceptorAlias?: string }) => {
            const senderIdNum = Number(data.senderId);
            const senderSocketId = userSockets.get(senderIdNum);
            const acceptorSocketId = socket.id;

            // estce que le user est tjrs connecte
            if (senderSocketId) {
                const senderSocket = fastify.io.sockets.sockets.get(senderSocketId);
                
                if (senderSocket) {
                    // creation de la partie 
                    const roomId = `game_invite_${Date.now()}_${senderIdNum}_${socket.user.sub}`;
                    
                    const alias1 = data.senderAlias || socketAliases.get(senderSocketId) || "Player 1";
                    const alias2 = data.acceptorAlias || socketAliases.get(acceptorSocketId) || "Player 2";
                    // etat du jeu 
                    const gameState = initGameState(roomId, senderSocketId, acceptorSocketId, alias1, alias2);
                    activeGames.set(roomId, gameState);

                    // les deux ont rejoins la room
                    senderSocket.join(roomId);
                    socket.join(roomId);

                    setTimeout(() => {
                        senderSocket.emit('matchFound', { 
                            roomId, 
                            role: 'player1', 
                            opponent: socket.user.sub,
                            player1Alias: alias1,
                            player2Alias: alias2
                        });
                        
                        socket.emit('matchFound', { 
                            roomId, 
                            role: 'player2', 
                            opponent: senderIdNum,
                            player1Alias: alias1,
                            player2Alias: alias2
                        });
                        console.log(`Friend match started: ${roomId}`);
                        
                        //lancement de la boucle
                        gameState.intervalId = setInterval(() => {
                            updateGamePhysics(gameState, fastify.io);
                        }, GAMESPEED);
                    }, 100); // delai pour le frontend
                }
            }
        });

        socket.on('declineGameInvite', (data: { senderId: string }) => {
             const senderSocketId = userSockets.get(Number(data.senderId));
             if (senderSocketId) {
                 fastify.io.to(senderSocketId).emit('gameInviteDeclined', {});
             }
        });

        socket.on('joinQueue', (data: { alias?: string }) => {
            // si le joueur est deja en jeu ou en file d'addente on ignore
            if (waitingQueue.includes(socket.id)) return;

            const playerAlias = (data && data.alias) ? data.alias : "Player";
            socketAliases.set(socket.id, playerAlias);


            console.log(`Player ${socket.id} joined Queue`);
            waitingQueue.push(socket.id);

            // Si on a 2 joueurs, on lance
            if (waitingQueue.length >= 2) {
                const p1 = waitingQueue.shift()!;
                const p2 = waitingQueue.shift()!;
                const roomId = `game_${Date.now()}_${p1}_${p2}`;

                const alias1 = socketAliases.get(p1) || "Player 1";
                const alias2 = socketAliases.get(p2) || "Player 2";
                // Création état jeu
                const gameState = initGameState(roomId, p1, p2, alias1, alias2);
                activeGames.set(roomId, gameState);

                // Setup Sockets
                const sock1 = fastify.io.sockets.sockets.get(p1);
                const sock2 = fastify.io.sockets.sockets.get(p2);

                if (sock1 && sock2) {
                    sock1.join(roomId);
                    sock2.join(roomId);

                    const matchData = {
                        roomId,
                        player1Alias: alias1,
                        player2Alias: alias2
                    };

                    sock1.emit('matchFound', { 
                        roomId, 
                        role: 'player1', 
                        opponent: p2,
                        player1Alias: alias1,
                        player2Alias: alias2
                    });
                    
                    sock2.emit('matchFound', { 
                        roomId, 
                        role: 'player2', 
                        opponent: p1,
                        player1Alias: alias1,
                        player2Alias: alias2
                    });

                    console.log(`Match started: ${roomId}`);
                    
                    // Lancement boucle
                    gameState.intervalId = setInterval(() => {
                        updateGamePhysics(gameState, fastify.io);
                    }, GAMESPEED);
                }
            }
        });

        socket.on('leaveQueue', () => {
            waitingQueue = waitingQueue.filter(id => id !== socket.id);
        });

        socket.on('gameInput', (data: { roomId: string, up: boolean, down: boolean }) => {
            const game = activeGames.get(data.roomId);
            if (!game) return;

            const speed = 10;
            // Qui bouge ?
            let paddle = null;
            if (socket.id === game.player1Id) paddle = game.paddle1;
            else if (socket.id === game.player2Id) paddle = game.paddle2;

            if (paddle) {
                if (data.up) paddle.y -= speed;
                if (data.down) paddle.y += speed;
                // Limites
                if (paddle.y < 0) paddle.y = 0;
                if (paddle.y + paddle.height > game.canvasHeight) paddle.y = game.canvasHeight - paddle.height;
            }
        });

        // Dans srcs/back/chat/src/index.ts

        socket.on('leaveGame', (data: { roomId: string }) => {
            const game = activeGames.get(data.roomId);
            
            // Vérifier que le socket est bien un joueur de cette partie
            if (game && (game.player1Id === socket.id || game.player2Id === socket.id)) {
                console.log(`Player ${socket.id} left the game explicitly`);

                // Identifier l'adversaire
                const opponentId = (game.player1Id === socket.id) ? game.player2Id : game.player1Id;

                // Prévenir l'adversaire IMMÉDIATEMENT qu'il a gagné par forfait
                fastify.io.to(opponentId).emit('opponentLeft', { 
                    roomId: data.roomId,
                    leaver: socket.id 
                });

                // Arrêter la partie proprement
                stopGame(data.roomId, fastify.io);
            }
        });

        // Dans srcs/back/chat/src/index.ts

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            
            // Nettoyage map userSockets
            for (const [uid, sid] of userSockets.entries()) {
                if (sid === socket.id) {
                    userSockets.delete(uid);
                    break;
                }
            }
            
            // Nettoyage file d'attente
            waitingQueue = waitingQueue.filter(id => id !== socket.id);
            socketAliases.delete(socket.id);

            // GESTION DES PARTIES EN COURS
            for (const [roomId, game] of activeGames.entries()) {
                if (game.player1Id === socket.id || game.player2Id === socket.id) {
                    
                    // Identifier l'adversaire restant
                    const opponentId = (game.player1Id === socket.id) ? game.player2Id : game.player1Id;
                    
                    // Lui envoyer l'event de victoire par forfait
                    fastify.io.to(opponentId).emit('opponentLeft', { 
                        roomId: roomId,
                        leaver: socket.id 
                    });

                    stopGame(roomId, fastify.io);
                }
            }
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