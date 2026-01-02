import Fastify from 'fastify'; // on importe la bibliothèque fastify
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Database } from 'sqlite';
import { initDatabase } from './database.js';
import { createMatch, rollbackDeleteGame } from './repositories/matches.js';
import { addPlayerToMatch, rollbackDeletePlayerFromMatch } from './repositories/player_match.js';
import { createStatLineforOneUser, findStatsByUserId, updateUserStats } from './repositories/stats.js';
import { saveLocalTournament } from './repositories/tournaments.js';
import { localTournament } from './repositories/tournament_interfaces.js';
import { NotFoundError } from './utils/error.js';
import { Server } from 'socket.io';
import { ServerGame } from './engine/ServerGame.js';

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
/* Le seul appel API pour le tournois (seul moment ou le front parle au back)
Il a lieux a la fin du match (page de victoire/fin) 
Sinon tout se passe dans la memoire du navigateur
*/

// changer pour que ce soi restfull /game/tournament
fastify.post('/tournament', async (request, reply) => 
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
		await fastify.ready(); // on s'assure que les pluggins sont chargés
		// on attache socketio au serveur
		const io = new Server(fastify.server, {
			path: '/pong.io', // en accord avec la confgig defini dans la gateway
			cors: {
				origin: "*", // a voir selon le niveau de securite voulu
				methods: ["GET", "POST"]
			}
		});

		const activeGames = new Map<string, ServerGame>();

		io.on('connection', (socket: any) => {
			console.log('Game socket connected:', socket.id);
			socket.on('joinGame', (roomId: string) => {
				socket.join(roomId);

				let game = activeGames.get(roomId);
				if (!game) {
					game = new ServerGame(roomId, io);
					activeGames.set(roomId, game);

				}

				if (!game.player1Id) {
					game.player1Id = socket.id;
					console.log(`Player 1 (${socket.id}) joined room ${roomId}`);
				} else if (!game.player2Id) {
					game.player2Id = socket.id;
					console.log(`Player 2 (${socket.id}) joined room ${roomId}`);
					// LE JEU DÉMARRE ICI, QUAND IL Y A 2 JOUEURS
					game.startGameLoop();
				} else {
					console.log('Room is full, spectator mode');
					// Optionnel : Gérer les spectateurs ici
				}

			});

			socket.on('input', (data: any) => {
				const game = activeGames.get(data.roomId);
				if (game) {
					game.handleInput(socket.id, data.key);
				}
			});

			socket.on('disconnect', () => {
				console.log('User disconnected:', socket.id);
				// Trouver la partie du joueur déconnecté pour arrêter proprement
				for (const [roomId, game] of activeGames.entries()) {
					if (game.player1Id === socket.id || game.player2Id === socket.id) {
						game.stopGameLoop();
						activeGames.delete(roomId);
						io.to(roomId).emit('gameInterrupted', 'A player disconnected');
						break;
					}
				}
			});
		});


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


//////////////////////////
/// GESTION DU REMOTE ////
//////////////////////////














// On initialise la DB puis on démarre le serveur
main().then(start).catch(err => 
{
	console.error("Startup error:", err);
	process.exit(1);
});