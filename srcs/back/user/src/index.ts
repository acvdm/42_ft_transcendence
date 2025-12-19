import Fastify from 'fastify'; // rôle de serveur HTTP
import sqlite3 from 'sqlite3';
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import { createUserInDB, createGuestInDB } from './repositories/users.js';
import fastifyCookie from '@fastify/cookie'; // NOUVEAU import du plugin
import * as friendRepo from './repositories/friendships.js';
import fs from 'fs';
import * as userRepo from './repositories/users.js';
import { ServiceUnavailableError, ValidationError } from './utils/error.js';

// Creation of Fastify server
const fastify = Fastify({ logger: true });

// NOUVEAY on enregistre le plugin cookie 
fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'un-secret-par-defaut',
});

let db: Database;

async function main() 
{
  db = await initDatabase();
  console.log('user database initialised');
}


//---------------------------------------
//---------------- USER -----------------
//---------------------------------------


/* -- REGISTER NEW USER -- */
fastify.post('/users', async (request, reply) => {
  
	const body = request.body as { 
		alias: string;
		email: string;
		password: string; 
		avatar?: string;
	};


	if (body.avatar && body.avatar.includes('/assets/')) {
        body.avatar = body.avatar.substring(body.avatar.indexOf('/assets/'));
    }

	let user_id = null; 

	try 
	{
		if (body.alias.length > 30) 
		{
		  throw new ValidationError('Error: Alias is too long, max 30 characters');
		}		
		// 1. Créer le user localement dans user.sqlite
		user_id = await userRepo.createUserInDB(db, body)		
		if (!user_id)
		{
			return reply.status(500).send({
				success: false,
				data: null,
				error: { message: 'Error during profile creation'}
			});
		}

		const authURL = `http://auth:3001/users/${user_id}/credentials`;

		// 3. Appeler le service auth pour créer les credentials
		const authResponse = await fetch(authURL, {
			method: "POST",
			headers: { 
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ 
				user_id: user_id, 
				email: body.email, 
				password: body.password, 
			}),
		});

		const authJson = await authResponse.json();

		console.log("Objet Response brut:", authResponse);
		console.log("Reponse de l'Auth:", authJson);

		if (authJson.success)
		{

    		const { refresh_token, access_token, user_id } = authJson;//.data?

			if (!access_token || !user_id) {
				throw new Error("Tokens manquants dans la reponse de l'Auth")
			}
    		// on stocke le refresh_token dans un cookie httpOnly (pas lisible par le javascript)
    		reply.setCookie('refresh_token', refresh_token, {
    		  path: '/',
    		  httpOnly: true, // invisible au JS (protection XSS)
    		  secure: true, // acces au cookie uniquement via https
    		  sameSite: 'strict', // protection CSRF (cookie envoye que si la requete part de notre site)
    		  maxAge: 7 * 24 * 3600, // 7 jours en secondes
    		  signed: true
    		});

			const statsURL = `http://game:3003/users/${user_id}/games/stats`;
			const statResponse = await fetch(statsURL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					user_id: user_id
				}),
			});

			// Gérer les erreurs du service game
        	if (!statResponse.ok) 
			{
            	const statJson = await statResponse.json().catch(() => ({}));
				
            	// Propager le code d'erreur du service game
            	if (statResponse.status >= 400 && statResponse.status < 500) {
            	    const error: any = new Error(
            	        statJson.error?.message || `Game service error: ${statResponse.status}`
            	    );
            	    error.statusCode = statResponse.status;
            	    throw error;
            	}
			
            	// Service game indisponible (5xx)
            	throw new ServiceUnavailableError('Game service is unavailable');
       		}
        
        	const statJson = await statResponse.json();
        
        	if (!statJson.success) 
			{
            	throw new Error(statJson.error?.message || 'Stats creation failed');
        	}

    		return reply.status(201).send({
				// success: true,
					// data: {
    					access_token: access_token,
    					user_id: user_id
					// },
				// error: null
    		});
			}
	}
	catch (err: any) 
	{
		const errorMessage = err.message;

		// 5. Rollback
		if (user_id) 
		{
		  console.log(`Rollback: delele orphan ID ${user_id}`);
		  await userRepo.rollbackDeleteUser(db, user_id);
		  console.log(`User ID ${user_id} successfully deleted`);
		}	

		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})

