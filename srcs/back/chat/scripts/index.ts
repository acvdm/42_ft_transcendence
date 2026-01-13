import Fastify from 'fastify'; // on importe la bibliothèque fastify
import { initDatabase } from './database.js'
import { Database } from 'sqlite';
import { Server } from 'socket.io';
import fs from 'fs';

const httpsOptions = {
    key: fs.readFileSync('/app/server.key'),
    cert: fs.readFileSync('/app/server.crt')
}

// Creation of Fastify server
const fastify = Fastify({ logger: true});

let db: Database;

async function main() {
  db = await initDatabase();
  console.log('chat database initialised');
}

// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/status', async () => {
  return { service: 'chat', status: 'ready', port: 3002 };
});

// on demarre le serveur
const start = async () => {
  try {
    // on attend que le serveur demaarre avant de continuer sur port 8080
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    // on attache socket.io au serveur http de fastify
    const io = new Server(fastify.server, {
      cors: {
        origin: "*", // important -> autorise le front a se connecter
      }
    });

    // 3. gestion des évenements websockets
    io.on('connection', (socket) => {
      console.log('A user is connected: ' + socket.id);

      // quand le server recoit un message chat message de la part du front
      socket.on('chatMessage', (data) => {
        console.log('Message received: ', data);

        // on le renvoie a tout le monde uy compris l'envoyeyr
        io.emit('chatMessage', data);
      });

      // envoi du wiiiiizz
      socket.on('sendWizz', (data: { author: string }) => {
        console.log(`Wizz received from: ${data.author}`);
        
        // On renvoie l'événement à tous les AUTRES clients connectés.
        // Ils vont écouter 'receiveWizz' pour secouer leur fenêtre.
        socket.broadcast.emit('receivedWizz', { author: data.author });
      });


      //envoi de l'animation
      socket.on('sendAnimation', (data: { animationKey: string, author: string }) => {
        console.log(`Animation received: ${data.animationKey} from: ${data.author}`);
        
        // On renvoie l'événement à tous les AUTRES clients connectés.
        // Ils vont écouter 'receiveWizz' pour secouer leur fenêtre.
        io.emit('receivedAnimation', data);
      });


      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });

    console.log('Live Chat listening on port 3002');
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