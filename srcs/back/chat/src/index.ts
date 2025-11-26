import Fastify from 'fastify'; // on importe la bibliothèque fastify
import { initDatabase } from './database.js'
import { Database } from 'sqlite';
import { Server } from 'socket.io';
import fs from 'fs';
import * as messRepo from "./repositories/messages.js" 

const httpsOptions = {
    key: fs.readFileSync('/app/server.key'),
    cert: fs.readFileSync('/app/server.crt')
}

// Creation of Fastify server
const fastify = Fastify({ 
  logger: true, 
  https: httpsOptions 
});

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
    // on attend que le serveur demarre avant de continuer sur port 8080
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    // on attache socket.io au serveur http de fastify
    const io = new Server(fastify.server, {
      cors: {
        origin: "*", // important -> autorise le front a se connecter
      }
    });

    // Besoin d'un middleware d'authentification qui vérifie la validite du token et retrouver le user
    // io.use: exécute ce code pour chaque nouvelle tentative de connexion
    // io.use((socket, next) => {
    //   const token = socket.handshake.auth.token; // ici on regarde si le front a envoyé un token

    //   if (!token) {
    //     return next(new Error('Authentication required'));
    //   }

    //   try {
    //     const user = jwt.verify(token, process.env.JWT_SECRET) as any;
    //     socket.data.user = {
    //       id: user.id,
    //       alias: user.alias
    //     };
    //     next();

    //   } catch (err) {
    //     next (new Error('Invalid token'));
    //   }
    // });

    // 3. gestion des évenements websockets
    // Chaque fois qu'un client se connecte à notre serveur, cela crée une instance de socket
    io.on('connection', (socket) => {
      console.log('A user is connected: ' + socket.id);

      // quand le server recoit un message chat message de la part du front
       socket.on('chatMessage', async (data: messRepo.createMessage) => {
        try {
          console.log("Data recue du front: ", data);
          
            const messageData: messRepo.createMessage = {
              sender_id:  (socket.data.id || data.sender_id) ?? 5,
              recv_id: data.recv_id ?? 6,
              msg_content: data.msg_content ?? "bla"
            }
            
            console.log(`Dans index.ts Message de ${messageData.sender_id}, pour ${messageData.recv_id}: ${messageData.msg_content}`);

            const saveMessageID = await messRepo.saveMessageinDB(db, messageData);
            if (!saveMessageID) {
              console.error('Error: message could not be saved');
              socket.emit('error', { message: "Failed to save message "});
              return ;
            }

            console.log(`Message saved with ID: ${saveMessageID}`);
          
          // on le renvoie a tout le monde y compris l'envoyeur: a changer si on veut envoyer qu'aux recv_id
          io.emit('chatMessage', {
            saveMessageID,
            messageData,
            timestamp: new Date()
          });

        } catch (err: any) {
          console.error("Critical error in chatMessage :", err);
          socket.emit('error', { message: "Internal server error" });
        }  
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