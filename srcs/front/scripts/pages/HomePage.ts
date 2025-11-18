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

    let globalPath = "/assets/emoticons/";

    const emoticons: { [key: string]: string } = {
        ":-)" : globalPath + "smile.gif",
        ":)" : globalPath + "smile.gif",
        ":-O" : globalPath + "surprised.gif",
        ":o" : globalPath + "surprised.gif",
        ";-)" : globalPath + "wink.gif",
        ";)" : globalPath + "wink.gif",
        ":-S" : globalPath + "confused.gif",
        ":s" : globalPath + "confused.gif",
        ":'(" : globalPath + "crying.gif", // NE MARCHE PAS
        "(H)" : globalPath + "hot.gif",
        "(h)" : globalPath + "hot.gif",
        "(A)" : globalPath + "angel.gif",
        "(a)" : globalPath + "angel.gif",
        ":-#" : globalPath + "silence.gif",
        "8-|" : globalPath + "nerd.gif",
        ":-*" : globalPath + "secret.gif",
        ":^)" : globalPath + "unknown.gif", // NE MARCHE PAS
        "<:o)" : globalPath + "party.gif", // NE MARCHE PAS -> affiche choqué
        "|-)" : globalPath + "sleepy.gif",
        "(Y)" : globalPath + "thumbs_up.gif",
        "(y)" : globalPath + "thumbs_up.gif",
        "(B)" : globalPath + "beer.gif", // NE MARCHE PAS
        "(b)" : globalPath + "beer.gif", // NE MARCHE PAS
        "(X)" : globalPath + "girl.gif",
        "(x)" : globalPath + "girl.gif",
        "({)" : globalPath + "guy_hug.gif",
        ":-[" : globalPath + "bat.gif",
        ":[" : globalPath + "bat.gif",
        "(L)" : globalPath + "heart.gif",
        "(l)" : globalPath + "heart.gif",
        "(K)" : globalPath + "kiss.gif",
        "(k)" : globalPath + "kiss.gif",
        "(F)" : globalPath + "rose.gif",
        "(f)" : globalPath + "rose.gif",
        "(P)" : globalPath + "camera.gif",
        "(p)" : globalPath + "camera.gif",
        "(@)" : globalPath + "cat.gif",
        "(T)" : globalPath + "phone.gif",
        "(t)" : globalPath + "phone.gif",
        "(8)" : globalPath + "note.gif",
        "(*)" : globalPath + "star.gif",
        "(O)" : globalPath + "clock.gif",
        "(o)" : globalPath + "clock.gif",
        "(sn)" : globalPath + "snail.gif",
        "(pl)" : globalPath + "plate.gif",
        "(pi)" : globalPath + "pizza.gif",
        "(au)" : globalPath + "car.gif",
        "(um)" : globalPath + "umbrella.gif",
        "(co)" : globalPath + "computer.gif",
        "(st)" : globalPath + "storm.gif",
        "(mo)" : globalPath + "money.gif",
        ":-D" : globalPath + "teeth_smile.gif",
        ":D" : globalPath + "teeth_smile.gif",
        ":-P" : globalPath + "tongue_smile.gif",
        ":p" : globalPath + "tongue_smile.gif",
        ":-(" : globalPath + "sad.gif",
        ":(" : globalPath + "sad.gif",
        ":-|" : globalPath + "disappointed.gif",
        ":|" : globalPath + "disappointed.gif",
        ":-$" : globalPath + "embarrassed.gif",
        ":$" : globalPath + "embarrassed.gif", 
        ":-@" : globalPath + "angry.gif",
        ":@" : globalPath + "angry.gif",
        "(6)" : globalPath + "devil_smile.gif",
        "8o|" : globalPath + "teeth.gif",
        "^o)" : globalPath + "sarcastic.gif",
        "+o(" : globalPath + "sick.gif",
        "*-)" : globalPath + "thinking.gif",
        "8-)" : globalPath + "eye_roll.gif",
        "(C)" : globalPath + "coffee.gif",
        "(c)" : globalPath + "coffee.gif",
        "(N)" : globalPath + "thumbs_down.gif",
        "(n)" : globalPath + "thumbs_down.gif",
        "(D)" : globalPath + "martini.gif",
        "(d)" : globalPath + "martini.gif",
        "(Z)" : globalPath + "boy.gif", // NE MARCHE PAS
        "(z)" : globalPath + "boy.gif", // NE MARCHE PAS
        "(})" : globalPath + "guy_hug.gif",
        "(^)" : globalPath + "cake.gif",
        "(U)" : globalPath + "broken_heart.gif",
        "(u)" : globalPath + "broken_heart.gif",
        "(G)" : globalPath + "present.gif",
        "(g)" : globalPath + "present.gif",
        "(W)" : globalPath + "wilted_rose.gif",
        "(w)" : globalPath + "wilted_rose.gif",
        "(~)" : globalPath + "film.gif",
        "(&)" : globalPath + "dog.gif", // NE MARCHE PAS -> RENVOI WINK
        "(I)" : globalPath + "lightbulb.gif",
        "(i)" : globalPath + "lightbulb.gif",
        "(S)" : globalPath + "moon.gif",
        "(E)" : globalPath + "email.gif",
        "(e)" : globalPath + "email.gif",
        "(M)" : globalPath + "messenger.gif",
        "(m)" : globalPath + "messenger.gif",
        "(bah)" : globalPath + "sheep.gif",
        "(||)" : globalPath + "bowl.gif",
        "(so)" : globalPath + "soccer.gif",
        "(ap)" : globalPath + "airplane.gif",
        "(ip)" : globalPath + "island.gif",
        "(mp)" : globalPath + "portable.gif",
        "(li)" : globalPath + "lightning.gif"
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