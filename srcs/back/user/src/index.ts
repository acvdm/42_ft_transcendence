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

	let userId = null; 

	try 
	{
		if (body.alias.length > 30) 
		{
		  throw new ValidationError('Error: Alias is too long, max 30 characters');
		}		
		// 1. Créer le user localement dans user.sqlite
		userId = await userRepo.createUserInDB(db, body)		
		if (!userId)
		{
			return reply.status(500).send({
				success: false,
				data: null,
				error: { message: 'Error during profile creation'}
			});
		}

		const authURL = `http://auth:3001/users/${userId}/credentials`;

		// 3. Appeler le service auth pour créer les credentials
		const authResponse = await fetch(authURL, {
			method: "POST",
			headers: { 
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ 
				userId: userId, 
				email: body.email, 
				password: body.password, 
			}),
		});

		// Gérer les erreurs du service auth
		if (!authResponse.ok)
		{
			const authJson = await authResponse.json().catch(() => ({}));

			// Propoager le code d'erreur du service auth
			if (authResponse.status >= 400 && authResponse.status < 500)
			{
				const error: any = new Error(
					authJson.error?.message || `Auth service error: ${authResponse.status}`
				);
				error.statusCode = authResponse.status;
				throw error;
			}

			throw new ServiceUnavailableError(`Auth service is unavailable`);
		}

		const authJson = await authResponse.json();

		console.log("Objet Response brut:", authResponse);
		console.log("Reponse de l'Auth:", authJson);

		if (authJson.success)
		{

    		const { refreshToken, accessToken, userId } = authJson;//.data?

			if (!accessToken || !userId) {
				throw new Error("Tokens manquants dans la reponse de l'Auth")
			}
    		// on stocke le refreshToken dans un cookie httpOnly (pas lisible par le javascript)
    		reply.setCookie('refreshToken', refreshToken, {
    		  path: '/',
    		  httpOnly: true, // invisible au JS (protection XSS)
    		  secure: true, // acces au cookie uniquement via https
    		  sameSite: 'strict', // protection CSRF (cookie envoye que si la requete part de notre site)
    		  maxAge: 7 * 24 * 3600, // 7 jours en secondes
    		  signed: true
    		});
			console.log("user_id dans user = ", userId)
			const statsURL = `http://game:3003/games/users/${userId}/stats`;
			const statResponse = await fetch(statsURL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: userId
				}),
			});

			// Gérer les erreurs du service game
        	if (!statResponse.ok) 
			{
            	const statJson = await statResponse.json().catch(() => ({}));
				
            	// Propager le code d'erreur du service game
            	if (statResponse.status >= 400 && statResponse.status < 500) 
				{
            	    const error: any = new Error(
            	        statJson.error?.message || `Game service error: ${statResponse.status}`
            	    );
            	    error.statusCode = statResponse.status;
            	    throw error;
            	}
			
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
    					accessToken: accessToken,
    					userId: userId
					// },
				// error: null
    		});
			}
	}
	catch (err: any) 
	{
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
				userId: userId, 
				email: email, 
			}),
		});

		// Gérer les erreurs du service auth
		if (!authResponse.ok)
		{
			const authJson = await authResponse.json().catch(() => ({}));

			// Propoager le code d'erreur du service auth
			if (authResponse.status >= 400 && authResponse.status < 500)
			{
				const error: any = new Error(
					authJson.error?.message || `Auth service error: ${authResponse.status}`
				);
				error.statusCode = authResponse.status;
				throw error;
			}

			throw new ServiceUnavailableError(`Auth service is unavailable`);
		}

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
			// if (!authPayload || !authPayload.refreshToken)
			// 	throw new Error("Auth service response is missing tokens inside data object");

    		const { refreshToken, accessToken, userId } = authJson;//.data?

			if (!accessToken || !userId) {
				throw new Error("Tokens manquants dans la reponse de l'Auth")
			}
    		// on stocke le refreshToken dans un cookie httpOnly (pas lisible par le javascript)
    		reply.setCookie('refreshToken', refreshToken, {
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
    					accessToken: accessToken,
    					userId: userId
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

		// Gérer les erreurs du service auth
		if (!authResponse.ok)
		{
			const authJson = await authResponse.json().catch(() => ({}));

			// Propoager le code d'erreur du service auth
			if (authResponse.status >= 400 && authResponse.status < 500)
			{
				const error: any = new Error(
					authJson.error?.message || `Auth service error: ${authResponse.status}`
				);
				error.statusCode = authResponse.status;
				throw error;
			}

			throw new ServiceUnavailableError(`Auth service is unavailable`);
		}

		const authJson = await authResponse.json();
		if (authJson.success)
		{
		    return reply.status(201).send({
				success: true,
				data: authJson,
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

		// Gérer les erreurs du service auth
		if (!authResponse.ok)
		{
			const authJson = await authResponse.json().catch(() => null);

			const errorMessage = authJson?.error?.message || authJson?.message || `Error Auth service (${authResponse.status})`;
			const error: any = new Error(errorMessage);
			error.statusCode = authResponse.status;
			throw error;

			// Propoager le code d'erreur du service auth
			// if (authResponse.status >= 400 && authResponse.status < 500)
			// {
			// 	const error: any = new Error(
			// 		authJson.error?.message || `Auth service error: ${authResponse.status}`
			// 	);
			// 	error.statusCode = authResponse.status;
			// 	throw error;
			// }

			// throw new ServiceUnavailableError(`Auth service is unavailable`);
		}

		const authJson = await authResponse.json();
		if (authJson.success)
		{
		    return reply.status(201).send({
				success: true,
				data: authJson,
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
		const statusCode = err.statusCode || 500;

		reply.status(statusCode).send({			  
			success: false,			  
			data: null, 			  
			error: { message: (err as Error).message } 		
		});
    }
});

//---------------------------------------
//----------------- GDPR ----------------
//---------------------------------------

/* ---- DELETE USER ---- */
fastify.delete('/users/:id', async (request, reply) =>
{
	console.log("Processsing account deletion...");

	const { id } = request.params as { id: string };
	const userId = Number(id);
	if (!userId) {
		return reply.status(404).send({
			success: false,
			error: { message: "User not found" }
		});
	}

	const authURL = `http://auth:3001/users/${userId}/`;

	try
	{
		console.log("- Deleting friendships...");
		await friendRepo.deleteAllFriendships(db, userId);

		console.log("- Calling Auth service...");
		const authResponse = await fetch(authURL, {
			method: "DELETE",
		});
	
		// Gérer les erreurs du service auth
		if (!authResponse.ok)
		{
			const authJson = await authResponse.json().catch(() => ({}));

			// Propager le code d'erreur du service auth
			const error: any = new Error(
				authJson.error?.message || `Auth service error: ${authResponse.status}`
			);
			error.statusCode = authResponse.status;
			throw error;
		}

		console.log("- Anonymising user profile...");
		// remplace le pseudo par Deleted_User_XXX et l'avatar par defaut
		await userRepo.anonymizeUser(db, userId);

		// deconnextion -> suppression du cookie pour que le navigateur sache quil nest plus connecte
		reply.clearCookie('refreshToken', { path: '/' });

		return reply.status(200).send({
			success: true,
			message: "Account successfully deleted",
			error: null
		});
	}
	catch (err: any)
	{
		console.error("Error during account deletion:", err);
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false,
			data: null,
			error: { message: err.message || "Failed to delete account" }
		});
	}
})

/* ---- EXPORT ----- */
fastify.get('/users/:id/export', async (request, reply) =>
{
	console.log("Processsing account export...");

	const { id } = request.params as { id: string };
	const userId = Number(id);
	if (!userId) {
		return reply.status(404).send({
			success: false,
			error: { message: "User not found" }
		});
	}

	try
	{	
		/* EXPORT FROM USER */	
		const userProfile = await userRepo.findUserByID(db, userId);
		if (!userProfile) {
			return reply.status(404).send({
				success: false,
				error: { message: "User not found" }
			});
		}

		const friendList = await friendRepo.listFriends(db, userId);

		/* EXPORT FROM AUTH */	
		console.log("- Calling Auth service...");
		const authURL = `http://auth:3001/users/${userId}/export`;

		let authPayload: any = {};
		
		const authResponse = await fetch(authURL, {
			method: "GET",
		});
		if (!authResponse.ok)
			console.error("Problem with fetch with the Auth service");
		else
		{
			const authJson = await authResponse.json();
			authPayload = authJson.data;
		}

		/* EXPORT FROM GAME */
		// console.log("- Calling Game service...");
		// const gameResponse = await fetch( , {
		// 	method: "GET",
		// });
		// if (!gameResponse.ok)
		// {
		// 	const ganeJson = await gameResponse.json().catch(() => ({}));

		// 	// Propager le code d'erreur du service auth
		// 	const error: any = new Error(
		// 		gameJson.error?.message || `ame service error: ${gameResponse.status}`
		// 	);
		// 	error.statusCode = gameResponse.status;
		// 	// throw error;
		// }
						

		/* object final envoye */
		const exportData = {
			identity: {
				id: authPayload?.id,
				email: authPayload?.email || "Not available",
				twoFaMethod: authPayload?.twoFaMethod || "Not available",
				createdAt: authPayload?.createdAt || "Not available",
			},
			profile: {
				alias: userProfile.alias,
				bio: userProfile.bio,
				avatar: userProfile.avatar_url,
				theme: userProfile.theme,
				status: userProfile.status
				// id: userProfile.id, // transformer en string ?
				// createdAt: userProfile.created_at
			},
			social: {
				friend: friendList.map((f: any) => {
					return (f.user_id == userId) ? f.friend?.alias : f.user?.alias;
				})
				// pendindRequest: friendList.
			},
			export_date: new Date().toISOString()
			// gaming: {
				// stats:
				// matchHistory:
			// 	/* a completer */
			// },
			
		};

		// fichier json
		reply.header('Content-Type', 'application/json');

		// COntent-Disposition= header pour gerer les telechargementsne pas afficher mais telecharger sous le nom specifie
		reply.header('Content-Disposition', `attachment; filename="user_data_${userId}.json"`);

		return reply.status(200).send(exportData);
	}
	catch (err: any)
	{
		console.error("Error during download data:", err);
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false,
			data: null,
			error: { message: err.message || "Failed to download account data" }
		});
	}
})

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
	const userId = Number(id);
	const friendship_id = Number(friendshipId);

	try
	{
		friendRepo.reviewFriendshipRequest(db, userId, friendship_id, status);
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
		const pendingRequests: friendRepo.Friendship [] = await friendRepo.listRequests(db, userId);
		return reply.status(200).send({
			success: true,
			data: pendingRequests,
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