import Fastify from 'fastify'; // on importe la bibliothèque fastify
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Creation of Fastify server
const fastify = Fastify({ logger: true });

// ------------------------- INIT DATABASE
const db = await open({
  filename: process.env.DATABASE_URL || '/app/data/auth.sqlite',
  driver: sqlite3.Database
});

//Creation of a table "sessions/ tokens" if inexistent
// Le user_id est une référence à la table user de la user.sqlite
// token pour JWT ou session token
await db.run(`
  CREATE TABLE IF NOT EXIST auth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_ad DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('sessions table ready');


// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/status', async (request, reply) => {
  return { service: 'auth', status: 'ready', port: 3001 };
});

// on demarre le serveur
const start = async () => {
  try {
    // on attend que le serveur demaarre avant de continuer sur port 8080
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Auth service listening on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();