/* -- REGISTER GUEST -- */
fastify.post('/users/guest', async (request, reply) => {


	let userId = null; 

	try 
	{
		// 1. Créer le user localement dans user.sqlite
		userId = await userRepo.createGuestInDB(db)		
		if (!userId)
		{
			return reply.status(500).send({
				success: false,
				data: null,
				error: { message: 'Error during profile creation'}
			});
		}

		console.log(`User created locally (ID: ${userId}. Calling auth...`);
		const email = `guest` + `${userId}` + `@guest.com`;		
		const authURL = `http://auth:3001/users/${userId}/credentials/guest`;

		// 3. Appeler le service auth pour créer les credentials
		const authResponse = await fetch(authURL, {
			method: "POST",
			headers: { 
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ 
				user_id: userId, 
				email: email, 
			}),
		});

		const authJson = await authResponse.json();

		console.log("Objet Response brut:", authResponse);
		console.log("Reponse de l'Auth:", authJson);
    	// 4. Renvoyer la réponse du service auth (Tokens) au front. Le user est inscrit et connecté
    	// MODIFICATION -> renvoyer juste l'access token et pas le refresh token (il est dans un cookie)
    	// d'abord on extrait les infos recues du service Auth

		// il faut creer un json pour recuperer les donnees du fetch
		// const data = await authResponse.json();
		if (authJson.success)
		{
			// const authPayload = data; //.data MODIF
			// if (!authPayload || !authPayload.refresh_token)
			// 	throw new Error("Auth service response is missing tokens inside data object");

    		const { refresh_token, access_token, user_id } = authJson;//.data?

			if (!access_token || !user_id) {
				throw new Error("Tokens manquants dans la reponse de l'Auth")
			}
    		// on stocke le refresh_token dans un cookie httpOnly (pas lisible par le javascript)
    		reply.setCookie('refresh_token', refresh_token, {
    		  path: '/',
    		  httpOnly: true, // invisible au JS (protection XSS)
    		  secure: true, // acces au cookie uniquement via https
    		  sameSite: 'strict', // protection CSRF (cookie envoye que si la requete part de notre site)
    		  maxAge: 7 * 24 * 3600, // 7 jours en secondes
    		  signed: true
    		});

    		// console.log("data from authResponse: ", data);

    		// on envoit pas le refresh token /!\
    		return reply.status(201).send({
				// success: true,
					// data: {
    					access_token: access_token,
    					user_id: user_id
					// },
				// error: null
    		});
		}
		else {
			throw new Error(`Auth error: ${authJson.error.message}`); 
		}

	} 
	catch (err: any) 
	{
		const errorMessage = err.message;

		// 5. Rollback
		if (userId) 
		{
		  console.log(`Rollback: delele orphan ID ${userId}`);
		  await userRepo.rollbackDeleteUser(db, userId);
		  console.log(`User ID ${userId} successfully deleted`);
		}	

		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})



/* -- FIND USER -- */
fastify.get('/users/:id', async (request, reply) => 
{
	const { id } = request.params as { id: string };
	const userId = Number(id);

	const user = await userRepo.findUserByID(db, userId);    
	if (!user) 
	{
		return reply.status(404).send({
			success: false,
			data: null,
			error: { message: `User not found` }
	  	});
	}

	// je rajoute ca 
	let userEmail = "";
	try {
		const authResponse = await fetch(`http://auth:3001/users/${userId}/email`);
        if (authResponse.ok) {
            const authData = await authResponse.json();
            userEmail = authData.email || "";
        }
	} catch (err) {
		console.error("Error getting email from auth: ", err);
	}

	return {
		...user,
		email: userEmail
	};
})

fastify.get('/showfriend', async (request, reply) =>
{
	const { alias } = request.body as { alias: string };

	const user = await userRepo.findUserByAlias(db, alias);
	if (!user)
	{
		reply.status(404).send({
			success: false,
			data: null,
			error: { message: `User not found` }
	  	});
	}

	return user;
})


