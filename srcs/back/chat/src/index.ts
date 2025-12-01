import Fastify from 'fastify'; // on importe la bibliothèque fastify
import { initDatabase } from './database.js'
import { Database } from 'sqlite';
import { Server } from 'socket.io';
import fs from 'fs';
import * as messRepo from "./repositories/messages.js" 

// const httpsOptions = {
//     key: fs.readFileSync('/app/server.key'),
//     cert: fs.readFileSync('/app/server.crt')
// }

// Creation of Fastify server
const fastify = Fastify({ 
  logger: true, 
  // https: httpsOptions 
});

let db: Database;

async function main() 
{
  db = await initDatabase();
  console.log('chat database initialised');
}

// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/status', async () => 
{
  return { service: 'chat', status: 'ready', port: 3002 };
});

// on demarre le serveur
const start = async () => 
{
  try 
  {
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    // on attache socket.io au serveur http de fastify
    const io = new Server(fastify.server, 
    {
      cors: {
        origin: "*", // important -> autorise le front a se connecter
      }
    });

    // 3. gestion des évenements websockets
    // Chaque fois qu'un client se connecte à notre serveur, cela crée une instance de socket
    io.on('connection', async (socket) => 
    {
      // Lier la socket à un channel 
      // => si channel n'existait pas, creer la ligne dans CHANNELS
      // => ajouter le user_id dans CHANNEL_MEMBERS
      const channel = "channel_" + socket.id.toString();
      socket.join(channel);
      console.log('A user is connected to: ' + channel);

      let channelID = await messRepo.getChannelByName(db, channel);
      if (!channelID) {
        channelID = await messRepo.createChannel(db, channel);
      }
      const user_id = 2;
      const newMember = await messRepo.saveNewMemberinChannel(db, channelID, user_id);

      // quand le server recoit un message chat message de la part du front
      socket.on('chatMessage', async (data: messRepo.createMessage) => 
      {
        try 
        {
          data.channel = channel;
          const saveMessageID = await messRepo.saveNewMessageinDB(db, data, channelID);
          if (!saveMessageID) 
          {
            console.error('Error: message could not be saved');
            socket.emit('error', { message: "Failed to save message "});
            return ;
          }
          console.log(`Message saved with ID: ${saveMessageID}`);
          
          // on le renvoie a tout le monde y compris l'envoyeur: 
          // a changer si on veut envoyer qu'aux recv_id
          io.to(channel).emit('chatMessage', data.msg_content);
        } 
        catch (err: any) 
        {
          console.error("Critical error in chatMessage :", err);
          socket.emit('error', { message: "Internal server error" });
        }  
      });

      // envoi du wiiiiizz
      socket.on('sendWizz', (data: { author: string }) => 
      {
        console.log(`Wizz received from: ${data.author}`);
        
        // On renvoie l'événement à tous les AUTRES clients connectés.
        // Ils vont écouter 'receiveWizz' pour secouer leur fenêtre.
        socket.broadcast.emit('receivedWizz', { author: data.author });
      });


      //envoi de l'animation
      socket.on('sendAnimation', (data: { animationKey: string, author: string }) => 
      {
        console.log(`Animation received: ${data.animationKey} from: ${data.author}`);
        io.emit('receivedAnimation', data);
      });


      socket.on('disconnect', () => 
      {
        console.log('User disconnected');
      });

    });

    console.log('Live Chat listening on port 3002');

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