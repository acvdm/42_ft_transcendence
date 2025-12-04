import Fastify from 'fastify'; // on importe la bibliothèque fastify
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import { validateRegisterInput } from './validators/auth_validators.js';
import { loginUser, registerUser } from './services/auth_service.js';
import fs from 'fs';


// Creation of Fastify server
const fastify = Fastify({ logger: true, });

let db: Database; // on stocke ici la connexion SQLite, globale au module

async function main() 
{	
	db = await initDatabase();
	console.log('auth database initialised');
}



//---------------------------------------
//----------- AUTHENTICATION ------------
//---------------------------------------

/* -- REGISTER - CREATE CREDENTIAL -- */
fastify.post('/users/:id/credentials', async (request, reply) => 
{
	try 
	{
		const body = request.body as { user_id: number; email: string; password: string };

		// 1. Valider
		validateRegisterInput(body);

		// 2. Traiter (toute la logique est dans le service)
		const result = await registerUser(db, body.user_id, body.email, body.password);

		// 3. Répondre
		return reply.status(200).send({
			success: true,
			data: result,
			error: null
		});
	} 
	catch (err: any) 
	{
		return reply.status(400).send({
			success: false, 
			data: null,
			error: { message: err.message }
		});
	}
});


/* -- LOGIN -- */ 
fastify.post('/sessions', async (request, reply) => 
{
	const body = request.body as { email: string, password: string };

	try 
	{
		const result = await loginUser(db, body.email, body.password);
		console.log("route /sessions atteinte");	
		console.log(`result: `, result);
		return reply.status(200).send({
			success: true,
			data: result,
			error: null
		});	
	} catch (err: any)
	{
		return reply.status(400).send({ 
			success: false,
			data: null,
			error: { message: err.message }  
		});
	}
});



//---------------------------------------
//--------------- SERVER ----------------
//---------------------------------------

fastify.get('/health', async (request, reply) => 
{
	return { service: 'auth', status: 'ready', port: 3001 };
});

const start = async () => 
{
	try
	{
		// on attend que le serveur demaarre avant de continuer sur port 8080
		await fastify.listen({ port: 3001, host: '0.0.0.0' });
		console.log('Auth service listening on port 3001');
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