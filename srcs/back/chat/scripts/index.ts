import Fastify from 'fastify';
import { initDatabase } from './database.js'
import { Database } from 'sqlite';
import { Server } from 'socket.io';
import fs from 'fs';


const httpsOptions = {
	key: fs.readFileSync('/app/server.key'),
	cert: fs.readFileSync('/app/server.crt')
}

const fastify = Fastify({ logger: true});

let db: Database;

async function main() {
  db = await initDatabase();
  console.log('chat database initialised');
}

fastify.get('/status', async () => {
  return { service: 'chat', status: 'ready', port: 3002 };
});

/* 
We attach socket.io to the Fastify HTTP server.
Allows the front to connect
Websocket event management
We send it back to everyone, including the sender.
*/

const start = async () => {
  try {
	await fastify.listen({ port: 3002, host: '0.0.0.0' });
	
	const io = new Server(fastify.server, {
	  cors: {
		origin: "*",
	}
	});

	io.on('connection', (socket) => {
	  console.log('A user is connected: ' + socket.id);

		socket.on('chatMessage', (data) => {
			console.log('Message received: ', data);
			io.emit('chatMessage', data);
		  });

		socket.on('sendWizz', (data: { author: string }) => {
			console.log(`Wizz received from: ${data.author}`);
			socket.broadcast.emit('receivedWizz', { author: data.author });
		  });

		socket.on('sendAnimation', (data: { animationKey: string, author: string }) => {
			console.log(`Animation received: ${data.animationKey} from: ${data.author}`);
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

/* We initialize the database and then start the server. */
main().then(start).catch(err => {
  console.error("Startup error:", err);
  process.exit(1);
});