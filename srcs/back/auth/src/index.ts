import Fastify from 'fastify'; // on importe la bibliothèque fastify
import fastifyCookie from '@fastify/cookie'; // pour JWT
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import { validateRegisterInput } from './validators/auth_validators.js';
import { loginUser, registerUser, refreshUser, logoutUser, verifyTwoFA } from './services/auth_service.js';
import * as credRepo from "./repositories/credentials.js";
import { generate2FASecret } from './utils/crypto.js';
import fs from 'fs';

/* IMPORTANT -> revoir la gestion du JWT en fonction du 2FA quand il sera active ou non (modifie la gestion du cookie?)*/

//------------COOKIE 
// on recupere le secret pour le cookie
// process = objet global de Node.js qui represente le programme en cours d'execution
const cookieSecret = process.env.COOKIE_SECRET;
if (!cookieSecret){
    console.error("FATAL ERROR: COOKIE_SECRET is not defined in .env");
    process.exit(1);
}

// Creation of Fastify server
const fastify = Fastify({ logger: true, });

// enregistrer un plugin cookie avec la variable d'env
fastify.register(fastifyCookie, {
  secret: cookieSecret,
  parseOptions: {} // options par defaut
});

let db: Database; // on stocke ici la connexion SQLite, globale au module

async function main() 
{	
	db = await initDatabase();
	console.log('auth database initialised');
}


//---------------------------------------
//----------- AUTHENTICATION ------------
//---------------------------------------

/* -- REGISTER - CREATE CREDENTIAL -- */
fastify.post('/users/:id/credentials', async (request, reply) => 
{
	try
	{
		const body = request.body as { user_id: number; email: string; password: string };

		// 1. Valider
		validateRegisterInput(body);

		// 2. Traiter (toute la logique est dans le service)
		const authResponse = await registerUser(db, body.user_id, body.email, body.password);

		// 3. Cookie
		reply.setCookie('refresh_token', authResponse.refresh_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 3600,
			signed: true
		});

		console.log(`✅ Credentials created & auto-login for user ${body.user_id}`);

		// 4. Répondre
		return reply.status(200).send({
			success: true,
			refresh_token: authResponse.refresh_token,
			access_token: authResponse.access_token,
			user_id: authResponse.user_id,
			error: null
		});
	} 
	catch (err: any) 
	{
		return reply.status(400).send({
			success: false, 
			data: null,
			error: { message: err.message }
		});
	}
});


/* -- LOGIN -- */ 
fastify.post('/sessions', async (request, reply) => 
{
	const body = request.body as { email: string, password: string };

	try 
	{
		const result = await loginUser(db, body.email, body.password);
		console.log("✅ route /sessions atteinte");	
		console.log(`result: `, result);

		reply.setCookie('refresh_token', result.refresh_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 3600,
			signed: true
		});

		return reply.status(200).send({
			success: true,
			data: result,
			error: null
		});	
	} catch (err: any)
	{
		return reply.status(400).send({ 
			success: false,
			data: null,
			error: { message: err.message }  
		});
	}
});

/* -- REFRESH THE ACCESS TOKEN -- */
fastify.post('/refresh', async (request, reply) => {
  
  // lire le cookie signe
  const cookie = request.cookies.refresh_token;
  // verification de la signature
  const result = request.unsignCookie(cookie || '');

  if (!result.valid || !result.value) {
    return reply.status(401).send({ error: "Invalid or missing refresh token"});
  }

  const refreshToken = result.value;

  try {
	// appeler le service pour verifier la DB et generer nouveaux tokens
    const authResponse = await refreshUser(db, refreshToken);

    reply.setCookie('refresh_token', authResponse.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7* 24 * 3600,
      signed: true
    });

    console.log("Refresh request valid for token:", refreshToken);

    return reply.send({
      access_token: authResponse.access_token,
      user_id: authResponse.user_id
    });
  } catch (err: any){
      reply.clearCookie('refresh_token');
      return reply.status(403).send({error: err.message});
  }
});


/* -- LOGOUT -- */
// pour supprimer le refresh token de la db et supprimer le cookie du navigateur
fastify.post('/logout', async (request, reply) => {
	
	console.log("✅ route /logout atteinte");	

	const cookie = request.cookies.refresh_token;
	if (!cookie){
		return reply.status(200).send({message: 'Already logged out'});
	}

	// on decode le cookie (car il etait signe)
	const unsigned = request.unsignCookie(cookie);

	// si signature invalide ou nulle on nettoie qd meme le cookie client par securite
	if (!unsigned.valid || !unsigned.value){
		reply.clearCookie('refresh_token', { path: '/'});
		return reply.status(200).send({ message: 'Logged out (Invalid token)'});
	}

	const refreshToken = unsigned.value;

	try {
		await logoutUser(db, refreshToken);
		console.log("✅ Refresh Token suppress from the database");
	} catch (err) {
		console.error("Error for the supression of Refresh Token in the database: ", err);
	}

	reply.clearCookie('refresh_token', {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict'
	});

	return reply.status(200).send({ success: true, message: "✅ Logged out succefully"});
})



//---------------------------------------
//---------------- 2FA ------------------
//---------------------------------------

/* 
/2fa/generate
route appellee quand utilisateur clique sur "Active le 2FA"
Besoin de generer un secret -> otpauth ou crypto
met a jour ligne de l'utilisateur en BDD
two_2fa_secret mais & 2fa_enable reste a false
generer url code et transforme en image base64 avec la lib qrcode
renvoie image en base64 au front
*/

fastify.post('/2fa/generate', async (request, reply) => {
	
	console.log("✅ route /2fa/generate atteinte");

	try {
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
		{
			//callback pour test
			// return reply.status(401).send({ error: "Unauthorized: Missing User ID" });
             // Pour test direct (A SUPPRIMER EN PROD) :
             const body = request.body as { user_id: number };
             const userId = body.user_id;

		}

		const userId = parseInt(userIdHeader as string);

		const result = await generate2FASecret(db, userId);

		console.log(`✅ 2FA generated for user ${userId}`);

		return reply.status(200).send({
			sucess: true,
			data: result, // contient { qrCodeUrl, manualSecret }
			error: null
		});
	} catch (err: any) {
		console.error("Error generating 2FA:", err);
		return reply.status(500).send({
			sucess: false,
			data: null,
			error: { message: err.message || "failed to generate 2FA" }
		});
	}
});

/*
/2fa/enable
route appellee quand l'utilisateur scanne le qr code et entre son premier code 
recevoir le code
recuperer le 2fa secret
verifier la validation
reponse 2fa active
*/ 

fastify.post('/2fa/enable', async (request, reply) => {
	
	try {
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status 
	}

});

/*
/2fa/disable
update la BDD
*/

/*
/2fa/verify
recoit temp_token et le code
verifie et valide
recupere le secret en BDD et verifie le code TOTP
genere lles vrais tokens
renvoit cookie et json final
*/



//---------------------------------------
//--------------- SERVER ----------------
//---------------------------------------

fastify.get('/health', async (request, reply) => 
{
	return { service: 'auth', status: 'ready', port: 3001 };
});

const start = async () => 
{
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