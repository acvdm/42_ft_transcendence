import Fastify from 'fastify'; // on importe la bibliothèque fastify
import fastifyCookie from '@fastify/cookie'; // pour JWT
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import * as credRepo from "./repositories/credentials.js";
import { validateNewEmail, validateRegisterInput, isValidPassword } from './validators/auth_validators.js';
import { loginUser, registerUser, registerGuest, changeEmailInCredential,changePasswordInCredential, refreshUser, logoutUser, verifyAndEnable2FA, finalizeLogin2FA, generateTwoFA, authenticatePassword, deleteAuthData } from './services/auth_service.js';
import { NotFoundError, UnauthorizedError, ValidationError, ForbiddenError } from './utils/error.js';


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
// probablement a modifier si changement vers https
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
		const body = request.body as { userId: number; email: string; password: string };

		// 1. Valider
		validateRegisterInput(body);

		// 2. Traiter (toute la logique est dans le service)
		const authResponse = await registerUser(db, body.userId, body.email, body.password);

		// 3. Cookie
		reply.setCookie('refreshToken', authResponse.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 3600,
			signed: true
		});

		console.log(`✅ Credentials created & auto-login for user ${body.userId}`);

		// 4. Répondre
		return reply.status(201).send({
			success: true,
			refreshToken: authResponse.refreshToken,
			accessToken: authResponse.accessToken,
			userId: authResponse.userId,
			error: null
		});
	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;
		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message }
		});
	}
});

fastify.post('/users/:id/credentials/guest', async (request, reply) => 
{
	try
	{
		const body = request.body as { userId: number; email: string};

		// 2. Traiter (toute la logique est dans le service)
		const authResponse = await registerGuest(db, body.userId, body.email);

		// 3. Cookie
		reply.setCookie('refreshToken', authResponse.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 3600,
			signed: true
		});

		console.log(`✅ Credentials created & auto-login for user ${body.userId}`);

		// 4. Répondre
		return reply.status(200).send({
			success: true,
			refreshToken: authResponse.refreshToken,
			accessToken: authResponse.accessToken,
			userId: authResponse.userId,
			error: null
		});
	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message }
		});
	}
});

fastify.patch('/users/:id/credentials/email', async (request, reply) => 
{
	try 
	{
		const { id } = request.params as { id: string };
		const body = request.body as { email: string };
		const userId = Number(id);

		validateNewEmail(body);

		const result = await changeEmailInCredential(db, userId, body.email);

		// 3. Répondre
		return reply.status(200).send({
			success: true,
			data: result,
			error: null
		});
	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;
		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: {  message: (err as Error).message}
		});
	}
});

fastify.patch('/users/:id/credentials/password', async (request, reply) => 
{
	console.log("arrivée dans /users/:id/credentials/password");
	try 
	{
		const { id } = request.params as { id: string };
		const userId = Number(id);
		const body = request.body as { 
			oldPass: string;
			newPass: string;
			confirmPass: string
		};

		const credential = await credRepo.getCredentialbyUserID(db, userId);
		if (!credential)
			throw new NotFoundError('Cannot find credential_id with userId');
		const credentialId = credential?.id;

		const isOldPwdValid = await authenticatePassword(db, credentialId, body.oldPass);
		if (! isOldPwdValid)
			throw new UnauthorizedError('loginPage.error_invalid_pwd');

		const isvalidNewPass = await isValidPassword(body.newPass);
		if (!isvalidNewPass)
			throw new ValidationError('Password must contain at least 8 characters, one lowercase, one uppercase, one digit and one special character');		
		if (body.newPass !== body.confirmPass)
			throw new ValidationError('Passwords do not match');

        await changePasswordInCredential(db, credentialId, body.newPass);
        return reply.status(200).send({
            success: true,
			data: null,
            message: "Password updated successfully"
        });
    }
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
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
		if (!body.password)
			throw new ValidationError('Password is required');
		const result = await loginUser(db, body.email, body.password);
		console.log("✅ route /sessions atteinte");	
		console.log(`result: `, result);

		if (result.require2fa) {
			console.log(`🔐 2FA required for user`);
			return reply.status(200).send({
				success: true,
				require2fa: true,
				tempToken: result.tempToken // LE FRONT DOIT STOCKER CA
			});
		}

		if (!result.refreshToken || !result.accessToken || !result.userId) {
			throw new Error("Authentication failed");
		}

		// Cas ou Login reussi direct
		reply.setCookie('refreshToken', result.refreshToken, {
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
	} 
	catch (err: any)
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message }
		});
	}
});


