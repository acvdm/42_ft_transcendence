import { parse } from "path";
import { io, Socket } from "socket.io-client";

// on va exportrter une fonction qui renvoie du html 
export function render(): string {
    return `
        <div id="wizz-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden bg-gradient-to-b from-white via-white to-[#7ED5F4]">

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


                    <!-- Partie live chat -->

                    <div class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 overflow-hidden">
                        <h1 class="text-lg font-bold mb-2">Live chat </h1>
                        <div id="chat-messages" class="flex-1 overflow-y-auto border-t border-gray-200 pt-2 space-y-2 text-sm"></div>

                        <!-- Input element  -->

                        <div class="flex flex-col">
                          <input type="text" id="chat-input" placeholder="Écrire un message..." class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">

                          <!-- Insertion des emoticones, wizz etc -->
                           <div class="flex border-x border-b rounded-b-[4px] border-[#bdd5df] items-center pl-1" style="background-image: url(&quot;/assets/chat/chat_icons_background.png&quot;);">
                              <button id="select-emoticon" class="h-6">
                                  <div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
                                  <div class="w-5"><img src="/assets/chat/select_emoticon.png" alt="Select Emoticon"></div>
                                  <div><img src="/assets/chat/arrow.png" alt="Select arrow">
                                </div>

                                <!-- Menu dropdown -> il s'ouvre quand on clique -->

                                <div id="emoticon-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
                                  <div class="grid grid-cols-8 gap-1" id="emoticon-grid"></div>
                                </div>

                                </div>
                              </button>
                              
                                <button id="select-animation" class="h-6">
                                  <div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
                                  <div class="w-5"><img src="/assets/chat/select_wink.png" alt="Select Animation"></div>
                                  <div><img src="/assets/chat/arrow.png" alt="Select arrow">
                                    </div>

                                    <!-- Menu dropdown -> il s'ouvre quand on clique -->

                                    <div id="animation-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
                                    <div class="grid grid-cols-8 gap-1" id="animation-grid"></div>
                                    </div>

                                    </div>
                                </button>



                              <div class="absolute top-0 left-0 flex w-full h-full justify-center items-center pointer-events-none"><div></div></div>
                              <button id="send-wizz" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300"><div><img src="/assets/chat/wizz.png" alt="Sending wizz"></div></button>
                              <div class="px-2"><img src="/assets/chat/chat_icons_separator.png" alt="Icons separator"></div>
                              <button id="change-font" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300"><div><img src="/assets/chat/change_font.png" alt=""></div>
                              <button id="select-background" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300"><div class="w-5"><img src="/assets/chat/select_background.png" alt=""></div><div><img src="/assets/chat/arrow.png" alt=""></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    `;
}; 

