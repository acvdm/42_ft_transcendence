import { parse } from "path";
import { io, Socket } from "socket.io-client";

// on va exportrter une fonction qui renvoie du html 
export function render(): string {
    return `


    `;
}; 

export function afterRender(): void {

    let globalPath = "/assets/emoticons/";

    const emoticons: { [key: string]: string } = {
        ":-)" : globalPath + "smile.gif",
        ":)" : globalPath + "smile.gif",
        ":-O" : globalPath + "surprised.gif",
        ":o" : globalPath + "surprised.gif",
        ";-)" : globalPath + "wink_smile.gif",
        ";)" : globalPath + "wink_smile.gif",
        ":-S" : globalPath + "confused.gif",
        ":s" : globalPath + "confused.gif",
        ":'(" : globalPath + "crying.gif",
        "(H)" : globalPath + "hot.gif",
        "(h)" : globalPath + "hot.gif",
        "(A)" : globalPath + "angel.gif",
        "(a)" : globalPath + "angel.gif",
        ":-#" : globalPath + "silence.gif",
        "8-|" : globalPath + "nerd.gif",
        ":-*" : globalPath + "secret.gif",
        ":^)" : globalPath + "unknow.gif",
        "|-)" : globalPath + "sleepy.gif",
        "(Y)" : globalPath + "thumbs_up.gif",
        "(y)" : globalPath + "thumbs_up.gif",
        "(B)" : globalPath + "beer_mug.gif",
        "(b)" : globalPath + "beer_mug.gif",
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
        "(Z)" : globalPath + "guy.gif",
        "(z)" : globalPath + "guy.gif",
        "(})" : globalPath + "guy_hug.gif",
        "(^)" : globalPath + "cake.gif",
        "(U)" : globalPath + "broken_heart.gif",
        "(u)" : globalPath + "broken_heart.gif",
        "(G)" : globalPath + "present.gif",
        "(g)" : globalPath + "present.gif",
        "(W)" : globalPath + "wilted_rose.gif",
        "(w)" : globalPath + "wilted_rose.gif",
        "(~)" : globalPath + "film.gif",
        "(&)" : globalPath + "dog.gif",
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
            const escapedKey = escapeRegex(escapeHTML(key));
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