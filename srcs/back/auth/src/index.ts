import Fastify from 'fastify'; // on importe la bibliothèque fastify
import fastifyCookie from '@fastify/cookie'; // pour JWT
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import { validateRegisterInput } from './validators/auth_validators.js';
import { loginUser, registerUser, refreshUser } from './services/auth_service.js';
import fs from 'fs';

/* IMPORTANT -> revoir la gestion du JWT en fonction du 2FA quand il sera active ou non (mnodifie la gestion du cookie)*/

//------------COOKIE 
// on recupere le secret pour le cookie (avec une valeur en dur si ca rate en local)
// process = objet global de Node.js qui represente le programme en cours d'execution
const cookieSecret = process.env.COOKIE_SECRET;
if (!cookieSecret){
    console.error("FATAL ERROR: COOKIE_SECRET is not defined in .env");
    process.exit(1);
}

const httpsOptions = {
    key: fs.readFileSync('/app/server.key'),
    cert: fs.readFileSync('/app/server.crt')
}

// Creation of Fastify server
const fastify = Fastify({ 
  logger: true,
  https: httpsOptions
 });

// enregistrer un plugin cookie avec cette variable
fastify.register(fastifyCookie, {
  secret: cookieSecret,
  parseOptions: {} // options par defaut
});

let db: Database; // on stocke ici la connexion SQLite, globale au module

async function main() {
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
  try {
    // On récupère le body de la requête HTTP POST
    const body = request.body as { user_id: number; email: string; password: string };
    // console.log("Body reçu:", request.body);

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

    // on met le refresh token dans le cookie, pas dans le body
    // et on prepare l'en-tete HTTP qui sera attache a la reponse finale
    // le navigateur lira cette en tete et enregistrera le cookie
    reply.setCookie('refresh_token', authResponse.refresh_token, { // refresh_token dans la fonction loginUser
      path: '/',
      httpOnly: true, // invisible au JS (protection XSS)
      secure: true, //acces au cookie uniquement via https
      sameSite: 'strict', // protection CSRF (cookie envoye que si la requete part de notre site)
      maxAge: 7 * 24 * 3600, // 7 jours en secondes
      signed: true // signe avec cookie secret
    });

    // envoi de l'access token dans le json et pas dans l'authResponse
    return reply.status(200).send({
      access_token:authResponse.access_token,
      user_id: authResponse.user_id
    });

  } catch (err: any) {
    console.error("❌ ERREUR AUTH LOGIN:", err);
     return reply.status(400).send({ error: err.message });
  }
});

fastify.post('/refresh', async (request, reply) => {
  
  // lire le cookie signe
  const cookie = request.cookies.refresh_token;
  const result = request.unsignCookie(cookie || '');
  if (!result.valid || !result.value) {
    return reply.status(401).send({ error: "Invalid or missing refresh token"});
  }

  const refreshToken = result.value;

  try {
    const authResponse = await refreshUser(db, refreshToken);

    reply.setCookie('refresh_token', authResponse.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7* 24 * 3600,
      signed: true
    });

    return reply.send({
      access_token: authResponse.access_token,
      user_id: authResponse.user_id
    });
  } catch (err: any){
      reply.clearCookie('refres_token');
      return reply.status(403).send({error: err.message});
  }


  //TODO appeler fonction de service pour verifier la DB???
  const newTokens = await refreshUser(db, refreshToken);

  console.log("Refresh request valid for token:", refreshToken);
  return reply.send({ message: "Refresh logic to be connected to DB" });
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