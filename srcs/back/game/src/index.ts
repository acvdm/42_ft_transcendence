import Fastify from 'fastify'; // on importe la bibliothèque fastify
import FastifyIO from 'fastify-socket.io';
import { Socket, Server } from 'socket.io';
import jwt from 'jsonwebtoken';
// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';
import { Database } from 'sqlite';
import { initDatabase } from './database.js';
import { createMatch, rollbackDeleteGame } from './repositories/matches.js';
import { addPlayerMatch, rollbackDeletePlayerFromMatch } from './repositories/player_match.js';
import { createStatLineforOneUser, findStatsByUserId, getUserMatchHistory, updateUserStats } from './repositories/stats.js';
import { saveLocalTournament } from './repositories/tournaments.js';
import { localMatchResult, localTournament } from './repositories/tournament_interfaces.js';
import { NotFoundError, UnauthorizedError } from './utils/error.js';

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

const fastify = Fastify({ logger: true });

// On enregistre le plugin socket io
fastify.register(FastifyIO as any, {
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

// --- STRUCTURES JEU REMOTE ---
interface GameState {
    roomId: string;
    player1Id: string;
    player2Id: string;
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

function initGameState(roomId: string, p1: string, p2: string): GameState {
    return {
        roomId,
        player1Id: p1,
        player2Id: p2,
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
        io.to(roomId).emit('gameEnded', { finalScore: game.score });
        activeGames.delete(roomId);
    }
}

// ------------------------------------
// --- EVENTS DU JEU REMOTE (AJOUT) ---
// ------------------------------------

fastify.ready().then(() => {
    // Application de sécurité
    fastify.io.use(authMiddleware);
    
    // Toute la logique Socket se passe ICI
    fastify.io.on('connection', (socket: Socket) => {
        console.log(`Client connected (Fastify): ${socket.id}`);
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

        socket.on('acceptGameInvite', (data: { senderId: string }) => {
            const senderIdNum = Number(data.senderId);
            const senderSocketId = userSockets.get(senderIdNum);
            const acceptorSocketId = socket.id;

            // estce que le user est tjrs connecte
            if (senderSocketId) {
                const senderSocket = fastify.io.sockets.sockets.get(senderSocketId);
                
                if (senderSocket) {
                    // creation de la partie 
                    const roomId = `game_invite_${Date.now()}_${senderIdNum}_${socket.user.sub}`;
                    
                    // etat du jeu 
                    const gameState = initGameState(roomId, senderSocketId, acceptorSocketId);
                    activeGames.set(roomId, gameState);

                    // les deux ont rejoins la room
                    senderSocket.join(roomId);
                    socket.join(roomId);

                    setTimeout(() => {
                        senderSocket.emit('matchFound', { roomId, role: 'player1', opponent: socket.user.sub });
                        socket.emit('matchFound', { roomId, role: 'player2', opponent: senderIdNum });
                        // lancement du jeu 
    
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

        socket.on('joinQueue', () => {
            // si le joueur est deja en jeu ou en file d'addente on ignore
            if (waitingQueue.includes(socket.id)) return;

            console.log(`Player ${socket.id} joined Queue`);
            waitingQueue.push(socket.id);

            // Si on a 2 joueurs, on lance
            if (waitingQueue.length >= 2) {
                const p1 = waitingQueue.shift()!;
                const p2 = waitingQueue.shift()!;
                const roomId = `game_${Date.now()}_${p1}_${p2}`;

                // Création état jeu
                const gameState = initGameState(roomId, p1, p2);
                activeGames.set(roomId, gameState);

                // Setup Sockets
                const sock1 = fastify.io.sockets.sockets.get(p1);
                const sock2 = fastify.io.sockets.sockets.get(p2);

                if (sock1 && sock2) {
                    sock1.join(roomId);
                    sock2.join(roomId);

                    sock1.emit('matchFound', { roomId, role: 'player1', opponent: p2 });
                    sock2.emit('matchFound', { roomId, role: 'player2', opponent: p1 });

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

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            // Nettoyage map userSockets
            for (const [uid, sid] of userSockets.entries()) {
                if (sid === socket.id) {
                    userSockets.delete(uid);
                    break;
                }
            }
            // Nettoyage file
            waitingQueue = waitingQueue.filter(id => id !== socket.id);
            // nettoyage parties actives
            // si un joueur part, la partie s'arrête)
            for (const [roomId, game] of activeGames.entries()) {
                if (game.player1Id === socket.id || game.player2Id === socket.id) {
                    stopGame(roomId, fastify.io);
                }
            }
        });
    });
});


//---------------------------------------
//---------------- GAME -----------------
//---------------------------------------

/* -- CREATE A GAME --*/
fastify.post('/games', async (request, reply) =>
{

	console.log("route games")
	let gameId = null;
	let p1Match = null;
	let p2Match = null;

	const body = request.body as localMatchResult;

	try
	{
		console.log(`Body: ${body.type}, ${body.p1.alias}, ${body.p1.user_id}, ${body.p2.user_id}`);

		const gameId = await createMatch(
			db, body.type,
			body.p1.alias, body.p2.alias,
			body.p1.score, body.p2.score,
			body.winner, "finished",
			"1v1", null, body.startDate
		);

		if (!gameId)
			throw new Error(`Error could not create game`);

		// playerMatchOneId = await addPlayerToMatch(db, gameId, body.playerOneId);
		// playerMatchTwoId = await addPlayerToMatch(db, gameId, body.playerTwoId);
		// if (!playerMatchOneId || !playerMatchTwoId)
		// 	throw new Error(`Error could not associate players with the game ${gameId}`);

		if (body.p1.user_id)
		{
			const p1IsWinner = body.winner == body.p1.alias
			p1Match = await addPlayerMatch(
				db, "local", gameId,
				body.p1.user_id, body.p2.alias,
				body.p1.score, p1IsWinner ? 1 : 0
			);

			await updateUserStats(
				db, body.p1.user_id,
				body.p1.score, p1IsWinner ? 1 : 0
			);
		}

		if (body.p2.user_id)
		{
			const p2IsWinner = body.winner == body.p2.alias
			p2Match = await addPlayerMatch(
				db, "local", gameId,
				body.p2.user_id, body.p1.alias,
				body.p2.score, p2IsWinner ? 1 : 0
			);

			await updateUserStats(
				db, body.p2.user_id,
				body.p2.score, p2IsWinner ? 1 : 0
			);
		}
		return reply.status(201).send({
			success: true,
			data: gameId,
			error: null
		})

	}
	catch (err:any)
	{
		if (gameId && p1Match)
			await rollbackDeletePlayerFromMatch(db, gameId, p1Match);

		if (gameId && p2Match)
			await rollbackDeletePlayerFromMatch(db, gameId, p2Match);

		if (gameId)
			await rollbackDeleteGame(db, gameId);
		
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false,
			data: null,
			error: { message: (err as Error).message }
		});
	}
})


/** -- TOURNAMENT -- */
/* Le seul appel API pour le tournois (seul moment ou le front parle au back)
Il a lieux a la fin du match (page de victoire/fin) 
Sinon tout se passe dans la memoire du navigateur
*/

// changer pour que ce soi restfull /game/tournament
fastify.post('/games/tournaments', async (request, reply) => 
{
	try
	{
		const body = request.body as localTournament; // === interface dans tournament_interfaces
		if (!body.match_list || body.match_list.length !== 3)
		{
			return reply.status(400).send({
				success: false,
				data: null,
				error: { message: "Invalid format: 3 matches required"}
			});
		}

		const tournamentId = await saveLocalTournament(db, body);

		return reply.status(201).send({
			success: true,
			data: { tournamentId },
			error: null
		})


	}
	catch (err: any)
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false,
			data: null,
			error: { message: (err as Error).message }
		})
	}
})



//---------------------------------------
//---------------- STATS -----------------
//---------------------------------------

/* -- CREATE A NEW STATS LINE FOR A NEW USER -- */
fastify.post('/users/:id/stats', async (request, reply) =>
{
	try
	{
		const { id } = request.params as { id: string }
		const userId = Number(id);

		const newStat = await createStatLineforOneUser(db, userId);
		if (!newStat)
			throw new NotFoundError(`Error: could not create stat line for user ${userId}`);

		return reply.status(200).send({
			success: true,
			data: newStat,
			error: null
		})

	}
	catch (err: any)
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false,
			data: null,
			error: { message: (err as Error).message }
		})
	}
})


/* -- GET STATS FOR ONE USER -- */
fastify.get('/games/users/:id/stats', async (request, reply) =>
{
	try
	{
		const { id } = request.params as { id: string }
		const userId = Number(id);

		const userStats = await findStatsByUserId(db, userId);
		if (!userStats)
			throw new NotFoundError(`Error: could not find stat for user ${userId}`);

		return reply.status(200).send({
			success: true,
			data: userStats,
			error: null
		})

	}
	catch (err: any)
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false,
			data: null,
			error: { message: (err as Error).message }
		})
	}
})

