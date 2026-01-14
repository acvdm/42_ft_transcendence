import Fastify from 'fastify';
import fastifyProxy from '@fastify/http-proxy';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './utils/error.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET){
	console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
	process.exit(1);
}

const fastify = Fastify({ logger: true });

// SECURITE
// code qui s'execute avant chaque requete
// verifie si premiere authentification -> laisser passer dans auth
// verifie l'authenticite du JWT -> si ok laisse passer dans laisse passer dans microservices
// et modifie le header transmis (ne passe pas le JWT aux micro services qui ne le connaisse pas) mais l'id du user

fastify.addHook('onRequest', async (request, reply) => {
	const url = request.url;
	const method = request.method;

	console.log(`Incoming request: ${url}`);

	// on laisse passer tout ce qui conserne l'auth (login, register, refresh)
	const publicRoutes = [
		"/api/users/login",
		"/api/users/token",
		"/api/auth/token",
		"/api/user/guest",
		"/api/auth/login",
		"/api/auth/sessions",
		"/api/auth/logout",
		"/socket-chat",
		"/socket-game"
	]

	let isPublic = publicRoutes.some(route => request.url.startsWith(route));
	
	const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;

	if (cleanUrl === '/api/user' && method === 'POST'){
		isPublic = true;
	}

	if (isPublic){
		console.log(`Public route allowed: ${method} ${url}`);
		return;
	}
	// verification de l'acces token
	try {
		const authHeader = request.headers['authorization'];
		if (!authHeader) {
			throw new UnauthorizedError('No token provided');
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, JWT_SECRET!) as unknown as { 
			sub: number, 
			cred_id: number;
			scope?: string 
		};

		// si cest un token 2fa on verifie ou il veut aller
		if (decoded.scope == '2fa_login'){
			// on autorise seulement la route de verification du 2FA
			if (!url.includes('/2fa/challenge'))
				throw new UnauthorizedError("2FA verification pending");
			console.log(`2FA Token user for verification endpoint -> Allowed`);
		}

		// request.user = decoded;

		// injection d'identite -> le gateway valide lid et previent les microservices
		request.headers['x-user-id'] = decoded.sub.toString();

		console.log(`User ${decoded.sub} authorized for ${url}`);
	} catch (err) {
		request.log.warn(`Auth failed: ${err}`);
		return reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired token"});
	}
})


// 1. On va redirigé vers les bons services quand nécéssaire

fastify.register(fastifyProxy, 
{
	upstream: 'http://auth:3001', // adresse interne du réseau du docker
	prefix: '/api/auth', // toutes les requetes api/auth iront au service auth
	rewritePrefix: '' // on retire le prefixe avant de l'envoyer un service
});

fastify.register(fastifyProxy, 
{
	upstream: 'http://chat:3002', // adresse interne du réseau du docker
	prefix: '/socket-chat', // toutes les requetes api/chat iront au service chat
	websocket: true,
	rewritePrefix: '/socket.io' // on retire le prefixe avant de l'envoyer un service
});

fastify.register(fastifyProxy, {
	upstream: 'http://game:3003',
	prefix: '/socket-game',
	websocket: true,
	rewritePrefix: '/socket.io'
});

fastify.register(fastifyProxy, 
{
	upstream: 'http://game:3003', // adresse interne du réseau du docker
	prefix: '/api/game', // toutes les requetes api/game iront au service game
	rewritePrefix: '/games' // on retire le prefixe avant de l'envoyer un service
});

fastify.register(fastifyProxy, 
{
	upstream: 'http://user:3004', // adresse interne du réseau du docker
	prefix: '/api/user', // toutes les requetes api/user iront au service user
	rewritePrefix: '/users' // on retire le prefixe avant de l'envoyer un service
});

// route de test
fastify.get('/health', async () => ({ service: 'gateway', status:'ready' }));

const start = async () => 
{
	try {
		await fastify.listen({ port: 8080, host: '0.0.0.0' });
		fastify.log.info('Gateway service listening on port 8080');
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();