/* -- UPDATE STATUS -- */
fastify.patch('/users/:id/status', async (request, reply) =>
{
	const { id } = request.params as { id: string };
	const { status } = request.body as { status: string };
	const userId = Number(id);

	try 
	{
		userRepo.updateStatus(db, userId, status);
		return reply.status(200).send({
			success: true,
			data: null,
			error: null
		});
 	} 
	catch (err: any) 
	{
		fastify.log.error(err);
		console.log("status selected: ", status);

		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})


/* -- UPDATE BIO -- */
fastify.patch('/users/:id/bio', async (request, reply) =>
{
	const { id } = request.params as { id: string };
	const userId = Number(id);
	const { bio } = request.body as { bio: string };

	try
	{
		await userRepo.updateBio(db, userId, bio);
		return reply.status(200).send({
			success: false,
			data: null,
			error: null
		});
	}
	catch (err: any)
	{
		fastify.log.error(err);

		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})


/* -- UPDATE ALIAS -- */
fastify.patch('/users/:id/alias', async (request, reply) =>
{
	const { id } = request.params as { id: string };
	const userId = Number(id);
	const { alias } = request.body as { alias: string };

	try
	{
 		await userRepo.updateAlias(db, userId, alias);
		return reply.status(200).send({
			success: true,
			data: { alias: alias },
			error: null
		});
	}
	catch (err: any)
	{
		fastify.log.error(err);

		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})

/* -- UPDATE EMAIL -- */
fastify.patch('/users/:id/email', async (request, reply) =>
{
	const { id } = request.params as { id: string };
	const userId = Number(id);
	const { email } = request.body as { email: string };

	try
	{
		const authURL = `http://auth:3001/users/${userId}/credentials/email`;

		const authResponse = await fetch(authURL, {
			method: "PATCH",
			headers: { 
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ 
				email: email
			}),
		});

		const data = await authResponse.json();
		if (data.success)
		{
		    return reply.status(201).send({
				success: true,
				data: data,
				error: null
		    });
		}
	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})

/* -- UPDATE PASSWORD -- */
fastify.patch('/users/:id/password', async (request, reply) =>
{
	const { id } = request.params as { id: string };
	const userId = Number(id);
	const { oldPass } = request.body as { oldPass: string };
	const { newPass } = request.body as { newPass: string };
	const { confirmPass } = request.body as { confirmPass: string };

	try
	{
		const authURL = `http://auth:3001/users/${userId}/credentials/password`;

		const authResponse = await fetch(authURL, {
			method: "PATCH",
			headers: { 
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ 
				oldPass: oldPass,
				newPass: newPass,
				confirmPass: confirmPass
			}),
		});

		const data = await authResponse.json();
		if (data.success)
		{
		    return reply.status(201).send({
				success: true,
				data: data,
				error: null
		    });
		}
	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})

// pour la route pour update la vatar

/* -- UPDATE AVATAR -- */
fastify.patch('/users/:id/avatar', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = Number(id);
    let { avatar } = request.body as { avatar: string };

    try 
	{
        if (!avatar) 
			throw new Error("No avatar provided");

        if (avatar.includes('/assets/')) {
            avatar = avatar.substring(avatar.indexOf('/assets/'));
        }
        await userRepo.updateAvatar(db, userId, avatar);
        
        return reply.status(200).send({
            success: true,
            data: { avatar: avatar },
            error: null
        });
    } 
	catch (err: any) 
	{
        fastify.log.error(err);

		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
    }
});

/* -- UPDATE THEME -- */
fastify.patch('/users/:id/theme', async (request, reply) => 
{
    const { id } = request.params as { id: string };
    const userId = Number(id);
    const { theme } = request.body as { theme: string };

    try 
	{
        if (!theme) 
			throw new Error("No theme provided");

        await userRepo.updateTheme(db, userId, theme);
        
        return reply.status(200).send(
		{
            success: true,
            data: { theme: theme },
            error: null
        });
    } 
	catch (err: any) 
	{
        fastify.log.error(err);

		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
    }
});


//---------------------------------------
//--------------- FRIENDS ---------------
//---------------------------------------

/* -- FRIENDSHIP REQUEST -- */
fastify.post('/users/:id/friendships', async (request, reply) =>
{
	const { id } = request.params as { id: string };
	const { alias } = request.body as { alias: string };	
	const userId = Number(id);

	try
	{
		const friendship = await friendRepo.makeFriendshipRequest(db, userId, alias);
		return reply.status(200).send({
			success: true,
			data: friendship,
			error: null
		});
	}
	catch (err: any)
	{
		fastify.log.error(err);

		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})


/* -- REVIEW FRIEND REQUEST -- */
fastify.patch('/users/:id/friendships/:friendshipId', async (request, reply) =>
{
	const { id } = request.params as { id: string};
	const { friendshipId } = request.params as {friendshipId: string}
	const { status } = request.body as { status: string };
	const user_id = Number(id);
	const friendship_id = Number(friendshipId);

	try
	{
		friendRepo.reviewFriendshipRequest(db, user_id, friendship_id, status);
		return reply.status(200).send({ 
			success: true,
			data: null,
			error: null
		});
	}
	catch (err: any)
	{
		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})


/* -- LIST FRIENDS FOR ONE USER -- */
fastify.get('/users/:id/friends', async (request, reply) => 
{
	const { id } = request.params as { id: string };
	const userId = Number(id);

	try
	{
		const friendships: friendRepo.Friendship[] = await friendRepo.listFriends(db, userId);
		return reply.status(200).send({
			success: true,
			data: friendships,
			error: null
		});
	}
	catch (err: any)
	{
		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})

/* -- LIST FRIENDS PENDING REQUESTS FOR ONE USER -- */
fastify.get('/users/:id/friendships/pendings', async (request, reply) =>
{
	console.log("pendings");
	const { id } = request.params as { id: string };
	const userId = Number(id);

	try
	{
		const pending_requests: friendRepo.Friendship [] = await friendRepo.listRequests(db, userId);
		return reply.status(200).send({
			success: true,
			data: pending_requests,
			error: null
		});
	}
	catch (err: any)
	{
		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
	}
})



//---------------------------------------
//--------------- SERVER ----------------
//---------------------------------------


fastify.get('/health', async (request, reply) => 
{
	return { service: 'user', status: 'ready', port: 3004 };
})



const start = async () => 
{
	try 
	{
		// on attend que le serveur demaarre avant de continuer sur port 8080
		await fastify.listen({ port: 3004, host: '0.0.0.0' });
		console.log('Auth service listening on port 3004');
	} 
	catch (err) 
	{
		fastify.log.error(err);
		process.exit(1);
	}
}



// On initialise la DB puis on démarre le serveur
main().then(start).catch(err => 
{
	console.error("Startup error:", err);
	process.exit(1);
})