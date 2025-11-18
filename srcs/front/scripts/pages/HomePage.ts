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
        ":-)" : "smile.gif",
        ":)" : "smile.gif",
        ":-O" : "/assets/emoticons/surprised.gif",
        ":o" : "/assets/emoticons/surprised.gif",
        ";-)" : "/assets/emoticons/wink.gif",
        ";)" : "/assets/emoticons/wink.gif",
        ":-S" : "/assets/emoticons/confused.gif",
        ":s" : "/assets/emoticons/confused.gif",
        ":'(" : "/assets/emoticons/crying.gif",
        "(H)" : "/assets/emoticons/hot.gif",
        "(h)" : "/assets/emoticons/hot.gif",
        "(A)" : "/assets/emoticons/angel.gif",
        "(a)" : "/assets/emoticons/angel.gif",
        ":-#" : "/assets/emoticons/silence.gif",
        "8-|" : "/assets/emoticons/nerd.gif",
        ":-*" : "/assets/emoticons/secret.gif",
        ":^)" : "/assets/emoticons/unknown.gif",
        "<:o)" : "/assets/emoticons/party.gif",
        "|-)" : "/assets/emoticons/sleepy.gif",
        "(Y)" : "/assets/emoticons/thumbs_up.gif",
        "(y)" : "/assets/emoticons/thumbs_up.gif",
        "(B)" : "/assets/emoticons/beer.gif",
        "(b)" : "/assets/emoticons/beer.gif",
        "(X)" : "/assets/emoticons/girl.gif",
        "(x)" : "/assets/emoticons/girl.gif",
        "({)" : "/assets/emoticons/guy_hug.gif",
        ":-[" : "/assets/emoticons/bat.gif",
        ":[" : "/assets/emoticons/bat.gif",
        "(L)" : "/assets/emoticons/heart.gif",
        "(l)" : "/assets/emoticons/heart.gif",
        "(K)" : "/assets/emoticons/kiss.gif",
        "(k)" : "/assets/emoticons/kiss.gif",
        "(F)" : "/assets/emoticons/rose.gif",
        "(f)" : "/assets/emoticons/rose.gif",
        "(P)" : "/assets/emoticons/camera.gif",
        "(p)" : "/assets/emoticons/camera.gif",
        "(@)" : "/assets/emoticons/cat.gif",
        "(T)" : "/assets/emoticons/phone.gif",
        "(t)" : "/assets/emoticons/phone.gif",
        "(8)" : "/assets/emoticons/note.gif",
        "(*)" : "/assets/emoticons/star.gif",
        "(O)" : "/assets/emoticons/clock.gif",
        "(o)" : "/assets/emoticons/clock.gif",
        "(sn)" : "/assets/emoticons/snail.gif",
        "(pl)" : "/assets/emoticons/plate.gif",
        "(pi)" : "/assets/emoticons/pizza.gif",
        "(au)" : "/assets/emoticons/car.gif",
        "(um)" : "/assets/emoticons/umbrella.gif",
        "(co)" : "/assets/emoticons/computer.gif",
        "(st)" : "/assets/emoticons/storm.gif",
        "(mo)" : "/assets/emoticons/money.gif",
        ":-D" : "/assets/emoticons/teeth_smile.gif",
        ":D" : "/assets/emoticons/teeth_smile.gif",
        ":-P" : "/assets/emoticons/tongue_smile.gif",
        ":p" : "/assets/emoticons/tongue_smile.gif",
        ":-(" : "/assets/emoticons/sad.gif",
        ":(" : "/assets/emoticons/sad.gif",
        ":-|" : "/assets/emoticons/disappointed.gif",
        ":|" : "/assets/emoticons/disappointed.gif",
        ":-$" : "/assets/emoticons/embarrassed.gif",
        ":$" : "/assets/emoticons/embarrassaed.gif",
        ":-@" : "/assets/emoticons/angry.gif",
        ":@" : "/assets/emoticons/angry.gif",
        "(6)" : "/assets/emoticons/devil_smile.gif",
        "8o|" : "/assets/emoticons/teeth.gif",
        "^o)" : "/assets/emoticons/sarcastic.gif",
        "+o(" : "/assets/emoticons/sick.gif",
        "*-)" : "/assets/emoticons/thinking.gif",
        "8-)" : "/assets/emoticons/eye_roll.gif",
        "(C)" : "/assets/emoticons/coffee.gif",
        "(c)" : "/assets/emoticons/coffee.gif",
        "(N)" : "/assets/emoticons/thumbs_down.gif",
        "(n)" : "/assets/emoticons/thumbs_down.gif",
        "(D)" : "/assets/emoticons/martini.gif",
        "(d)" : "/assets/emoticons/martini.gif",
        "(Z)" : "/assets/emoticons/boy.gif",
        "(z)" : "/assets/emoticons/boy.gif",
        "(})" : "/assets/emoticons/guy_hug.gif",
        "(^)" : "/assets/emoticons/cake.gif",
        "(U)" : "/assets/emoticons/broken_heart.gif",
        "(u)" : "/assets/emoticons/broken_heart.gif",
        "(G)" : "/assets/emoticons/present.gif",
        "(g)" : "/assets/emoticons/present.gif",
        "(W)" : "/assets/emoticons/wilted_rose.gif",
        "(w)" : "/assets/emoticons/wilted_rose.gif",
        "(~)" : "/assets/emoticons/film.gif",
        "(&)" : "/assets/emoticons/dog.gif",
        "(I)" : "/assets/emoticons/lightbulb.gif",
        "(i)" : "/assets/emoticons/lightbulb.gif",
        "(S)" : "/assets/emoticons/moon.gif",
        "(E)" : "/assets/emoticons/email.gif",
        "(e)" : "/assets/emoticons/email.gif",
        "(M)" : "/assets/emoticons/messenger.gif",
        "(m)" : "/assets/emoticons/messenger.gif",
        "(bah)" : "/assets/emoticons/sheep.gif",
        "(||)" : "/assets/emoticons/bowl.gif",
        "(so)" : "/assets/emoticons/soccer.gif",
        "(ap)" : "/assets/emoticons/airplane.gif",
        "(ip)" : "/assets/emoticons/island.gif",
        "(mp)" : "/assets/emoticons/portable.gif",
        "(li)" : "/assets/emoticons/lightning.gif"
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