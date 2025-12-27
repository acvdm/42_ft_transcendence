import Fastify from 'fastify'; // on importe la bibliothèque fastify
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Database } from 'sqlite';
import { initDatabase } from './database.js';
import { createMatch, rollbackDeleteGame } from './repositories/matches.js';
import { addPlayerToMatch, rollbackDeletePlayerFromMatch } from './repositories/player_match.js';
import { createStatLineforOneUser, findStatsByUserId, updateUserStats } from './repositories/stats.js';
import { NotFoundError } from './utils/error.js';

const fastify = Fastify({ logger: true });

let db: Database;

async function main() 
{
	db = await initDatabase();
	console.log('game database initialised');
}



//---------------------------------------
//---------------- GAME -----------------
//---------------------------------------

/* -- CREATE A GAME --*/
fastify.post('/games', async (request, reply) =>
{
	let gameId = null;
	let playerMatchOneId = null;
	let playerMatchTwoId = null;

	const body = request.body as { 
		playerOneId: number;
		playerTwoId: number; 
		type: string; 
		name: string; 
		tournamentId: number; 
	};	

	try
	{
		gameId = await createMatch(db, body.type, body.tournamentId);
		if (!gameId)
			throw new Error(`Error could not create game`);

		playerMatchOneId = await addPlayerToMatch(db, gameId, body.playerOneId);
		playerMatchTwoId = await addPlayerToMatch(db, gameId, body.playerTwoId);
		if (!playerMatchOneId || !playerMatchTwoId)
			throw new Error(`Error could not associate players with the game ${gameId}`);

		return reply.status(201).send({
			success: true,
			data: gameId,
			error: null
		})

	}
	catch (err:any)
	{
		if (gameId && playerMatchOneId)
			await rollbackDeletePlayerFromMatch(db, gameId, playerMatchOneId);

		if (gameId && playerMatchTwoId)
			await rollbackDeletePlayerFromMatch(db, gameId, playerMatchTwoId);

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
// fastify.post('/tournaments/local', async (request, reply) => 
// appel savelocaltournament


//---------------------------------------
//---------------- STATS -----------------
//---------------------------------------

/* -- CREATE A NEW STATS LINE FOR A NEW USER -- */
fastify.post('/users/:id/games/stats', async (request, reply) =>
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
fastify.get('/users/:id/games/stats', async (request, reply) =>
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


/* -- UPDATE STATS FOR ONE USER -- */
fastify.patch('/users/:id/games/stats', async (request, reply) => 
{
	try
	{
		const { id } = request.params as { id: string }
		const userId = Number(id);

		const body = request.body as {
			userScore: number,
			isWinner: number
		}
		
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