export function afterRender(): void {

    let globalPath = "/assets/emoticons/";
    let animationPath = "/assets/animated/";

    const emoticons: { [key: string]: string } = {};

    const animations: { [key: string]: string } = {
        "(boucy_ball)" : animationPath + "bouncy_ball.png",
    }


    // On évite les doublons en créant des alias
    function alias(keys: string[], file: string) {
        keys.forEach(k => emoticons[k] = globalPath + file);
    }

    // émoticones uniques
    Object.assign(emoticons, {
        ":-)" : globalPath + "smile.gif",
        ":-O" : globalPath + "surprised.gif",
        ";-)" : globalPath + "wink_smile.gif",
        ":-S" : globalPath + "confused.gif",
        ":'(" : globalPath + "crying.gif",
        ":-#" : globalPath + "silence.gif",
        "8-|" : globalPath + "nerd.gif",
        ":-*" : globalPath + "secret.gif",
        ":^)" : globalPath + "unknow.gif",
        "|-)" : globalPath + "sleepy.gif",
        "({)" : globalPath + "guy_hug.gif",
        ":-[" : globalPath + "bat.gif",
        "(@)" : globalPath + "cat.gif",
        "(8)" : globalPath + "note.gif",
        "(*)" : globalPath + "star.gif",
        "(sn)" : globalPath + "snail.gif",
        "(pl)" : globalPath + "plate.gif",
        "(pi)" : globalPath + "pizza.gif",
        "(au)" : globalPath + "car.gif",
        "(um)" : globalPath + "umbrella.gif",
        "(co)" : globalPath + "computer.gif",
        "(st)" : globalPath + "storm.gif",
        "(mo)" : globalPath + "money.gif",
        "8o|" : globalPath + "teeth.gif",
        "^o)" : globalPath + "sarcastic.gif",
        "+o(" : globalPath + "sick.gif",
        "*-)" : globalPath + "thinking.gif",
        "8-)" : globalPath + "eye_roll.gif",
        "(6)" : globalPath + "devil_smile.gif",
        "(bah)" : globalPath + "sheep.gif",
        "(||)" : globalPath + "bowl.gif",
        "(so)" : globalPath + "soccer.gif",
        "(ap)" : globalPath + "airplane.gif",
        "(ip)" : globalPath + "island.gif",
        "(mp)" : globalPath + "portable.gif",
        "(li)" : globalPath + "lightning.gif",
    });

    // alias = tous les doublons
    alias([":)", ":-)"], "smile.gif");
    alias([":o", ":-O"], "surprised.gif");
    alias([";)", ";-)"], "wink_smile.gif");
    alias([":s", ":-S"], "confused.gif");
    alias(["(H)", "(h)"], "hot.gif");
    alias(["(A)", "(a)"], "angel.gif");
    alias([":[" , ":-["], "bat.gif");
    alias(["(L)", "(l)"], "heart.gif");
    alias(["(K)", "(k)"], "kiss.gif");
    alias(["(F)", "(f)"], "rose.gif");
    alias(["(P)", "(p)"], "camera.gif");
    alias(["(T)", "(t)"], "phone.gif");
    alias(["(O)", "(o)"], "clock.gif");
    alias([":D", ":-D"], "teeth_smile.gif");
    alias([":p", ":-P"], "tongue_smile.gif");
    alias([":(", ":-("], "sad.gif");
    alias([":|", ":-|"], "disappointed.gif");
    alias([":$", ":-$"], "embarrassed.gif");
    alias([":@", ":-@"], "angry.gif");
    alias(["(C)", "(c)"], "coffee.gif");
    alias(["(N)", "(n)"], "thumbs_down.gif");
    alias(["(D)", "(d)"], "martini.gif");
    alias(["(Z)", "(z)"], "guy.gif");
    alias(["(})", "({)"], "guy_hug.gif");
    alias(["(U)", "(u)"], "broken_heart.gif");
    alias(["(G)", "(g)"], "present.gif");
    alias(["(W)", "(w)"], "wilted_rose.gif");
    alias(["(E)", "(e)"], "email.gif");
    alias(["(I)", "(i)"], "lightbulb.gif");
    alias(["(M)", "(m)"], "messenger.gif");
    alias(["(Y)", "(y)"], "thumbs_up.gif");
    alias(["(B)", "(b)"], "beer_mug.gif");
    alias(["(X)", "(x)"], "girl.gif");

    const socket = io("/", {
        path: "/socket.io/", // on met le chemin que nginx va intercepter 
    });

    const messagesContainer = document.getElementById('chat-messages');
    const messageInput = document.getElementById('chat-input') as HTMLInputElement;
    const wizzButton = document.getElementById('send-wizz');
    const wizzContainer = document.getElementById('wizz-container');

    const wizzAuthor = "Faustoche"; // à remplacer par l'username de l;envoyeur

    if (!messagesContainer || !messageInput) {
        console.log("Can't find chat elements");
        return;
    }


    // ---------------------------------------------------
    // ----            LOGIQUE D'ANIMATION            ----
    // ---------------------------------------------------

    const animationButton = document.getElementById('select-animation');
    const animationDropdown = document.getElementById('animation-dropdown');
    const animationGrid = document.getElementById('animation-grid');

    const insertTag = (tagKey: string) => {
        const start = messageInput.selectionStart ?? messageInput.value.length;
        const end = messageInput.selectionEnd ?? messageInput.value.length;

        const toInsert = tagKey + ' ';
        const newValue = messageInput.value.substring(0, start) + toInsert + messageInput.value.substring(end);
        messageInput.value = newValue;

        const newCursorPosition = start + toInsert.length;
        messageInput.selectionStart = newCursorPosition;
        messageInput.selectionEnd = newCursorPosition;
        messageInput.focus();
    }

    if (animationButton && animationDropdown && animationGrid) {
        // on rempli la grille des animations
        const fillAnimationGrid = () => {
            animationGrid.innerHTML = '';

            Object.keys(animations).forEach(key => {
                const imgUrl = animations[key];
                const animationItem = document.createElement('div');
                animationItem.className = 'cursor-pointer-w10 h-10 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100';
                animationItem.innerHTML = `<img src="${imgUrl}" alt="${key}" title="${key}" class="w-[32px] h-[32px] object-contain">`;

                // clic sur l'anumation
                animationItem.addEventListener('click', (event) => {
                    event.stopPropagation();

                    // envoi de l'animation via la sockettt
                    socket.emit("sendAnimation", {
                        animationKey: key,
                        author: "Faustoche" // a remplacer par l'username de l'envoyeur 
                    });
                    animationDropdown.classList.add('hidden');
                });
                animationGrid.appendChild(animationItem);
            });
        };
        animationButton.addEventListener('click', (event) => {
            event.stopPropagation();
            animationDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (!animationDropdown.contains(target) && !animationButton.contains(target))
                animationDropdown.classList.add('hidden');
        });
        fillAnimationGrid();
    }

    socket.on("receivedAnimation", (data: { animationKey: string, author: string }) => {
        const { animationKey, author } = data;
        const imgUrl = animations[animationKey];
        
        if (imgUrl) {
             // Utilise une mise en forme spéciale pour les animations
            const animationHTML = `
                <div class="p-2 border border-gray-200 rounded-md bg-gray-50 max-w-sm">
                    <strong>${author}</strong> a envoyé une animation :<br>
                    <img src="${imgUrl}" alt="${animationKey}" class="mt-1 w-24 h-24 object-contain">
                </div>
            `;
            addCustomContent(animationHTML);
        } else {
            addMessage(`Animation inconnue (${animationKey}) reçue de ${author}.`, "Système");
        }
    });

    // Nouvelle fonction pour ajouter du contenu HTML arbitraire
    const addCustomContent = (htmlContent: string) => {
        const msgElement = document.createElement('div');
        msgElement.className = "mb-1";
        msgElement.innerHTML = htmlContent;
        messagesContainer.appendChild(msgElement);
        // rajouter un scroll automatique vers le bas
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }





    // ---------------------------------------------------
    // ----           LOGIQUE D'ÉMOTICONES            ----
    // ---------------------------------------------------

    const emoticonButton = document.getElementById('select-emoticon');
    const emoticonDropdown = document.getElementById('emoticon-dropdown');
    const emoticonGrid = document.getElementById('emoticon-grid');

    if (emoticonButton && emoticonDropdown && emoticonGrid) {

        // insertion de la clé de l'emoticon a la position actuelle du cursor dans l'unpout
        // + insertion d'un espace apres 
        // @param emoticonKey -> eky de l'émoticon

        const insertEmoticon = (emoticonKey: string) => {
            const start = messageInput.selectionStart ?? messageInput.value.length;
            const end = messageInput.selectionEnd ?? messageInput.value.length;

            // on ajoute l'espace
            const toInsert = emoticonKey + ' ';
            const newValue = messageInput.value.substring(0, start) + toInsert + messageInput.value.substring(end);
            messageInput.value = newValue;

            const newCursorPosition = start + toInsert.length;
            messageInput.selectionStart = newCursorPosition;
            messageInput.selectionEnd = newCursorPosition;
            messageInput.focus(); // quel interet de cette fonction focus
        }


        // remplissage de la grille des emoticones dans le menu
        const fillEmoticonsGrid = () => {
            emoticonGrid.innerHTML = ''; // on vide le contenu existant

            // 1. Regrouper les clés (raccourcis) par URL d'image pour éliminer les doublons
            const emoticonsByUrl = new Map<string, string[]>();
            
            // on trie par longieur (pour que l'alias le plus long soit le premier à être ajouté dans la liste des alias)
            const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);

            sortedKeys.forEach(key => {
                const imgUrl = emoticons[key];
                
                if (!emoticonsByUrl.has(imgUrl)) {
                    emoticonsByUrl.set(imgUrl, []);
                }
                // Ajouter la clé textuelle à la liste des alias pour cette image
                emoticonsByUrl.get(imgUrl)!.push(key);
            });
            
            // 2. Parcourir les images uniques (les entrées de la Map) et créer les boutons
            emoticonsByUrl.forEach((keys, imgUrl) => {
                
                // keys[0] est l'alias le plus long/spécifique (grâce au tri initial)
                const primaryKey = keys[0]; 
                // Afficher tous les alias dans l'infobulle (tooltip)
                const tooltipTitle = keys.join(' | ');

                const emoticonItem = document.createElement('div');

                // CORRECTION: justify-center au lieu de jsutify-center
                // w-7 h-7 = zone cliquable + grande
                emoticonItem.className = 'cursor-pointer w-7 h-7 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100';

                // balise image avec le titre contenant TOUS les raccourcis (alias)
                emoticonItem.innerHTML = `<img src="${imgUrl}" alt="${primaryKey}" title="${tooltipTitle}" class="w-[20px] h-[20px]">`;

                // gestion du clic sur l'emoticone dans le menu
                emoticonItem.addEventListener('click', (event) => {
                    event.stopPropagation(); // evite fermeture immediate
                    
                    // On insère uniquement la clé principale/la plus longue dans l'input
                    insertEmoticon(primaryKey); 

                    // on cache le menu apres la selection
                    emoticonDropdown.classList.add('hidden');
                });

                emoticonGrid.appendChild(emoticonItem);
            });
        };

        // afficher et masquer le menu au clic du bouton 
        emoticonButton.addEventListener('click', (event) => {
            event.stopPropagation(); // empeche le click de masquer 
            emoticonDropdown.classList.toggle('hidden');
        });

        // on masque le munu si l'utilisateur clique n'importe ou aillewurs sur la page
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            // si le clic n'est ni su le bouton ni dans le drowpdown on le cache
            if (!emoticonDropdown.contains(target) && !emoticonButton.contains(target)) {
                emoticonDropdown.classList.add('hidden');
            }
        });

        // initialisation = remplir la grille quand la page est chargee

        fillEmoticonsGrid();
    }



    // ---------------------------------------------------
    // ----           PARSING DES MESSAGES            ----
    // ---------------------------------------------------


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


    // ---------------------------------------------------
    // ----         AFFICHAGE DES MESSAGES            ----
    // ---------------------------------------------------


    const addMessage = (message: string, author: string = "Admin") => { // pour le moment -> admin = fallback
        const msgElement = document.createElement('p');
        msgElement.className = "mb-1";

        const contentEmoticons = parseMessage(message);

        msgElement.innerHTML = `<strong>${author}:\n</strong> ${contentEmoticons}`;
        messagesContainer.appendChild(msgElement);
        // rajouter un scroll automatique vers le bas
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // variable pour stocket l'id du time secousse
    let shakeTimeout: number | undefined;

    // délcencher la secousse 
    const shakeElement = (element: HTMLElement | null, duration: number = 500) => {
        if (!element)
            return;

        // annuler le tem,ps de la secousse rpecedence
        if (shakeTimeout)
            clearTimeout(shakeTimeout);

        // on applique la classe d'animation avec le css personnalisé -> keyframe
        element.classList.remove('wizz-shake');

        // froce d'un reflow
        void element.offsetWidth;
        element.classList.add('wizz-shake');

        // on retire la classe une fois que l'amination est terminé
        shakeTimeout = window.setTimeout(() => {
            element.classList.remove('wizz-shake');
            shakeTimeout = undefined;
        }, duration);

        // on essaie de mettre un son
        try {
            const wizzSound = new Audio('/assets/chat/wizz_sound.mp3');
            wizzSound.play().catch(e => console.log("Could not play wizz sound:", e.message));
        } catch (e) {
            console.log("Audio API error:", (e as Error).message);
        }
    };

    // ---------------------------------------------------
    // ----            LOGIQUE DU WIZZ                ----
    // ---------------------------------------------------

    if (wizzButton) {
        wizzButton.addEventListener('click', () => {
            // on envois l'element snedWizz au serveur
            socket.emit("sendWizz", { author: wizzAuthor});
            // secousse pour l'expediteur et le receveur
            if (wizzContainer) {
                shakeElement(wizzContainer, 500);
            }
        });
    }

    // reception ici du serveur au client
    socket.on("receivedWizz", (data: { author: string }) => {
        // on affiche le message -> xx send a nudge (poke?)
        addMessage(`<strong>${data.author} sent a nudge</strong>`, "Admin");
        // on declenche la secousse
        shakeElement(wizzContainer, 3000)
    })


    // ---------------------------------------------------
    // ----      MISE EN ÉCOUTE DES SOCKETS           ----
    // ---------------------------------------------------

    socket.on("connect", () => {
        addMessage("Connected to chat server!");
    });

    // on va écouter l'événement chatmessage venant du serveur
    socket.on("chatMessage", (data: any) => {
            // le backend va renvoyer data, 
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