/* -- GET HISTORY FOR ONE USER -- */
fastify.get('/games/users/:id/history', async (request, reply) => 
{
	const query = request.query as any;
	const userId = Number(query.userId);

	if (!userId) 
	{
		return reply.status(400).send({error: "userId is required"});
	}

	try 
	{
		const result = await getUserMatchHistory(db, userId, {
				page: Number(query.page),
				limit: Number(query.limit),
				onlyWins: query.filter == 'wins',
				gameType: query.type
			});
		return reply.send(result);
	}
	catch (err)
	{
		return reply.status(500).send({ error: "Failed to fetch history" });
	}

});


/* -- UPDATE STATS FOR ONE USER -- */
fastify.patch('/users/:id/stats', async (request, reply) => 
{
	try
	{
		const { id } = request.params as { id: string }
		const userId = Number(id);

		console.log("userId = ", userId);
		const body = request.body as {
			gameType: string,
			matchId: number,
			opponent: string,
			userScore: number,
			isWinner: number
		}
		
		// const gameType = "Local";
		const userStats = await updateUserStats(db, userId, body.userScore, body.isWinner);
		if (!userStats)
			throw new Error(`Error: could not update stats for user ${userId}`);

		return reply.status(200).send({
			success: true,
			data: userStats,
			error: null
		})
	}
	catch (err: any)
	{
		const statusCode = err.statusCode || 500;
		return reply.status(statusCode).send({
			success: false,
			data: null,
			error: { message: (err as Error).message }
		})
	}
})



// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/health', async (request, reply) => 
{
	return { service: 'game', status: 'ready', port: 3003 };
});

async function main() 
{
	db = await initDatabase();
	console.log('game database initialised');
}

// on demarre le serveur
const start = async () => 
{
	try 
	{
		// on attend que le serveur demaarre avant de continuer sur port 8080
		await fastify.listen({ port: 3003, host: '0.0.0.0' });
		console.log('Auth service listening on port 3003');
	} 
	catch (err) 
	{
		fastify.log.error(err);
		process.exit(1);
	}
};

// On initialise la DB puis on démarre le serveur
main().then(start).catch(err => 
{
	console.error("Startup error:", err);
	process.exit(1);
});