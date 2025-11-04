import Fastify from 'fastify';
import fastifyProxy from '@fastify/http-proxy';

const fastify = Fastify({ logger: true });

// 1. On va redirigé vers les bons services quand nécéssaire

fastify.register(fastifyProxy, {
	upstream: 'http://auth:3001', // adresse interne du réseau du docker
	prefix: '/api/auth', // toutes les requetes api/auth iront au service auth
	rewritePrefix: '' // on retire le prefixe avant de l'envoyer un service
});

fastify.register(fastifyProxy, {
	upstream: 'http://chat:3002', // adresse interne du réseau du docker
	prefix: '/api/chat', // toutes les requetes api/chat iront au service chat
	rewritePrefix: '' // on retire le prefixe avant de l'envoyer un service
});

fastify.register(fastifyProxy, {
	upstream: 'http://game:3003', // adresse interne du réseau du docker
	prefix: '/api/game', // toutes les requetes api/game iront au service game
	rewritePrefix: '' // on retire le prefixe avant de l'envoyer un service
});

fastify.register(fastifyProxy, {
	upstream: 'http://user:3004', // adresse interne du réseau du docker
	prefix: '/api/user', // toutes les requetes api/user iront au service user
	rewritePrefix: '' // on retire le prefixe avant de l'envoyer un service
});

// route de test
fastify.get('/status', async () => ({ service: 'gateway', status:'ready' }));

const start = async () => {
	try {
		await fastify.listen({ port: 8080, host: '0.0.0.0' });
		fastify.log.info('Gateway service listening on port 8080');
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();