/* -- REFRESH THE ACCESS TOKEN -- */

fastify.post('/token', async (request, reply) => {
  
  // lire le cookie signe

  console.log(" /token route called");
  console.log(" Coockies received:",request.cookies);

  const cookie = request.cookies.refreshToken;

  console.log("refresToken cookie: ", cookie ? "exists" : "missing");
  
  // verification de la signature
  const result = request.unsignCookie(cookie || '');
  console.log("Cookieunsign result:", { valid: result.valid, hasValue: !!result.value });

  if (!result.valid || !result.value) {
    return reply.status(401).send({ error: "Invalid or missing refresh token"});
  }

  const refreshToken = result.value;

  try {
	// appeler le service pour verifier la DB et generer nouveaux tokens
    const authResponse = await refreshUser(db, refreshToken);

    reply.setCookie('refreshToken', authResponse.refreshToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7* 24 * 3600,
      signed: true
    });

    console.log("Refresh request valid for token:", refreshToken);

    return reply.send({
      accessToken: authResponse.accessToken,
      userId: authResponse.userId
    });
  } catch (err: any){
		console.error("❌ Refresh error:", err);
		reply.clearCookie('refreshToken');
		return reply.status(403).send({error: err.message});
  }
});


/* -- LOGOUT -- */
// pour supprimer le refresh token de la db et supprimer le cookie du navigateur
fastify.post('/logout', async (request, reply) => 
{
	
	console.log("✅ route /logout atteinte");	

	const cookie = request.cookies.refreshToken;
	if (!cookie){
		return reply.status(200).send({message: 'Already logged out'});
	}

	// on decode le cookie (car il etait signe)
	const unsigned = request.unsignCookie(cookie);

	// si signature invalide ou nulle on nettoie qd meme le cookie client par securite
	if (!unsigned.valid || !unsigned.value){
		reply.clearCookie('refreshToken', { path: '/'});
		return reply.status(200).send({ message: 'Logged out (Invalid token)'});
	}

	const refreshToken = unsigned.value;

	try 
	{
		await logoutUser(db, refreshToken);
		console.log("✅ Refresh Token suppress from the database");
	} 
	catch (err) 
	{
		console.error("Error for the supression of Refresh Token in the database: ", err);
	}

	reply.clearCookie('refreshToken', {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict'
	});

	return reply.status(204).send({ success: true, message: "✅ Logged out succefully"});
})


/* -- DELETE -- */
fastify.delete('/users/:id/', async (request, reply) => {
	try
	{
		const { id } = request.params as { id: string };
		const userId = Number(id);
		if (!userId) {
			return reply.status(400).send({ error: "Invalid User ID" });
		}

		// service qui supprime Tokens + Credentials
		await deleteAuthData(db, userId);

		console.log(`✅ User correctly deleted for user ${userId}`);

		return reply.status(200).send({
			success: true,
			error: null
		});

	}
	catch (err: any) 
	{
		console.error("Deleted Auth Error:", err);
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message || "Failed to delete auth data"}
		});
	}
});

/* -- EXPORT -- */
fastify.get('/users/:id/export', async (request, reply) => {
	try
	{
		const { id } = request.params as { id: string };
		const userId = Number(id);
		if (!userId) {
			return reply.status(400).send({ error: "Invalid User ID" });
		}

		const authData = await credRepo.getAuthDataForExport(db, userId);

		console.log(`✅ Data in auth service correctly export for user ${userId}`);

		return reply.status(200).send({
			success: true,
			data: authData || null,
			error: null
		});
	}
	catch (err: any) 
	{
		console.error("Export Auth Error:", err);
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message || "Failed to export auth data"}
		});
	}
})


//---------------------------------------
//---------------- 2FA ------------------
//---------------------------------------

/* 
/2fa/generate --> MODIFIE EN /2fa/secret
route appellee quand utilisateur clique sur "Active le 2FA"
Besoin de generer un secret -> otpauth ou crypto
met a jour ligne de l'utilisateur en BDD two_fa_secret mais & 2fa_enable reste a false
generer url code et transforme en image base64 avec la lib qrcode
renvoie image en base64 au front
*/

