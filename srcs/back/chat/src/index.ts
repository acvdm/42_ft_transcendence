import Fastify from 'fastify'; // on importe la bibliothèque fastify
import FastifyIO from 'fastify-socket.io'
import { initDatabase } from './database.js'
import { Database } from 'sqlite';
import { Server, Socket } from 'socket.io';
import * as messRepo from "./repositories/messages.js";
import * as chanRepo from "./repositories/channels.js"; 


// Creation of Fastify server
const fastify = Fastify({ logger: true });


// On enregistre le plugin socket io
fastify.register(FastifyIO, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

// on defini la logique quand le serveur est prêt
fastify.ready().then(() => {
	// acces a l'instance via fastify.io
	fastify.io.on('connection', (socket) => {
		console.log(`Client connected (Fastify):' ${socket.id}`);

		//on réceptionne un message
		socket.on('sendMessage', (payload) => {
			console.log('Message received:', payload);

			// on diffuse a tout le monde
			fastify.io.emit('messageReceived', {
				user: payload.user;
				content: payload.content;
				timestamp: new Date()
			});
		});

		socket.on('disconnect', () => {
			console.log(`Client disconnected: ${socket.id}`);
		});
	});
});



let db: Database;

async function main() 
{
	db = await initDatabase();
	console.log('chat database initialised');
}



async function joinChannel(
	socket: Socket,
	io: Server, 
	channelKey: string
) {
	try 
	{
		const isExistingChannel = await chanRepo.findChannelByKey(db, channelKey);
		if (!isExistingChannel?.id)
		{
			let channel = await chanRepo.createChannel(db, channelKey);
			// await chanRepo.addEventInChannel(db, channelKey, "join");
			socket.join(channelKey);
		}
		else
		{
			let channel = isExistingChannel;
			socket.join(channelKey);
			if (isExistingChannel?.id)
			{
				const msg_history = await messRepo.getHistoryByChannel(db, channel.id);
				io.to(channelKey).emit("msg_history", { channelKey, msg_history });
			}
		}
	}
	catch (err)
	{
		console.log("error catched: ", err);
	}
}



async function chatMessage(
	io: Server, 
	data: messRepo.Message
) {
	const channelKey = data.channel_key;
	const sender_id = data.sender_id;
	const sender_alias = data.sender_alias;
	const msg_content = data.msg_content;

	try 
	{
		const saveMessageID = await messRepo.saveNewMessageinDB(db, channelKey, sender_id, sender_alias, msg_content);
		if (!saveMessageID) 
		{
			console.error('Error: message could not be saved');
			io.emit('error', { message: "Failed to save message "});
			return ;
		}
		io.emit('chatMessage', { channelKey, msg_content, sender_alias });
	} 
	catch (err: any) 
	{
		console.error("Critical error in chatMessage :", err);
		io.to(channelKey).emit('error', { message: "Internal server error" });
	}  	
}





// on demarre le serveur
const start = async () => 
{
	let channel;

	try 
	{
		await fastify.listen({ port: 3002, host: '0.0.0.0' });
		const io = new Server(fastify.server, 
		{
			cors: {
				origin: "*", // important -> autorise le front a se connecter
			},
			// Options pour le proxy nginx
			path: '/socket.io/',
			transports: ['websocket', 'polling']
		});	

		// gestion des évenements websockets
		io.on('connection', async (socket) => 
		{		
			socket.on("joinChannel", async (channelKey) => { await joinChannel(socket, io, channelKey) });
			
			socket.on('chatMessage', async (data) => { await chatMessage(io, data) });	

			socket.on('sendWizz', async (data) => { io.to(data.channelKey).emit('receivedWizz', { author: data.author }); });

			socket.on('sendAnimation', async (data) => {io.to(data.channel_key).emit('receivedAnimation', { animationKey: data.animationKey, author: data.author }); });

			socket.on('disconnect', () => { console.log('User disconnected') });	
		});	
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