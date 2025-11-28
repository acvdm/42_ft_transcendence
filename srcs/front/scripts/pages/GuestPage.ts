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

                <div id="chat-frame" class="relative flex-1 p-10 bg-transparent rounded-sm flex flex-row items-end gap-4 bg-cover bg-center transition-all duration-300 min-h-0 overflow-hidden">
                  
                  <!-- Image à gauche -->
                  <div class="relative w-[110px] h-[110px] flex-shrink-0">
                      <!-- le cadre -->
                      <img id="user-status" class="absolute inset-0 w-full h-full object-cover" src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">
                      <!-- l'image -->
                      <img id="user-profile" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] object-cover" src="/assets/profile/Friendly_Dog.png">
                  </div>
                  
                  <!-- Live chat à droite -->
                  <div class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 relative z-10 min-h-0 h-full -mb-4 -mr-4">
                      <h1 class="text-lg font-bold mb-2">Live chat </h1>
                      <div id="chat-messages" class="flex-1 h-0 overflow-y-auto min-h-0 border-t border-gray-200 pt-2 space-y-2 text-sm"></div>

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
                              
                          
                              <!-- Menu pour les fonts -->
                            
                               <button id="change-font" class="h-6">
                                    <div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
                                    <div class="w-5"><img src="/assets/chat/change_font.png" alt="Change font"></div>
                                    <div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>

                                    <!-- Menu dropdown -> il s'ouvre quand on clique -->
                                    <div id="font-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-auto p-1 bg-white border border-gray-300 rounded-md shadow-xl">
                                        <div class="grid grid-cols-4 gap-[2px] w-[102px]" id="font-grid"></div>
                                    </div>

                                    </div>
                                </button>

                            
                            <div class="relative">
                              <button id="select-background" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300">
                                  <div class="w-5"><img src="/assets/chat/select_background.png" alt="Background"></div>
                                  <div><img src="/assets/chat/arrow.png" alt="Arrow"></div>
                              </button>

                              <div id="background-dropdown" class="absolute hidden bottom-full right-0 mb-1 w-64 p-2 bg-white border border-gray-300 rounded-md shadow-xl z-50">
                                  <p class="text-xs text-gray-500 mb-2 pl-1">Choose a background:</p>
                                  
                                  <div class="grid grid-cols-3 gap-2">
                                      
                                      <button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
                                              data-bg="url('/assets/backgrounds/fish_background.jpg')"
                                              style="background-image: url('/assets/backgrounds/fish_background.jpg');">
                                      </button>

                                      <button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
                                              data-bg="url('/assets/backgrounds/heart_background.jpg')"
                                              style="background-image: url('/assets/backgrounds/heart_background.jpg');">
                                      </button>

                                      <button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
                                              data-bg="url('/assets/backgrounds/lavender_background.jpg')"
                                              style="background-image: url('/assets/backgrounds/lavender_background.jpg');">
                                      </button>

                                      
                                      
                                      <button class="bg-option col-span-3 text-xs text-red-500 hover:underline mt-1" data-bg="none">
                                          Default background
                                      </button>
                                  </div>
                              </div>
                          </div>

                      </div>
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
        "(boucy_ball)" : animationPath + "bouncy_ball.gif",
        "(bow)" : animationPath + "bow.gif",
        "(crying)" : animationPath + "crying.gif",
        "(dancer)" : animationPath + "dancer.gif",
        "(dancing_pig)" : animationPath + "dancing_pig.gif",
        "(frog)" : animationPath + "frog.gif",
        "(guitar_smash)" : animationPath + "guitar_smash.gif",
        "(heart)" : animationPath + "heart.gif",
        "(kiss)" : animationPath + "kiss.gif",
        "(knock)" : animationPath + "knock.gif",
        "(silly_face)" : animationPath + "silly_face.gif",
        "(ufo)" : animationPath + "ufo.gif",
        "(water_balloon)" : animationPath + "water_balloon.gif",
    }


    const icons: { [key: string]: string } = {
        "(boucy_ball)" : animationPath + "bouncy_ball.png",
        "(bow)" : animationPath + "bow.jpg",
        "(crying)" : animationPath + "crying.png",
        "(dancer)" : animationPath + "dancer.png",
        "(dancing_pig)" : animationPath + "dancing_pig.png",
        "(frog)" : animationPath + "frog.png",
        "(guitar_smash)" : animationPath + "guitar_smash.png",
        "(heart)" : animationPath + "heart.png",
        "(kiss)" : animationPath + "kiss.png",
        "(knock)" : animationPath + "knock.png",
        "(silly_face)" : animationPath + "silly_face.png",
        "(ufo)" : animationPath + "ufo.png",
        "(water_balloon)" : animationPath + "water_balloon.png",
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

    const scrollToBottom = () => {
        if(messagesContainer) {
            // Un petit délai pour laisser le navigateur calculer la hauteur
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 50);
        }
    };

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

            Object.keys(icons).forEach(key => {
                const imgUrl = icons[key];
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
                <div>
                    <strong>${author} said:</strong><br>
                    <img src="${imgUrl}" alt="${animationKey}">
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
        scrollToBottom();
        setTimeout(scrollToBottom, 200);
    }


    // ---------------------------------------------------
    // ----          LOGIQUE DE BACKGROUND            ----
    // ---------------------------------------------------

    const bgButton = document.getElementById('select-background');
    const bgDropdown = document.getElementById('background-dropdown');
    const chatFrame = document.getElementById('chat-frame');
    const bgOptions = document.querySelectorAll('.bg-option');

    if (bgButton && bgDropdown && chatFrame) {

        // ouverture fermeture du menu
        bgButton.addEventListener('click', (e) => {
            e.stopPropagation(); // on evite la fermeture immediate
            bgDropdown.classList.toggle('hidden');
            
            // on ferme les autres menus sil sont ouverts 
            document.getElementById('emoticon-dropdown')?.classList.add('hidden');
            document.getElementById('animation-dropdown')?.classList.add('hidden');
            document.getElementById('font-dropdown')?.classList.add('hidden');
        });

        // on clique sur l'option de notre choix
        bgOptions.forEach(option => {
            option.addEventListener('click', () => {
                const bgImage = option.getAttribute('data-bg');

                if (bgImage === 'none') {
                    // reset au background de base -> transparent
                    chatFrame.style.backgroundImage = '';
                    chatFrame.classList.add('bg-transparent');
                } else if (bgImage) {
                    // sinon l'image de notre choix
                    chatFrame.classList.remove('bg-[#BC787B]');
                    chatFrame.style.backgroundImage = bgImage;
                    chatFrame.style.backgroundSize = 'cover'; 
                    chatFrame.style.backgroundPosition = 'center';
                }

                // on ferme le m
                bgDropdown.classList.add('hidden');
            });
        });

        // ou on ferme si on clique ailleurs
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!bgDropdown.contains(target) && !bgButton.contains(target)) {
                bgDropdown.classList.add('hidden');
            }
        });
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

        formattedMessage = formattedMessage
            .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
            .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
            .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
            .replace(/\[s\](.*?)\[\/s\]/g, '<s>$1</s>')
            .replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>');


        return formattedMessage;
    };

    // ---------------------------------------------------
    // ----            LOGIQUE DE POLICE              ----
    // ---------------------------------------------------

    const fontButton = document.getElementById('change-font');
    const fontDropdown = document.getElementById('font-dropdown');
    const fontGrid = document.getElementById('font-grid');

    // insertion des balises autour du texte selectionne
    const wrapSelection = (tagOrColor: string, isColor = false) => {
        if (!messageInput) return;

        const start = messageInput.selectionStart ?? messageInput.value.length;
        const end = messageInput.selectionEnd ?? messageInput.value.length;
        const selectedText = messageInput.value.substring(start, end);

        let replacement: string;
        let cursorOffset: number;

        if (isColor) {
            const openTag = `[color=${tagOrColor}]`;
            replacement = `${openTag}${selectedText}[/color]`;
            cursorOffset = openTag.length;
        } else {
            const openTag = `[${tagOrColor}]`;
            replacement = `${openTag}${selectedText}[/${tagOrColor}]`;
            cursorOffset = openTag.length;
        }

        messageInput.value = messageInput.value.substring(0, start) + replacement + messageInput.value.substring(end);

        const newCursorPos = selectedText.length > 0 
            ? start + replacement.length 
            : start + cursorOffset;

        messageInput.setSelectionRange(newCursorPos, newCursorPos); 
        messageInput.focus();
    };

    if (fontButton && fontDropdown && fontGrid) {
        // remplissage de la grille
        const generateFontGrid = () => {
            fontGrid.innerHTML = ''; // on vide lke contenu

            const colors = [
                '#000000', // noir
                '#F42F25', // rouge
                '#F934FB', // rose
                '#F76D2A', // orange
                '#217F1C', // vert
                '#3019F7', // bleu
                '#F9CA37', // jaune
                '#42FB37' // vert fluo
            ];

            colors.forEach(color => {
                const colorButton = document.createElement('div');
                colorButton.className = 'w-6 h-6 cursor-pointer border border-gray-300 hover:border-blue-500 hover:shadow-sm rounded-[2px]';
                colorButton.style.backgroundColor = color;

                colorButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    wrapSelection(color, true);
                    fontDropdown.classList.add('hidden');
                });

                fontGrid.appendChild(colorButton);
            });

            // poiyur les styles de police
            const styles = [
                { tag: 'b', icon: 'font_bold.png', title: 'Bold' },
                { tag: 'i', icon: 'font_italic.png', title: 'Italic' },
                { tag: 'u', icon: 'font_underline.png', title: 'Underline' },
                { tag: 's', icon: 'font_strikethrough.png', title: 'Strikethrough' }
            ];

            styles.forEach(styles => {
                const styleButton = document.createElement('div');
                styleButton.className = 'w-6 h-6 flex justify-center items-center cursor-pointer border border-transparent hover:bg-blue-50 hover:border-blue-200 rounded-[2px] transition-all';

                styleButton.innerHTML = `<img src="/assets/chat/${styles.icon}" alt="${styles.title}" class="w-[14px] h-[14px]">`;

                styleButton.addEventListener('click', (e) => { // pourquoi e pour error ici et pas event?
                    e.stopPropagation();
                    wrapSelection(styles.tag, false);
                    fontDropdown.classList.add('hidden');
                });

                fontGrid.appendChild(styleButton);
            });
        };

        generateFontGrid();

        // Ouvrir/Fermer le menu
        fontButton.addEventListener('click', (e) => {
            e.stopPropagation();
            fontDropdown.classList.toggle('hidden');
            // Fermer les autres menus si ouverts
            document.getElementById('emoticon-dropdown')?.classList.add('hidden');
            document.getElementById('animation-dropdown')?.classList.add('hidden');
        });

        // Gérer les clics sur TOUS les boutons du menu (Tags ET Couleurs) en même temps
        fontDropdown.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const target = e.currentTarget as HTMLElement; // Utiliser currentTarget pour être sûr d'avoir le bouton
                
                const tag = target.dataset.tag;
                const color = target.dataset.color;

                if (tag) {
                    wrapSelection(tag, false);
                } else if (color) {
                    wrapSelection(color, true);
                }
                
                // On ferme le menu après le clic
                fontDropdown.classList.add('hidden');
            });
        });
    }

    // NOTE: J'ai supprimé le bloc `document.querySelectorAll('button[data-color]')` qui était ici
    // car il est maintenant géré juste au-dessus pour éviter les conflits.

    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (fontDropdown && !fontDropdown.contains(target) && !fontButton?.contains(target)) {
            fontDropdown.classList.add('hidden');
        }
    });



    // ---------------------------------------------------
    // ----         AFFICHAGE DES MESSAGES            ----
    // ---------------------------------------------------


    const addMessage = (message: string, author: string = "Admin") => { // pour le moment -> admin = fallback
        const msgElement = document.createElement('p');
        msgElement.className = "mb-1";

        const contentEmoticons = parseMessage(message);

        msgElement.innerHTML = `<strong>${author} said:</strong><br> ${contentEmoticons}`;
        messagesContainer.appendChild(msgElement);
        // rajouter un scroll automatique vers le bas
        scrollToBottom();
        setTimeout(scrollToBottom, 200);
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