fastify.post('/2fa/secret', async (request, reply) => {
	
	console.log("✅ route /2fa/secret atteinte");

	try 
	{
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status(401).send({ error: "Unauthorized: Missing User ID" });

		const userId = parseInt(userIdHeader as string);

		const body = request.body as { type?: 'APP' | 'EMAIL' };
		const type = body.type || 'APP';

		const result = await generateTwoFA(db, userId, type);

		console.log(`✅ 2FA generated for user ${userId}`);

		return reply.status(200).send({
			sucess: true,
			data: result, // contient { qrCodeUrl, manualSecret } ou message pour l email
			error: null
		});
	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message || "failed to generate 2FA"}
		});
	}
});

/*
/2fa/ MODIFICATION NOM ROUTE
route appellee quand l'utilisateur scanne le qr code et entre son premier code 
recevoir le code
recuperer le 2fa secret
verifier la validation
reponse 2fa active
*/ 

fastify.post('/2fa', async (request, reply) => {
	
	try 
	{
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status(401).send({error: "Unauthorized"});

		const userId = parseInt(userIdHeader as string);

		// recuperation du code a 6 chiffres envoye par l'utilisateur
		const body = request.body as { code: string, type?: 'APP' | 'EMAIL' };
		if (!body.code)
			return reply.status(400).send({ error: "Code required"});

		const type = body.type || 'APP';

		const isSuccess = await verifyAndEnable2FA(db, userId, body.code, type);
		if (!isSuccess)
		{
			return reply.status(400).send({
				success: false,
				error: { message: "Invalid 2FA Code. Please try again."}
			});
		}

		console.log(`✅ 2FA is now ENABLED for user ${userId}`);
		
		return reply.status(200).send({
			success: true,
			data: {message: "2FA enabled successfully" },
			error: null
		});
	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message || "failed to generate 2FA"}
		});
	}

});

/*
/2fa/disable -> modifier en /2fa avec methode delete pour respecter API rest
update la BDD
*/

fastify.delete('/2fa', async (request, reply) => {
	
	try 
	{
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status(401).send({error: "Unauthorized"});

		const userId = parseInt(userIdHeader as string);

		await credRepo.set2FAMethod(db, userId, 'NONE');

		console.log(`✅ 2FA disabled for user ${userId}`);

		return reply.status(200).send({
			success: true,
			data: { message: "2FA disabled successfully"},
			error: null
		});
	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message || "failed to generate 2FA"}
		});
	}
});

/*
/2fa/verify --> MODIFIE EN /2fa/challenge
recoit tempToken et le code
verifie et valide
recupere le secret en BDD et verifie le code TOTP
genere lles vrais tokens
renvoit cookie et json final
*/

fastify.post('/2fa/challenge', async (request, reply) => {
	
	try {
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status(401).send({error: "Unauthorized"});

		const userId = parseInt(userIdHeader as string);

		// recuperation du code
		const body = request.body as { code: string };
		if (!body.code)
			return reply.status(400).send({ error: "Code required" });

		// appel du service
		const result = await finalizeLogin2FA(db, userId, body.code);
		if (!result) 
		{
			return reply.status(401).send({
				success: false,
				error: { message: "Invalid 2FA code"}
			});
		}

		console.log(`✅ 2FA Login successful for user ${userId}`);

		// on renvoie les vrai acces (cookie + JSON)
		reply.setCookie('refreshToken', result.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 3600,
			signed: true
		});

		return reply.status(200).send({
			success: true,
			accessToken: result.accessToken,
			userId: result.userId	
		});

	} 
	catch (err: any) 
	{
		const statusCode = err.statusCode || 500;

		return reply.status(statusCode).send({
			success: false, 
			data: null,
			error: { message: err.message || "failed to generate 2FA"}
		});
	}
});



// faustine
/* -- INTERNE : Récupérer email pour le service User -- */
fastify.get('/users/:id/email', async (request, reply) => 
{
    const { id } = request.params as { id: string };
    const userId = Number(id);

    // On utilise la fonction qui existe déjà dans ton credRepo
    const credential = await credRepo.getCredentialbyUserID(db, userId);
    
    if (!credential) {
        return reply.status(404).send({ error: "User credentials not found" });
    }

    return { email: credential.email };
});



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