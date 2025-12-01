import Fastify from 'fastify'; // on importe la bibliothèque fastify
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import { validateRegisterInput } from './validators/auth_validators.js';
import { loginUser, registerUser } from './services/auth_service.js';
import fs from 'fs';


// const httpsOptions = {
//     key: fs.readFileSync('/app/server.key'),
//     cert: fs.readFileSync('/app/server.crt')
// }

// Creation of Fastify server
const fastify = Fastify({ 
  logger: true,
  // https: httpsOptions
 });

let db: Database; // on stocke ici la connexion SQLite, globale au module

async function main() {
  // console.log('Current UID:', process.getuid());
  // console.log('Current GID: ', process.getgid());
  db = await initDatabase();
  console.log('auth database initialised');
}


//------------ROUTES 

// route status
fastify.get('/status', async (request, reply) => {
  return { service: 'auth', status: 'ready', port: 3001 };
});

// route register
fastify.post('/register', async (request, reply) => {
  try 
  {
    // On récupère le body de la requête HTTP POST
    const body = request.body as { user_id: number; email: string; password: string };

    // 1. Valider
    validateRegisterInput(body);

    // 2. Traiter (toute la logique est dans le service)
    const result = await registerUser(db, body.user_id, body.email, body.password);

    // 3. Répondre
    return reply.status(201).send(result);
  } 
  catch (err: any) 
  {
    console.error("❌ ERREUR AUTH REGISTER:", err);
    return reply.status(400).send({ 
      error: 'Authentication failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

fastify.post('/login', async (request, reply) => {
  const body = request.body as { email: string, password: string };
  
  try {
    const authResponse = await loginUser(db, body.email, body.password);
    return reply.status(201).send(authResponse);

  } catch (err: any)
  {
    console.error("❌ ERREUR AUTH LOGIN:", err);
     return reply.status(400).send({ error: err.message });
  }
});

// on demarre le serveur
const start = async () => {
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