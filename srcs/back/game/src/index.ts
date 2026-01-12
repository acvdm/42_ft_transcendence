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
import { initGameState, registerRemoteGameEvents, updateGamePhysics } from './remoteGame.js';

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




// ------------------------------------
// --- EVENTS DU JEU REMOTE (AJOUT) ---
// ------------------------------------

fastify.ready().then(() => {
    // Application de sécurité
    fastify.io.use(authMiddleware);
    
    // Toute la logique Socket se passe ICI
    fastify.io.on('connection', (socket: Socket) => {
        console.log(`Client connected (Fastify): ${socket.id}`);

        if (socket.user && socket.user.sub) {
            userSockets.set(socket.user.sub, socket.id);
        }

        registerRemoteGameEvents(fastify.io, socket, userSockets);

		
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            // Nettoyage map userSockets
            for (const [uid, sid] of userSockets.entries()) {
                if (sid === socket.id) {
                    userSockets.delete(uid);
                    break;
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
	let gameId = null;
	let p1Match = null;
	let p2Match = null;
	let start = null;
	let end = null;
	let finalDuration = 1;

	const body = request.body as localMatchResult;

	try
	{
		console.log(`Body: ${body.type}, ${body.p1.alias}, ${body.p1.userId}, ${body.p2.userId}`);

		const gameId = await createMatch(
			db, body.type,
			body.p1.alias, body.p2.alias,
			body.p1.score, body.p2.score,
			body.winner, 
			"finished", // status
			"1v1", // round
			null, // tournamentId
			body.startDate,
			body.endDate
		);

		if (body.startDate && body.endDate)
		{
			start = new Date(body.startDate).getTime();
			end = new Date(body.endDate).getTime();
			const diffInMins = end - start;
			const durationMinutes = Math.round(diffInMins / 60000);
			finalDuration = durationMinutes > 0 ? durationMinutes : 1;
		}

		console.log(`DEBUG DATES REÇUES -> Start: ${body.startDate} | End: ${body.endDate}`);


		if (!gameId)
			throw new Error(`Error could not create game`);

		if (body.p1.userId)
		{
			const p1IsWinner = body.winner == body.p1.alias
			p1Match = await addPlayerMatch(
				db, body.type, gameId,
				body.p1.userId, body.p2.alias,
				body.p1.score, body.p2.score,
				p1IsWinner ? 1 : 0
			);

			await updateUserStats(
				db, body.p1.userId,
				body.p1.score, p1IsWinner ? 1 : 0,
				finalDuration
			);
		}

		if (body.p2.userId)
		{
			const p2IsWinner = body.winner == body.p2.alias
			p2Match = await addPlayerMatch(
				db, body.type, gameId,
				body.p2.userId, body.p1.alias,
				body.p2.score, body.p1.score,
				p2IsWinner ? 1 : 0
			);

			await updateUserStats(
				db, body.p2.userId,
				body.p2.score, p2IsWinner ? 1 : 0,
				finalDuration
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
		
		if (!body.matchList || body.matchList.length !== 3)
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
fastify.post('/games/users/:id/stats', async (request, reply) =>
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

/* -- STAT EXPORT FOR ONE USER -- */
fastify.get('/users/:id/export', async (request, reply) =>
{
	try
	{
		const { id } = request.params as { id: string }
		const userId = Number(id);
		if (!userId)
				return reply.status(400).send({ error: "Invalid ID" });


		const stats = await findStatsByUserId(db, userId);
		const historyResult = await getUserMatchHistory(db, userId, { limit: 10000, page: 1});
		
		return reply.status(200).send({
			success: true,
			data: {
				stats: stats,
				history: historyResult.data
			},
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