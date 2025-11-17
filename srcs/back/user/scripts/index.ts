import Fastify from 'fastify'; // on importe la bibliothèque fastify
import sqlite3 from 'sqlite3';
import { initDatabase } from './database';
import { Database } from 'sqlite';

// Creation of Fastify server
const fastify = Fastify({ logger: true });

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
fastify.post('/', async (request, reply) => {
  const { username, email, avatar } = request.body as { 
    username: string; 
    email: string; 
    avatar?:string;
  };

  try {
    const result = await db.run(
      `INSERT INTO users (username, email, avatar) VALUES (?, ?, ?)`,
      [username, email, avatar || null]
    );
    return { id: result.lastID, username, email, avatar };
  } 
  catch (err: any) {
    reply.status(400);
    return { error: err.message };
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