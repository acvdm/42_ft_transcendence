import { Socket, Server } from 'socket.io';

const privateWaitingRooms = new Map<string, string>(); // faustine

// --- STRUCTURES JEU REMOTE ---
interface GameState {
    roomId: string;
    player1Id: string;
    player2Id: string;
    ball: { x: number, y: number, vx: number, vy: number, radius: number };
    paddle1: { y: number, height: number, width: number, x: number };
    paddle2: { y: number, height: number, width: number, x: number };
    score: { player1: number, player2: number };
    canvasWidth: number;
    canvasHeight: number;
    intervalId?: NodeJS.Timeout;
    startAt: number;
    serveDirection: number; // 1 pour droite -1 pour gauche
}

let waitingQueue: string[] = []; // ID des sockets en attente
const activeGames = new Map<string, GameState>();
const GAMESPEED = 1000 / 60; // 60 FPS

export function initGameState(roomId: string, p1: string, p2: string): GameState {
    console.log("initRemotGameState");
    return {
        roomId,
        player1Id: p1,
        player2Id: p2,
        canvasWidth: 800, // Taille de référence serveur
        canvasHeight: 600,
        ball: { x: 400, y: 300, vx: 5, vy: 5, radius: 10 },
        paddle1: { x: 30, y: 250, width: 10, height: 100 },
        paddle2: { x: 760, y: 250, width: 10, height: 100 },
        score: { player1: 0, player2: 0 },
        startAt: Date.now() + 3500,
        serveDirection: 1
    };
}

function resetBall(game: GameState) {
    game.ball.x = game.canvasWidth / 2;
    game.ball.y = game.canvasHeight / 2;
    game.serveDirection *= -1;
    // Vitesse aléatoire mais constante
    const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6);
    const speed = 7;
    const direction = Math.random() > 0.5 ? 1 : -1;
    game.ball.vx = game.serveDirection * speed * Math.cos(angle);
    game.ball.vy = speed * Math.sin(angle);
}

function stopGame(roomId: string, io: Server) {
    console.log("stop game");
    const game = activeGames.get(roomId);
    if (game) {
        if (game.intervalId) clearInterval(game.intervalId);

        let winnerRole = null;
        if (game.score.player1 > game.score.player2) winnerRole = 'player1';
        if (game.score.player2 > game.score.player1) winnerRole = 'player2';
        io.to(roomId).emit('gameEnded', { finalScore: game.score, winner: winnerRole });
        
        
        activeGames.delete(roomId);
        console.log(`Game ${roomId} stopped and cleaned`);
    }
}
export function updateGamePhysics(game: GameState, io: Server) {
    // Gestion du délai de démarrage (countdown)
    if (game.startAt && Date.now() < game.startAt) {
        io.to(game.roomId).emit('gameState', {
            ball: game.ball,
            paddle1: game.paddle1,
            paddle2: game.paddle2,
            score: game.score,
            waiting: true // Petit indicateur optionnel
        });

        return ;
    }


    // 1. On sauvegarde la position AVANT mouvement pour la comparaison
    const prevX = game.ball.x;
    const prevY = game.ball.y;

    // 2. On calcule la FUTURE position sans modifier l'objet tout de suite
    let nextX = prevX + game.ball.vx;
    let nextY = prevY + game.ball.vy;

    // Collision murs (Haut/Bas)
    if (nextY - game.ball.radius < 0 || nextY + game.ball.radius > game.canvasHeight) {
        game.ball.vy = -game.ball.vy;
        nextY = prevY + game.ball.vy; // On recalcule nextY avec la nouvelle direction
    }

    // Collision Raquettes
    // P1 (Gauche)
    if (game.ball.vx < 0) { 
        // La balle va vers la gauche. On regarde si elle traverse la face DROITE de la raquette.
        // Condition: Elle était à droite (prevX) ET elle finit à gauche (nextX)
        const paddleRightEdge = game.paddle1.x + game.paddle1.width;

        if (prevX - game.ball.radius >= paddleRightEdge && 
            nextX - game.ball.radius <= paddleRightEdge) {
            
            // Vérification verticale (Y)
            if (game.ball.y + game.ball.radius >= game.paddle1.y && 
                game.ball.y - game.ball.radius <= game.paddle1.y + game.paddle1.height) {
                
                game.ball.vx = -game.ball.vx * 1.05;
                // On replace la balle juste devant la raquette pour éviter qu'elle reste coincée
                nextX = paddleRightEdge + game.ball.radius;
            }
        }
    }

    // P2 (Droite)
    if (game.ball.vx > 0) { 
        // La balle va vers la droite. On regarde si elle traverse la face GAUCHE de la raquette.
        const paddleLeftEdge = game.paddle2.x;

        if (prevX + game.ball.radius <= paddleLeftEdge && 
            nextX + game.ball.radius >= paddleLeftEdge) {
            
            if (game.ball.y + game.ball.radius >= game.paddle2.y && 
                game.ball.y - game.ball.radius <= game.paddle2.y + game.paddle2.height) {
                
                game.ball.vx = -game.ball.vx * 1.05;
                nextX = paddleLeftEdge - game.ball.radius;
            }
        }
    }

    // 3. Mise à jour effective de la balle
    game.ball.x = nextX;
    game.ball.y = nextY;

    // Score
    if (game.ball.x < 0) {
        game.score.player2++;
        resetBall(game);
    } else if (game.ball.x > game.canvasWidth) {
        game.score.player1++;
        resetBall(game);
    }

    // Fin de partie
    if (game.score.player1 >= 4 || game.score.player2 >= 4) {
        stopGame(game.roomId, io);
    }

    // Envoi de l'état
    io.to(game.roomId).emit('gameState', {
        ball: game.ball,
        paddle1: game.paddle1,
        paddle2: game.paddle2,
        score: game.score
    });
}


