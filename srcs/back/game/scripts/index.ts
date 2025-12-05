import Fastify from 'fastify'; // on importe la bibliothèque fastify
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Database } from 'sqlite';
import { initDatabase } from './database.js';

const fastify = Fastify({ logger: true });

let db: Database;

async function main() 
{
	db = await initDatabase();
	console.log('game database initialised');
}


// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/status', async (request, reply) => 
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