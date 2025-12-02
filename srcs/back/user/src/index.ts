import Fastify from 'fastify'; // rôle de serveur HTTP
import sqlite3 from 'sqlite3';
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import * as userRepo from './repositories/users.js';
import * as friendRepo from './repositories/friendships.js';
import fs from 'fs';

// Creation of Fastify server
const fastify = Fastify({ logger: true});

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
fastify.post('/register', async (request, reply) => {
  
  const body = request.body as { 
      alias: string;
      email: string;
      password: string; 
      avatar?: string;
    };

  let user_id = null; 

  try 
  {
    if (body.alias.length > 30)
      throw new Error('Error: Alias is too long, max 30 characters');

    // 1. Créer le user localement dans user.sqlite
    user_id = await userRepo.createUserInDB(db, body)

    if (!user_id)
      return reply.status(500).send('Error during profile creation');
    console.log(`User created locally (ID: ${user_id}. Calling auth...`);

    // 3. Appeler le service auth pour créer les credentials
    const authResponse = await fetch("http://auth:3001/register", {
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

    if (!authResponse.ok)
      throw new Error(`Error HTTP, ${authResponse.status}`);

    // 4. Renvoyer la réponse du service auth (Tokens) au front. Le user est inscrit et connecté
    const data = await authResponse.json();
    console.log('User successfully added to Database! ', data);
    return reply.status(201).send(data);

  } 
  catch (err: any) 
  {
    const errorMessage = err.message;
    console.error("Final error message: ", errorMessage);

    // 5. Rollback
    if (user_id) 
    {
      console.log(`Rollback: delele orphan ID ${user_id}`);
      await userRepo.rollbackDeleteUser(db, user_id);
      console.log('User ID ${user_id} successfully deleted');
    }

    console.log(errorMessage);
    reply.status(400).send({ errorMessage });
  }
})



/* -- FIND USER -- */
fastify.get('/:id', async (request, reply) => 
{
	const { id } = request.params as any;

	const user = await userRepo.findUserByID(db, id);    
	if (!user) 
	{
	  reply.status(404);
	  return { error: 'User not found' };
	}

	return user;
})



/* -- UPDATE STATUS -- */
fastify.patch('/:id/status', async (request, reply) => 
{
  const { id } = request.params as { id: number };
  const { status } = request.body as { status: string };

  try 
  {
    userRepo.updateStatus(db, id, status);
    return reply.status(200).send({ message: 'Status updated successfully' });
  } 
  catch (err) 
  {
    fastify.log.error(err);
    return reply.status(500).send({ message: 'Failed to update status' });
  }
})



/* -- UPDATE BIO -- */
fastify.patch('/:id/bio', async (request, reply) =>
{
  const { id } = request.params as { id: number };
  const { bio } = request.body as { bio: string };

  try
  {
    userRepo.updateBio(db, id, bio);
    return reply.status(200).send({ message: 'Bio updated successfully' });
  }
  catch (err)
  {
    fastify.log.error(err);
    return reply.status(500).send({ message: 'Failed to update bio' });
  }
})




//---------------------------------------
//--------------- FRIENDS ---------------
//---------------------------------------

/* -- FRIENDSHIP REQUEST -- */
fastify.post('/:id/friendrequest', async (request, reply) =>
{
	const { user_id } = request.params as { user_id: number };
	const { friend_id } = request.body as { friend_id: number };

	try
	{
		const requestID = await friendRepo.friendshipRequest(db, user_id, friend_id);
		if (!requestID)
			return reply.status(500).send('Error while sending friend request');
		return reply.status(200).send(`Friend request sent from ${user_id} to ${friend_id}`);

	}
	catch (err)
	{
		fastify.log.error(err);
		return reply.status(500).send({ message: err });
	}
})


/* -- REVIEW FRIEND REQUEST -- */
fastify.patch('/:id/friendrequest', async (request, reply) =>
{
	const { friendship_id } = request.body as { friendship_id: number};
	const { status } = request.body as { status: string };

	try
	{
		friendRepo.reviewFriendship(db, friendship_id, status);
		return reply.status(200).send({ message: 'Friendship status changed successfully'});
	}
	catch (err)
	{
		fastify.log.error(err);
		return reply.status(500).send({ message: err });
	}
})


/* -- LIST FRIENDS FOR ONE USER -- */
fastify.get('/:id/friends', async (request, reply) => 
{
	const { id } = request.params as any;

	try
	{
		const friends: userRepo.User [] = await friendRepo.listFriends(db, id);
		return reply.status(200).send(friends);
	}
	catch (err)
	{
		fastify.log.error(err);
		return reply.status(500).send({ message: 'Failed to list friends for userId:', id});
	}
})




//---------------------------------------
//--------------- SERVER ----------------
//---------------------------------------


fastify.get('/status', async (request, reply) => 
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