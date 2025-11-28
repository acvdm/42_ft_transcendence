import Fastify from 'fastify'; // rôle de serveur HTTP
import sqlite3 from 'sqlite3';
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import axios from 'axios'; // envoyer des requêtes HTTP à un autre serveur (service auth)
import https from 'https';
import { createUserInDB } from './repositories/users.js';
import fs from 'fs';

const httpsOptions = {
    key: fs.readFileSync('/app/server.key'),
    cert: fs.readFileSync('/app/server.crt')
}

// Creation of Fastify server
const fastify = Fastify({ logger: true, https: httpsOptions });

let db: Database;

async function main() {
  db = await initDatabase();
  console.log('user database initialised');
}

// ------------------------- ROUTES
fastify.get('/status', async (request, reply) => {
  return { service: 'user', status: 'ready', port: 3004 };
});

// Insert a new user
fastify.post('/register', async (request, reply) => {
  
  const body = request.body as { 
      alias: string;
      email: string;
      password: string; 
      avatar?:string;
      status: string
    };

  let user_id = null; 

  try {
    // 1. Créer le user localement dans user.sqlite
    user_id = await createUserInDB(db, body)

    if (!user_id)
      return reply.status(500).send('Error during profile creation');
    console.log('User created locally (ID: ${user_id}. Calling auth...');

    // 2. On crée un agent qui accepte les certificats auto-signés
        const agent = new https.Agent({ rejectUnauthorized: false });

    // 3. Appeler le service auth pour créer les credentials
    const authResponse = await axios.post(
      'https://auth:3001/register', 
      { user_id: user_id, email: body.email, password: body.password },
    { httpsAgent: agent}
  );

  
    // 4. Renvoyer la réponse du service auth (Tokens) au front. Le user est inscrit et connecté
    console.log('User successfully added to Database!');
    return reply.status(201).send(authResponse.data);

  } catch (err: any) {
    console.error("Error during registration: ", err);

    let errorMessage = 'Undefined error';
    // let statusCode = 400;

    // Cas 1: Erreur venant d'Axios (le service auth a répondu une erreur)
    if (axios.isAxiosError(err) && err.response?.data) {
      const authError = err.response.data;
      errorMessage = authError.message || authError.error || errorMessage;
      console.error("Auth service error: ", authError);
    } 
    // Cas 2: Erreur locale 
    else if (err instanceof Error) {
      errorMessage = err.message;
    }

    console.error("Final error message: ", errorMessage);

    // ROLLBACK
    if (user_id) {
      console.log(`Rollback: delele orphan ID ${user_id}`);
      await db.run(`DELETE FROM USERS WHERE id = ?`, [user_id]);
      console.log('User ID ${user_id} successfully deleted');
    }
    console.log(errorMessage);
    reply.status(400).send({ errorMessage });
  }
});


// List every users
fastify.get('/user', async () => {
  const rows = await db.all(`SELECT * FROM users`);
  return rows;
});

// Find a user by id
fastify.get('/:id', async (request, reply) => {
  const { id } = request.params as any;

  const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);    
  if (!user) {
    reply.status(404);
    return { error: 'User not found' };
  } 
  return user;
});

//---------------------------------------
//---- MISE À JOUR DES INFOS DU USER ----
//---------------------------------------

fastify.patch('/:id/status', async (request, reply) => {
  const { id } = request.params as { id: number };
  const { status } = request.body as { status: string };

  try {
    await db.run('UPDATE USERS SET status = ? WHERE id = ?', [status, id]);
    return reply.status(200).send({ message: 'Status updated successfully' });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ message: 'Failed to update status' });
  }
});


// ------------------------- START SERVER
const start = async () => {
  try {
    // on attend que le serveur demaarre avant de continuer sur port 8080
    await fastify.listen({ port: 3004, host: '0.0.0.0' });
    console.log('Auth service listening on port 3004');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// On initialise la DB puis on démarre le serveur
main().then(start).catch(err => {
  console.error("Startup error:", err);
  process.exit(1);
});