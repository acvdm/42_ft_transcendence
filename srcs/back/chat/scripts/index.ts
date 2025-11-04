import Fastify from 'fastify'; // on importe la bibliothèque fastify

const fastify = Fastify({
  logger: true
});

// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/status', async (request, reply) => {
  return { service: 'chat', status: 'ready', port: 3002 };
});

// on demarre le serveur
const start = async () => {
  try {
    // on attend que le serveur demaarre avant de continuer sur port 8080
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('Auth service listening on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();