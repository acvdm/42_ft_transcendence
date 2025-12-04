import Fastify from 'fastify'; // on importe la bibliothèque fastify
import { initDatabase } from './database.js'
import { Database } from 'sqlite';
import { Server } from 'socket.io';
import * as messRepo from "./repositories/messages.js" 


// Creation of Fastify server
const fastify = Fastify({ logger: true });

let db: Database;

async function main() 
{
	db = await initDatabase();
	console.log('chat database initialised');
}


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
			},
			// Options pour le proxy nginx
			path: '/socket.io/',
			transports: ['websocket', 'polling']
		});	
		// 3. gestion des évenements websockets
		// Chaque fois qu'un client se connecte à notre serveur, cela crée une instance de socket
		io.on('connection', async (socket) => 
		{	
			// Récupérer le dm_key du front : dm_key = sort(userId1, userId2)
			// Si le channel n'existe pas le créer dans la table, s'il existe charger les messages précédent
			const channel = "channel_" + socket.id.toString();
			socket.join(channel);
			console.log('A user is connected to: ' + channel);	
			// A changer
			let channelID = await messRepo.getChannelByName(db, channel);
			if (!channelID) {
				channelID = await messRepo.createChannel(db, channel);
			}	
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
					console.log(`Message saved with ID: ${saveMessageID}, channel: ${channelID}`);			
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


//---------------------------------------
//--------------- SERVER ----------------
//---------------------------------------

// on défini une route = un chemin URL + ce qu'on fait quand qqun y accède
//on commence par repondre aux requetes http get
// async = fonction qui s'execute quand on accede a cette route -> request = info de la requete, reply = objet pour envouer reponse
fastify.get('/health', async () => 
{
	return { service: 'chat', status: 'ready', port: 3002 };
})


// On initialise la DB puis on démarre le serveur
main().then(start).catch(err => 
{
	console.error("Startup error:", err);
	process.exit(1);
})