import Fastify from 'fastify'; // on importe la bibliothèque fastify
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const fastify = Fastify({ logger: true });

// ------------------------- INIT DATABASE
const db = await open({
  filename: process.env.DATABASE_URL || '/app/data/game.sqlite',
  driver: sqlite3.Database
});

// Creation of a games table
await db.run(`
  CREATE TABLE IF NOT EXIST games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player1_id INTEGER NOT NULL,
  player2_id INTEGER NOT NULL,
  score_player1 INTEGER DEFAULT 0,
  score_player2 INTEGER DEFAULT 0,
  winner_id INTEGER,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMSTAMP,
  finished_at DATETIME,
  )
`);
console.log('Table games created');

// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/status', async (request, reply) => {
  return { service: 'game', status: 'ready', port: 3003 };
});

// on demarre le serveur
const start = async () => {
  try {
    // on attend que le serveur demaarre avant de continuer sur port 8080
    await fastify.listen({ port: 3003, host: '0.0.0.0' });
    console.log('Auth service listening on port 3003');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();