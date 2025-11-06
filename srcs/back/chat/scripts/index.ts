import Fastify from 'fastify'; // on importe la bibliothèque fastify
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Creation of Fastify server
const fastify = Fastify({ logger: true });

// ------------------------- INIT DATABASE
const db = await open({
  filename: process.env.DATABASE_URL || '/app/data/chat.sqlite',
  driver: sqlite3.Database
});

// Creation of a messages table
await db.run(`
  CREATE TABLE IF NOT EXIST messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  room TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMSTAMP
  )
`);
console.log('Table messages created');

// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/status', async (request, reply) => {
  return { service: 'chat', status: 'ready', port: 3002 };
});

// on demarre le serveur
const start = async () => {
  try {
    // on attend que le serveur demaarre avant de continuer sur port 8080
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('Auth service listening on port 3002');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();