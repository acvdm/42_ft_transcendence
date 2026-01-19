import Fastify, { FastifyRequest, FastifyReply, FastifyError} from 'fastify';
import fastifyProxy from '@fastify/http-proxy';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './utils/error.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET){
	console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
	process.exit(1);
}

const fastify = Fastify({ logger: true });

fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
	if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEOUT' || error.statusCode === 504) {
		request.log.error(`Upstream service unavailable: ${error.message}`);
		return reply.status(503).send({
			error: "Service Unavailable",
			message: "Le service demandé est momentanément indisponible.",
			statusCode: 503
		});
	}
});

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


fastify.register(fastifyProxy, 
{
	upstream: 'http://auth:3001',
	prefix: '/api/auth',
	rewritePrefix: '',
	http: {
		requestOptions: {
			timeout: 5000
		}
	}
});

fastify.register(fastifyProxy, 
{
	upstream: 'http://chat:3002',
	prefix: '/socket-chat',
	websocket: true,
	rewritePrefix: '/socket.io',
	http: {
		requestOptions: {
			timeout: 5000
		}
	}
});


fastify.register(fastifyProxy, {
	upstream: 'http://game:3003',
	prefix: '/socket-game',
	websocket: true,
	rewritePrefix: '/socket.io',
	http: {
		requestOptions: {
			timeout: 5000
		}
	}
});

fastify.register(fastifyProxy, 
{
	upstream: 'http://game:3003',
	prefix: '/api/game',
	rewritePrefix: '/games',
	http: {
		requestOptions: {
			timeout: 5000
		}
	}
});

fastify.register(fastifyProxy, 
{
	upstream: 'http://user:3004',
	prefix: '/api/user',
	rewritePrefix: '/users',
	http: {
		requestOptions: {
			timeout: 5000
		}
	}
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