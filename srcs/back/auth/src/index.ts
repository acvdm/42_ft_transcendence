import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { initDatabase } from './database.js';
import { Database } from 'sqlite';
import * as credRepo from "./repositories/credentials.js";
import { validateNewEmail, validateRegisterInput, isValidPassword } from './validators/auth_validators.js';
import { loginUser, registerUser, registerGuest, changeEmailInCredential,changePasswordInCredential, refreshUser, logoutUser, verifyAndEnable2FA, finalizeLogin2FA, generateTwoFA, authenticatePassword, deleteAuthData } from './services/auth_service.js';
import { NotFoundError, UnauthorizedError, ValidationError, ForbiddenError, ServiceUnavailableError } from './utils/error.js';

//------------COOKIE
const cookieSecret = process.env.COOKIE_SECRET;
if (!cookieSecret){
	console.error("FATAL ERROR: COOKIE_SECRET is not defined in .env");
	process.exit(1);
}

const fastify = Fastify({ logger: true, });

/* register a cookie plugin with the env variable */
fastify.register(fastifyCookie, {
  secret: cookieSecret,
  parseOptions: {}
});

let db: Database;

async function main() 
{	
	db = await initDatabase();
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

		validateRegisterInput(body);

		const authResponse = await registerUser(db, body.userId, body.email, body.password);

		reply.setCookie('refreshToken', authResponse.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
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
		const authResponse = await registerGuest(db, body.userId, body.email);

		reply.setCookie('refreshToken', authResponse.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 7 * 24 * 3600,
			signed: true
		});

		console.log(`✅ Credentials created & auto-login for user ${body.userId}`);

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

		if (result.require2fa) {
			console.log(`🔐 2FA required for user`);
			return reply.status(200).send({
				success: true,
				require2fa: true,
				tempToken: result.tempToken
			});
		}

		if (!result.refreshToken || !result.accessToken || !result.userId) {
			throw new ServiceUnavailableError("Authentication failed");
		}

		// Cas ou Login reussi direct
		reply.setCookie('refreshToken', result.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
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

  const cookie = request.cookies.refreshToken;
  
  const result = request.unsignCookie(cookie || '');

  if (!result.valid || !result.value) {
	return reply.status(401).send({ error: "Invalid or missing refresh token"});
  }

  const refreshToken = result.value;

  try {
	const authResponse = await refreshUser(db, refreshToken);

	reply.setCookie('refreshToken', authResponse.refreshToken, {
	  path: '/',
	  httpOnly: true,
	  secure: true,
	  sameSite: 'lax',
	  maxAge: 7* 24 * 3600,
	  signed: true
	});

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
/* To delete the refresh token from the database and delete the cookie from the browser */

fastify.post('/logout', async (request, reply) => 
{
	const cookie = request.cookies.refreshToken;
	if (!cookie){
		return reply.status(200).send({message: 'Already logged out'});
	}

	const unsigned = request.unsignCookie(cookie);

	if (!unsigned.valid || !unsigned.value){
		reply.clearCookie('refreshToken', { path: '/'});
		return reply.status(200).send({ message: 'Logged out (Invalid token)'});
	}

	const refreshToken = unsigned.value;

	try 
	{
		await logoutUser(db, refreshToken);
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

	return reply.status(204).send({ success: true, message: "Logged out succefully"});
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

		await deleteAuthData(db, userId);

		return reply.status(200).send({
			success: true,
			error: null
		});

	}
	catch (err: any) 
	{
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
Route called when user clicks on “Enable 2FA”
- Generate a secret -> otpauth or crypto
- Updates user line in database two_fa_secret but & 2fa_enable remains false
- Generates code URL and converts to base64 image with qrcode library
- Returns base64 image to front end { qrCodeUrl, manualSecret }
*/

fastify.post('/2fa/secret', async (request, reply) => {
	
	try 
	{
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status(401).send({ error: "Unauthorized: Missing User ID" });

		const userId = parseInt(userIdHeader as string);

		const body = request.body as { type?: 'APP' | 'EMAIL' };
		const type = body.type || 'APP';

		const result = await generateTwoFA(db, userId, type);

		return reply.status(200).send({
			sucess: true,
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
			error: { message: err.message || "failed to generate 2FA"}
		});
	}
});

/*
Route called when the user scans the QR code and enters their first code
- verify validation
- set 2FA active
*/ 

fastify.post('/2fa', async (request, reply) => {
	
	try 
	{
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status(401).send({error: "Unauthorized"});

		const userId = parseInt(userIdHeader as string);

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


fastify.delete('/2fa', async (request, reply) => {
	
	try 
	{
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status(401).send({error: "Unauthorized"});

		const userId = parseInt(userIdHeader as string);

		await credRepo.set2FAMethod(db, userId, 'NONE');

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
Login process when 2FA is active:
- Receives tempToken and code.
- Verifies and validates.
- Retrieves secret from database and verifies TOTP code.
- Generates real tokens.
- Returns cookie and final JSON.
*/

fastify.post('/2fa/challenge', async (request, reply) => {
	
	try {
		const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader)
			return reply.status(401).send({error: "Unauthorized"});

		const userId = parseInt(userIdHeader as string);

		const body = request.body as { code: string };
		if (!body.code)
			return reply.status(400).send({ error: "Code required" });

		const result = await finalizeLogin2FA(db, userId, body.code);
		if (!result) 
		{
			return reply.status(401).send({
				success: false,
				error: { message: "Invalid 2FA code"}
			});
		}

		reply.setCookie('refreshToken', result.refreshToken, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
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


/* -- INTERNAL: Retrieve email for the User service  -- */
fastify.get('/users/:id/email', async (request, reply) => 
{
	const { id } = request.params as { id: string };
	const userId = Number(id);

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
		await fastify.listen({ port: 3001, host: '0.0.0.0' });
		console.log('Auth service listening on port 3001');
	} 
	catch (err) 
	{
		fastify.log.error(err);
		process.exit(1);
	}
};


main().then(start).catch(err => 
{
	console.error("Startup error:", err);
	process.exit(1);
});