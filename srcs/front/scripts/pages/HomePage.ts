import { parse } from "path";
import { io, Socket } from "socket.io-client";

// on va exportrter une fonction qui renvoie du html 
export function render(): string {
    return `
    <div class="relative w-full h-[calc(100vh-50px)] overflow-hidden bg-gradient-to-b from-white via-white to-[#7ED5F4]">

        <div class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat" 
             style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;">
        </div>

        <div class="absolute top-[20px] bottom-0 left-0 right-0 flex justify-center p-6 overflow-y-auto">

            <div class="flex flex-row min-w-[1000px] h-full gap-4">

                <div class="w-[1300px] h-full bg-gradient-to-b from-blue-50 to-blue-100 border border-gray-300 shadow-inner rounded-sm flex items-center justify-center min-w-[650px]">
                    <h1 class="text-lg font-semibold"> Pong 👾</h1>
                </div>

                <div class="flex flex-col gap-4 w-[600px] h-full">
                    
                    <div class="bg-white border border-gray-300 rounded-sm shadow-sm w-full p-4 flex flex-col">
                        <p class="font-semibold mb-2"> Game info</p>
                        <div class="relative w-[50px] h-[50px] mb-4">
                            <img class="absolute inset-0 w-full h-full object-cover" src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">
                            <img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px] object-cover" src="https://wlm.vercel.app/assets/usertiles/default.png">
                        </div>
                        <button id="play-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 focus:ring-1 focus:ring-blue-400">Play</button>
                    </div>

                    <div class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 overflow-hidden">
                        <h1 class="text-lg font-bold mb-2">Live chat </h1>
                        
                        <!-- ID ajouté pour le conteneur de messages -->
                        <div id="chat-messages" class="flex-1 overflow-y-auto border-t border-gray-200 pt-2 space-y-2 text-sm">
                            <!-- Les messages statiques sont retirés, ils viendront du JS -->
                        </div>
                        
                        <!-- ID ajouté pour l'input -->
                        <input type="text" id="chat-input" placeholder="Écrire un message..." class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}; 

export function afterRender(): void {

    const emoticons: { [key: string]: string } = {
        ":-)" : "/public/assets/emoticons/smile.gif",
        ":)" : "/public/assets/emoticons/smile.gif",
        ":-O" : "/public/assets/emoticons/surprised.gif",
        ":o" : "/public/assets/emoticons/surprised.gif",
        ";-)" : "/public/assets/emoticons/wink.gif",
        ";)" : "/public/assets/emoticons/wink.gif",
        ":-S" : "/public/assets/emoticons/confused.gif",
        ":s" : "/public/assets/emoticons/confused.gif",
        ":'(" : "/public/assets/emoticons/crying.gif",
        "(H)" : "/public/assets/emoticons/hot.gif",
        "(h)" : "/public/assets/emoticons/hot.gif",
        "(A)" : "/public/assets/emoticons/angel.gif",
        "(a)" : "/public/assets/emoticons/angel.gif",
        ":-#" : "/public/assets/emoticons/silence.gif",
        "8-|" : "/public/assets/emoticons/nerd.gif",
        ":-*" : "/public/assets/emoticons/secret.gif",
        ":^)" : "/public/assets/emoticons/unknown.gif",
        "<:o)" : "/public/assets/emoticons/party.gif",
        "|-)" : "/public/assets/emoticons/sleepy.gif",
        "(Y)" : "/public/assets/emoticons/thumbs_up.gif",
        "(y)" : "/public/assets/emoticons/thumbs_up.gif",
        "(B)" : "/public/assets/emoticons/beer.gif",
        "(b)" : "/public/assets/emoticons/beer.gif",
        "(X)" : "/public/assets/emoticons/girl.gif",
        "(x)" : "/public/assets/emoticons/girl.gif",
        "({)" : "/public/assets/emoticons/guy_hug.gif",
        ":-[" : "/public/assets/emoticons/bat.gif",
        ":[" : "/public/assets/emoticons/bat.gif",
        "(L)" : "/public/assets/emoticons/heart.gif",
        "(l)" : "/public/assets/emoticons/heart.gif",
        "(K)" : "/public/assets/emoticons/kiss.gif",
        "(k)" : "/public/assets/emoticons/kiss.gif",
        "(F)" : "/public/assets/emoticons/rose.gif",
        "(f)" : "/public/assets/emoticons/rose.gif",
        "(P)" : "/public/assets/emoticons/camera.gif",
        "(p)" : "/public/assets/emoticons/camera.gif",
        "(@)" : "/public/assets/emoticons/cat.gif",
        "(T)" : "/public/assets/emoticons/phone.gif",
        "(t)" : "/public/assets/emoticons/phone.gif",
        "(8)" : "/public/assets/emoticons/note.gif",
        "(*)" : "/public/assets/emoticons/star.gif",
        "(O)" : "/public/assets/emoticons/clock.gif",
        "(o)" : "/public/assets/emoticons/clock.gif",
        "(sn)" : "/public/assets/emoticons/snail.gif",
        "(pl)" : "/public/assets/emoticons/plate.gif",
        "(pi)" : "/public/assets/emoticons/pizza.gif",
        "(au)" : "/public/assets/emoticons/car.gif",
        "(um)" : "/public/assets/emoticons/umbrella.gif",
        "(co)" : "/public/assets/emoticons/computer.gif",
        "(st)" : "/public/assets/emoticons/storm.gif",
        "(mo)" : "/public/assets/emoticons/money.gif",
        ":-D" : "/public/assets/emoticons/teeth_smile.gif",
        ":D" : "/public/assets/emoticons/teeth_smile.gif",
        ":-P" : "/public/assets/emoticons/tongue_smile.gif",
        ":p" : "/public/assets/emoticons/tongue_smile.gif",
        ":-(" : "/public/assets/emoticons/sad.gif",
        ":(" : "/public/assets/emoticons/sad.gif",
        ":-|" : "/public/assets/emoticons/disappointed.gif",
        ":|" : "/public/assets/emoticons/disappointed.gif",
        ":-$" : "/public/assets/emoticons/embarrassed.gif",
        ":$" : "/public/assets/emoticons/embarrassaed.gif",
        ":-@" : "/public/assets/emoticons/angry.gif",
        ":@" : "/public/assets/emoticons/angry.gif",
        "(6)" : "/public/assets/emoticons/devil_smile.gif",
        "8o|" : "/public/assets/emoticons/teeth.gif",
        "^o)" : "/public/assets/emoticons/sarcastic.gif",
        "+o(" : "/public/assets/emoticons/sick.gif",
        "*-)" : "/public/assets/emoticons/thinking.gif",
        "8-)" : "/public/assets/emoticons/eye_roll.gif",
        "(C)" : "/public/assets/emoticons/coffee.gif",
        "(c)" : "/public/assets/emoticons/coffee.gif",
        "(N)" : "/public/assets/emoticons/thumbs_down.gif",
        "(n)" : "/public/assets/emoticons/thumbs_down.gif",
        "(D)" : "/public/assets/emoticons/martini.gif",
        "(d)" : "/public/assets/emoticons/martini.gif",
        "(Z)" : "/public/assets/emoticons/boy.gif",
        "(z)" : "/public/assets/emoticons/boy.gif",
        "(})" : "/public/assets/emoticons/guy_hug.gif",
        "(^)" : "/public/assets/emoticons/cake.gif",
        "(U)" : "/public/assets/emoticons/broken_heart.gif",
        "(u)" : "/public/assets/emoticons/broken_heart.gif",
        "(G)" : "/public/assets/emoticons/present.gif",
        "(g)" : "/public/assets/emoticons/present.gif",
        "(W)" : "/public/assets/emoticons/wilted_rose.gif",
        "(w)" : "/public/assets/emoticons/wilted_rose.gif",
        "(~)" : "/public/assets/emoticons/film.gif",
        "(&)" : "/public/assets/emoticons/dog.gif",
        "(I)" : "/public/assets/emoticons/lightbulb.gif",
        "(i)" : "/public/assets/emoticons/lightbulb.gif",
        "(S)" : "/public/assets/emoticons/moon.gif",
        "(E)" : "/public/assets/emoticons/email.gif",
        "(e)" : "/public/assets/emoticons/email.gif",
        "(M)" : "/public/assets/emoticons/messenger.gif",
        "(m)" : "/public/assets/emoticons/messenger.gif",
        "(bah)" : "/public/assets/emoticons/sheep.gif",
        "(||)" : "/public/assets/emoticons/bowl.gif",
        "(so)" : "/public/assets/emoticons/soccer.gif",
        "(ap)" : "/public/assets/emoticons/airplane.gif",
        "(ip)" : "/public/assets/emoticons/island.gif",
        "(mp)" : "/public/assets/emoticons/portable.gif",
        "(li)" : "/public/assets/emoticons/lightning.gif"
    }


    const socket = io("/", {
        path: "/socket.io/", // on met le chemin que nginx va intercepter 
    });

    const messagesContainer = document.getElementById('chat-messages');
    const messageInput = document.getElementById('chat-input') as HTMLInputElement;

    if (!messagesContainer || !messageInput) {
        console.log("Can't find chat elements");
        return;
    }

    // --- FONCTIONS POUR LE PARSING DES MESSAGES ---

    // pour éviter les inj3etions de code hgtml script
    const escapeHTML = (text: string): string => {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // utiliser les caracteres speciaux dans les regex (= ctrl+f)
    const escapeRegex = (string: string): string => {
        return (string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    }

    // on prend le texte et on le transforme en url de l'image
    const parseMessage = (message: string): string => {
        // on securise le texte avec escape html
        let formattedMessage = escapeHTML(message);

        // on parcours la map des emoticons pour remplacer par celui qu'on veut 
        // on trie les cles par longueur pour evciter les conflits
        const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);

        sortedKeys.forEach(key => {
            const imgUrl = emoticons[key];
            // on cree une recherche dynamique pour trouver l'emoticone
            const escapedKey = escapeRegex(key);
            const regex = new RegExp(escapedKey, "g");

            // on remplace par l'iamnge avec une classe tialwind pour aligner au texte
            formattedMessage = formattedMessage.replace(
                regex,
                `<img src="${imgUrl}" alt="${key}" class="inline-block w-[20px] h-[20px] align-middle mx-0.5" />`
            );
        });
        return formattedMessage;
    };


    // --- AFFICHAGE DES MESSAGES ---

    // pour afficher un message
    const addMessage = (message: string, author: string = "Admin") => { // pour le moment -> admin = fallback
        const msgElement = document.createElement('p');
        msgElement.className = "mb-1";

        const contentEmoticons = parseMessage(message);

        msgElement.innerHTML = `<strong>${author}:\n</strong> ${contentEmoticons}`;
        messagesContainer.appendChild(msgElement);
        // rajouter un scroll automatique vers le bas
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    /* mise en ecoute des événements socket */

    socket.on("connect", () => {
        addMessage("Connected to chat server!");
    });

    // on va écouter l'événement chatmessage venant du serveur
    socket.on("chatMessage", (data: any) => {
            // le backend va renvoyer data, on suppose que c'est le message pour le moment
            // il devrait plus renvoyer message: "" author: ""
        addMessage(data.message || data, data.author || "Anonyme");
    });

    socket.on("disconnected", () => {
        addMessage("Disconnected from chat server!");
    });

    /* Envoi des événements sockets */

    // a partir du moiment ou on appuie sur entree-> envoi de l'input
    messageInput.addEventListener('keyup', (event) => {
        if (event.key == 'Enter' && messageInput.value.trim() != '') {
            const message = messageInput.value;

            // on envois le message au serveur avec emit
            socket.emit("chatMessage", { message: message, author: "Faustoche"}); // a changer pour l'username du joueur
            messageInput.value = ''; // on vide l'input
        }
    });
}