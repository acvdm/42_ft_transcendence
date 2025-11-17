import Fastify from 'fastify'; // on importe la bibliothèque fastify
import { initDatabase } from './database';
import { Database } from 'sqlite';

// Creation of Fastify server
const fastify = Fastify({ logger: true });

let db: Database; // on stocke ici la connexion SQLite, globale au module

async function main() {
  db = await initDatabase();
  console.log('auth database initialised');
}

// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
// on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/status', async (request, reply) => {
  return { service: 'auth', status: 'ready', port: 3001 };
});

// Register route
fastify.post('/register', async (request, reply) => {
  // On récupère le body de la requête HTTP POST
  const body = request.body as {
    alias: string;
    email: string;
    password: string;
  };

  const alias = body.alias;
  const email = body.email;
  const password = body.password;

  // 1. Hashage du mdp
  const pwd_hashed = 'test_pwd_hashed';

  // 2. Génération du secret 2FA
  const two_fa_secret = 'test2fa';

  // 3. Insertion dans la base
  try 
  {
    const result = await db.run(`
      INSERT INTO CREDENTIALS (email, pwd_hashed, two_fa_secret, is_2fa_enabled)
      VALUES (?, ?, ?, ?)`,
      [email, pwd_hashed, two_fa_secret, 1]
    );

    const credential_id = result.lastID; // propriété spéciale de SQLite

    // 4. Génération d'un refresh token
    const refresh_token = 'test_refresh_token';
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30);

    await db.run(`
      INSERT INTO TOKENS (credential_id, refresh_token, expires_at)
      VALUES (?, ?, ?)`,
      [credential_id, refresh_token, expires_at]
    );

    return reply.status(201).send({
      user_id: credential_id,
      email,
      two_fa_secret,
      refresh_token
    });

  } 
  catch (err: any) 
  {

  }
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


// On initialise la DB puis on démarre le serveur
main().then(start).catch(err => {
  console.error("Startup error:", err);
  process.exit(1);
});