export function registerRemoteGameEvents(io: Server, socket: Socket, userSockets: Map<number, string>) {
    console.debug("registerRemoteGameEvent")

    socket.on('registerGameSocket', () => {
        console.log(`[SERVER] Register game socket pour user ${socket.user.sub} -> ${socket.id}`);
        userSockets.set(socket.user.sub, socket.id);
    })
    // 1. Gestion des Invitations
    socket.on('sendGameInvite', (data: { targetId: string, senderName: string }) => {
        console.debug(`[SERVER] sendGameInvite reçue de ${socket.id}. Cible: ${data.targetId}`);
        const targetIdNum = Number(data.targetId);

        console.debug(`[SERVER] UserSockets Map keys:`, [...userSockets.keys()]);
        console.log(`🔍 [SERVER] Recherche socket pour User ID: ${targetIdNum} (Type: ${typeof targetIdNum})`);
        
        const targetSocketId = userSockets.get(targetIdNum);
        
        if (targetSocketId) {
            console.log(`✅ [SERVER] Envoi à socket ID: ${targetSocketId} pour User ${targetIdNum}`); // <--- REGARDE CET ID
            io.to(targetSocketId).emit('receiveGameInvite', {
                senderId: socket.user.sub,
                senderName: data.senderName
            });
        } else {
        console.error(`❌ [SERVER] Cible introuvable dans userSockets.`);
    }
    });

    socket.on('acceptGameInvite', (data: { senderId: string }) => {
        console.log("accept game invite");
        waitingQueue = waitingQueue.filter(id => id !== socket.id); // nettoyage pour eviter race condition
        const senderIdNum = Number(data.senderId);
        const senderSocketId = userSockets.get(senderIdNum);
        const acceptorSocketId = socket.id;

        if (senderSocketId) {
            const senderSocket = io.sockets.sockets.get(senderSocketId);
            
            if (senderSocket) {
                const roomId = `game_invite_${Date.now()}_${senderIdNum}_${socket.user.sub}`;
                const gameState = initGameState(roomId, senderSocketId, acceptorSocketId);
                activeGames.set(roomId, gameState);

                senderSocket.join(roomId);
                socket.join(roomId);

                setTimeout(() => {
                    senderSocket.emit('matchFound', { roomId, role: 'player1', opponent: socket.user.sub });
                    socket.emit('matchFound', { roomId, role: 'player2', opponent: senderIdNum });

                    console.log(`Friend match started: ${roomId}`);
                    gameState.intervalId = setInterval(() => {
                        updateGamePhysics(gameState, io);
                    }, GAMESPEED);
                }, 100);
            }
        }
    });

    socket.on('declineGameInvite', (data: { senderId: string }) => {
        const senderSocketId = userSockets.get(Number(data.senderId));
        if (senderSocketId) {
            io.to(senderSocketId).emit('gameInviteDeclined', {});
        }
    });

    // 2. Gestion de la Queue (Matchmaking)
    socket.on('joinQueue', () => {
        if (waitingQueue.includes(socket.id)) return;

        //netoayge si on rejoint la auque on quitte les salles privees en attente
        for (const [roomId, socketId] of privateWaitingRooms.entries()) {
            if (socketId === socket.id) {
                privateWaitingRooms.delete(roomId);
            }
        }
        console.log(`Player ${socket.id} joined Queue`);
        waitingQueue.push(socket.id);

        if (waitingQueue.length >= 2) {
            const p1 = waitingQueue.shift()!;
            const p2 = waitingQueue.shift()!;
            const roomId = `game_${Date.now()}_${p1}_${p2}`;

            const gameState = initGameState(roomId, p1, p2);
            activeGames.set(roomId, gameState);

            const sock1 = io.sockets.sockets.get(p1);
            const sock2 = io.sockets.sockets.get(p2);

            if (sock1 && sock2 && sock1 != sock2) {
                sock1.join(roomId);
                sock2.join(roomId);

                const p1UserId = (sock1 as any).user?.sub || (sock1 as any).decoded?.sub; 
                const p2UserId = (sock2 as any).user?.sub || (sock2 as any).decoded?.sub;

                sock1.emit('matchFound', { roomId, role: 'player1', opponent: p2UserId });
                sock2.emit('matchFound', { roomId, role: 'player2', opponent: p1UserId });

                console.log(`Match started: ${roomId}`);
                gameState.intervalId = setInterval(() => {
                    updateGamePhysics(gameState, io);
                }, GAMESPEED);
            }
        }
    });

    socket.on('leaveQueue', () => {
        waitingQueue = waitingQueue.filter(id => id !== socket.id);
    });

    // 3. Gestion des Inputs (Raquettes)
    socket.on('gameInput', (data: { roomId: string, up: boolean, down: boolean }) => {
        const game = activeGames.get(data.roomId);
        if (!game) return;

        const speed = 10;
        let paddle = null;
        if (socket.id === game.player1Id) paddle = game.paddle1;
        else if (socket.id === game.player2Id) paddle = game.paddle2;

        if (paddle) {
            if (data.up) paddle.y -= speed;
            if (data.down) paddle.y += speed;
            if (paddle.y < 0) paddle.y = 0;
            if (paddle.y + paddle.height > game.canvasHeight) paddle.y = game.canvasHeight - paddle.height;
        }
    });

    socket.on('leaveGame', (data: { roomId: string }) => {
        const game = activeGames.get(data.roomId);

        // Vérifier que le socket fait bien partie du jeu
        if (game && (game.player1Id === socket.id || game.player2Id === socket.id)) {
            console.log(`Player ${socket.id} left the game explicitly`);

            // Identifier l'adversaire (celui qui est resté)
            const opponentSocketId = (game.player1Id === socket.id) ? game.player2Id : game.player1Id;

            // Prévenir l'adversaire IMMÉDIATEMENT qu'il a gagné par forfait
            io.to(opponentSocketId).emit('opponentLeft', { 
                roomId: data.roomId, 
                leaver: socket.id 
            });

            // Arrêter la partie proprement (clearInterval et suppression de la map)
            // Note : stopGame émet aussi 'gameEnded', mais ton front gère cela en coupant les écouteurs
            // dès réception de 'opponentLeft', donc pas de conflit.
            stopGame(data.roomId, io);
        }
    });

    //faustine
    socket.on('joinPrivateGame', (data: { roomId: string, skin?: string }) => {
        const { roomId } = data;
        const mySocketId = socket.id;

        // nettoyage
        waitingQueue = waitingQueue.filter(id => id !== mySocketId);
        console.log(`Player ${mySocketId} joining private room ${roomId}`);

        // est-ce que mon ami est deja en train de m'attendre
        if (privateWaitingRooms.has(roomId)) {
            const opponentSocketId = privateWaitingRooms.get(roomId);

            // il ne faut pas que ca soit moi (cas potentiel de double clic)
            if (opponentSocketId && opponentSocketId !== mySocketId) {
                // lancement du match et nettoyage de la waitroom
                privateWaitingRooms.delete(roomId);

                // creation de k;udee de la partie
                const gameId = `private_${Date.now()}_${roomId}`;
                const gameState = initGameState(gameId, opponentSocketId, mySocketId);
                activeGames.set(gameId, gameState);

                const sock1 = io.sockets.sockets.get(opponentSocketId);
                const sock2 = io.sockets.sockets.get(mySocketId);

                // on verifie que les deux sont tjrs connectes
                if (sock1 && sock2) {
                    sock1.join(gameId);
                    sock2.join(gameId);

                    const p1UserId = (sock1 as any).user?.sub;
                    const p2UserId = (sock2 as any).user?.sub;

                    // lancement du jeu pour les deux 
                    sock1.emit('matchFound', { roomId: gameId, role: 'player1', opponent: p2UserId });
                    sock2.emit('matchFound', { roomId: gameId, role: 'player2', opponent: p1UserId });

                    console.log(`Private Match started: ${gameId}`);
                    gameState.intervalId = setInterval(() => {
                        updateGamePhysics(gameState, io);
                    }, GAMESPEED);
                } else {
                    if (!sock1) console.log("Opponent socket not found for private game");
                    if (!sock2) console.log("My socket not found (weird)");
                }
            }
        } else {
            // sinon je dois attendre
            privateWaitingRooms.set(roomId, mySocketId);
            console.log(`Player ${mySocketId} is waiting in private room ${roomId}`);
        }
    });
    
    // 4. Gestion de la Déconnexion (Nettoyage Jeu)
    // Note: On ne gère pas le userSockets.delete ici car il est souvent géré dans le index.ts principal
    // Mais on gère le nettoyage des parties actives et de la queue
    socket.on('disconnect', () => {
        // Retirer de la queue
        waitingQueue = waitingQueue.filter(id => id !== socket.id);
        
        // on nettoie la private room
        for (const [roomId, socketId] of privateWaitingRooms.entries()) {
            if (socketId === socket.id) {
                privateWaitingRooms.delete(roomId);
                console.log(`Removed private room ${roomId} because waiting player disconnected`);
            }
        }

        // Arrêter les parties en cours
        for (const [roomId, game] of activeGames.entries()) {
            if (game.player1Id === socket.id || game.player2Id === socket.id) {
                stopGame(roomId, io);
            }
        }
    });
}