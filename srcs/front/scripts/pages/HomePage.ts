import { io, Socket } from "socket.io-client";
import htmlContent from "./HomePage.html";

// on va exporter une fonction qui renvoie du html 
export function render(): string {
    return htmlContent;
};

export function afterRender(): void {

    // --- VARIABLES GLOBALES ET CONFIGURATION EN HAUT POUR ÉVITER LES ERREURS ---
    let globalPath = "/assets/emoticons/";
    let animationPath = "/assets/animated/";
    let currentChannel: string = "general";

    // On définit statusImages ICI pour qu'il soit accessible par attachFriendClick plus bas
    const statusImages: { [key: string]: string } = {
        'available': '/assets/basic/status_online_small.png',
        'busy':      '/assets/basic/status_busy_small.png',
        'away':      '/assets/basic/status_away_small.png',
        'invisible': '/assets/basic/status_offline_small.png',
        'offline':   '/assets/basic/status_offline_small.png' // Sécurité au cas où
    };

    const statusLabels: { [key: string]: string } = {
        'available': '(Available)',
        'busy':      '(Busy)',
        'away':      '(Away)',
        'invisible': '(Appear offline)'
    };

    const getStatusDot = (status: string) => {
        switch(status) {
            case 'available':   return '/assets/friends/online-dot.png';
            case 'busy':        return '/assets/friends/busy-dot.png';
            case 'away':        return '/assets/friends/away-dot.png';
            default:            return '/assets/friends/offline-dot.png';
        }
    };
    // --------------------------------------------------------------------------

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

    const currentUsername = localStorage.getItem('username');

    const userConnected = document.getElementById('user-name');
    const bioText = document.getElementById('user-bio');
    const bioWrapper = document.getElementById('bio-wrapper');

    const friendItems = document.querySelectorAll('.friend-item');
    const channelChat = document.getElementById('channel-chat');
    const chatPlaceholder = document.getElementById('chat-placeholder');

    const chatHeaderAvatar = document.getElementById('chat-header-avatar');
    const chatHeaderName = document.getElementById('chat-header-username');
    const chatHeaderBio = document.getElementById('chat-header-bio');


    const addFriendButton = document.getElementById('add-friend-button');
    const addFriendDropdown = document.getElementById('add-friend-dropdown');
    const friendSearchInput = document.getElementById('friend-search-input') as HTMLInputElement;
    const sendFriendRequestBtn = document.getElementById('send-friend-request');
    const cancelFriendRequestBtn = document.getElementById('cancel-friend-request');
    const friendRequestMessage = document.getElementById('friend-request-message');

    const notifButton = document.getElementById('notification-button');
    const notifDropdown = document.getElementById('notification-dropdown');
    const notifList = document.getElementById('notification-list');

    // ---------------------------------------------------
    // ----           LOGIQUE DES AMIS.               ----
    // ---------------------------------------------------    

    if (notifButton && notifDropdown && notifList) {
        
        // On définit handleRequest AVANT de l'utiliser dans checkNotifications
        const handleRequest = async (askerId: number, action: 'validated' | 'rejected' | 'blocked', itemDiv: HTMLElement) => { 
            const userId = localStorage.getItem('userId'); 

            try {
                const response = await fetch(`/api/users/${userId}/friendships/${itemDiv.dataset.friendshipId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: askerId, status: action }) 
                });

                if (response.ok) {
                    itemDiv.style.opacity = '0'; 
                    setTimeout(() => {
                        itemDiv.remove();
                        if (action === 'validated') loadFriends(); 
                        checkNotifications(); 
                    }, 300);
                } else {
                    console.error("Failed to update request");
                }
            } catch (error) {
                console.error("Network error", error);
            }
        };

        const checkNotifications = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            try {
                const response = await fetch(`/api/users/${userId}/friendships/pendings`);
                if (!response.ok) throw new Error('Failed to fetch friends');

                const requests = await response.json();
                const pendingList = requests.data;

                const notifIcon = document.getElementById('notification-icon') as HTMLImageElement;
                
                if (pendingList.length > 0) {
                    if (notifIcon) notifIcon.src = "/assets/basic/notification.png";
                } else {
                    if (notifIcon) notifIcon.src = "/assets/basic/no_notification.png";
                }

                notifList.innerHTML = '';

                if (pendingList.length === 0) {
                    notifList.innerHTML = '<div class="p-4 text-center text-xs text-gray-500">No new notifications</div>';
                    return;
                }

                pendingList.forEach((req) => {
                    const item = document.createElement('div');
                    item.dataset.friendshipId = req.friendshipId;
                    item.className = "flex items-center p-3 border-b border-gray-100 gap-3 hover:bg-gray-50 transition";

                    item.innerHTML = `
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold truncate">${req.alias}</p>
                            <p class="text-xs text-gray-500">Wants to be your friend</p>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn-accept bg-blue-500 text-gray-600 p-1.5 rounded hover:bg-blue-600 transition" title="Accept">✓</button>
                            <button class="btn-reject bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300 transition" title="Decline">✕</button>
                            <button class="btn-block bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300 transition" title="Block">🚫</button>
                        </div>
                    `;

                    const buttonAccept = item.querySelector('.btn-accept');
                    const buttonReject = item.querySelector('.btn-reject');
                    const buttonBlock  = item.querySelector('.btn-block');

                    buttonAccept?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        handleRequest(req.id, 'validated', item);
                    });

                    buttonReject?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        handleRequest(req.id, 'rejected', item);
                    });

                    buttonBlock?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        handleRequest(req.id, 'blocked', item);
                    });

                    notifList.appendChild(item);
                });

            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        notifButton.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('hidden');
            document.getElementById('add-friend-dropdown')?.classList.add('hidden');
            if (!notifDropdown.classList.contains('hidden')) {
                checkNotifications();
            }
        });

        document.addEventListener('click', (e) => {
            if (!notifDropdown.contains(e.target as Node) && !notifButton.contains(e.target as Node))
                notifDropdown.classList.add('hidden');
        });

        checkNotifications();
        setInterval(checkNotifications, 30000);
    }


    // ---------------------------------------------------
    // ----           LOGIQUE DES AMIS.               ----
    // ---------------------------------------------------


    if (addFriendButton && addFriendDropdown && friendSearchInput && sendFriendRequestBtn && cancelFriendRequestBtn) {
        
        // ouverture ou fermeture du dropdown
        addFriendButton.addEventListener('click', (e) => {
            e.stopPropagation();
            addFriendDropdown.classList.toggle('hidden');
            
            // fermeture des autres menus
            document.getElementById('status-dropdown')?.classList.add('hidden');
            document.getElementById('emoticon-dropdown')?.classList.add('hidden');
            document.getElementById('animation-dropdown')?.classList.add('hidden');
            document.getElementById('font-dropdown')?.classList.add('hidden');
            document.getElementById('background-dropdown')?.classList.add('hidden');
            
            if (!addFriendDropdown.classList.contains('hidden')) {
                friendSearchInput.focus();
            }
        });

        // envoi de la demande d'ami -> quel route on choisi>
        const sendFriendRequest = async () => {
            const searchValue = friendSearchInput.value.trim(); // onretire les espaces etc
            
            if (!searchValue) { // si vide alors message d;erreur
                showFriendMessage('Please enter a username or email', 'error');
                return;
            }

            const userId = localStorage.getItem('userId');

            try {
                const response = await fetch(`/api/users/${userId}/friendships`, { // on lance la requete sur cette route
                    method: 'POST', // post pour creer la demande -> patch quand on l'accepte?
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alias: searchValue })
                });

                const data = await response.json();

                if (response.ok) {
                    showFriendMessage('Friend request sent!', 'success'); // si ok alors la friend request en envoyee
                    friendSearchInput.value = '';
                    
                    setTimeout(() => { // timeout pour pas garder le menu ouvert indefiniment
                        addFriendDropdown.classList.add('hidden');
                        friendRequestMessage?.classList.add('hidden');
                    }, 1500);
                } else {
                    showFriendMessage(data.message || 'Error sending request', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showFriendMessage('Network error', 'error');
            }
        };

        // affichage pour l'utilisateur
        const showFriendMessage = (message: string, type: 'success' | 'error') => {
            if (friendRequestMessage) {
                friendRequestMessage.textContent = message;
                friendRequestMessage.classList.remove('hidden', 'text-green-600', 'text-red-600');
                friendRequestMessage.classList.add(type === 'success' ? 'text-green-600' : 'text-red-600');
            }
        };

        // clic sur envoyer
        sendFriendRequestBtn.addEventListener('click', sendFriendRequest);
        
        friendSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendFriendRequest();
            }
        });

        cancelFriendRequestBtn.addEventListener('click', () => {
            addFriendDropdown.classList.add('hidden');
            friendSearchInput.value = '';
            friendRequestMessage?.classList.add('hidden');
        });

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!addFriendDropdown.contains(target) && !addFriendButton.contains(target)) {
                addFriendDropdown.classList.add('hidden');
                friendRequestMessage?.classList.add('hidden');
            }
        });
    }

    // ---------------------------------------------------
    // ----           LOGIQUE DE LA MITIE               ----
    // ---------------------------------------------------    

    // getStatusDot a été déplacé en haut

    // ouverture du chat
    const attachFriendClick = (item: HTMLElement) => {
        item.addEventListener('click', () => {
            const friendUsername = item.dataset.username || "Unknown";
            console.log("Friend clicked:", item.dataset.username);

            // je récupère mes ids
            const connectedUserId = parseInt(localStorage.getItem('userId') || "0");
            const friendId = parseInt(item.dataset.id || "0");

            // je fais mon calcul
            const ids = [connectedUserId, friendId].sort((a, b) => a - b);
            const channelKey = `channel_${ids[0]}_${ids[1]}`;

            console.log("numero de la channel:", channelKey);

            currentChannel = channelKey; // Utilise la variable du scope principal
            socket.emit("joinChannel", channelKey);

            // affichage du chat
            if (chatPlaceholder) chatPlaceholder.classList.add('hidden');
            if (channelChat) channelChat.classList.remove('hidden');

            const targetUsername = item.dataset.username || "Unknown";
            const targetBio = item.dataset.bio || "";
            const targetAvatar = item.dataset.avatar || "/assets/basic/default.png";
            const targetStatus = item.dataset.status || "invisible";
            
            const chatHeaderAvatar = document.getElementById('chat-header-avatar') as HTMLImageElement;
            // CORRECTION: Casting correct ici (HTMLImageElement au lieu de HTMLElement)
            const chatHeaderStatus = document.getElementById('chat-header-status') as HTMLImageElement; 
            
            // maj header
            if (chatHeaderName) chatHeaderName.textContent = targetUsername;
            if (chatHeaderBio) chatHeaderBio.textContent = targetBio;
            if (chatHeaderAvatar) chatHeaderAvatar.src = targetAvatar;

            // Mise à jour de la frame du chat
            // Maintenant que statusImages est défini en haut, cela va fonctionner
            if (chatHeaderStatus && statusImages[targetStatus]) {
                chatHeaderStatus.src = statusImages[targetStatus];
            } else if (chatHeaderStatus) {
                // Fallback si status inconnu
                chatHeaderStatus.src = statusImages['invisible'];
            }

            // reset
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                // ici on recupere l'historique du chat potentiellement
                addMessage(`Beginning of your conversation with ${targetUsername}`, "System");
            }
            messageInput?.focus();
        });
    };

    const loadFriends = async () => {
        const userId = localStorage.getItem('userId');
        const contactsList = document.getElementById('contacts-list');
        
        if (!userId || !contactsList) return;

        try {
            const response = await fetch(`/api/users/${userId}/friends`);
            if (!response.ok) throw new Error('Failed to fetch friends');
            
            const responseData = await response.json();
            const friendList = responseData.data;
            // on vide la liste
            contactsList.innerHTML = '';
            
            if (!friendList || friendList.length === 0) {
                contactsList.innerHTML = '<div class="text-xs text-gray-500 ml-2">No friend yet</div>';
                return;
            }

            friendList.forEach((friend: any) => {
                const friendItem = document.createElement('div');
                friendItem.className = "friend-item flex items-center gap-3 p-2 rounded-sm hover:bg-gray-100 cursor-pointer transition";

                const status = friend.status || 'invisible'; 

                // on stocke tout
                friendItem.dataset.id = friend.id;
                friendItem.dataset.username = friend.alias;
                friendItem.dataset.status = status;
                friendItem.dataset.bio = friend.bio || "Share a quick message";
                friendItem.dataset.avatar = friend.avatar_url || friend.avatar || "/assets/basic/default.png";
                

                friendItem.innerHTML = `
                    <div class="relative w-[50px] h-[50px] flex-shrink-0">
                        <img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] object-cover"
                             src="${getStatusDot(status)}" alt="status">
                    </div>
                    <div class="flex flex-col leading-tight">
                        <span class="font-semibold text-sm text-gray-800">${friend.alias}</span>
                    </div>
                `;

                // on ajoute a la liste
                contactsList.appendChild(friendItem);
                attachFriendClick(friendItem);
            });

        } catch (error) {
            console.error("Error loading friends:", error);
            contactsList.innerHTML = '<div class="text-xs text-red-400 ml-2">Error loading contacts</div>';
        }
    };

    loadFriends();

    if (currentUsername && userConnected)
        userConnected.textContent = currentUsername;

    if (!messagesContainer || !messageInput) {
        console.log("Can't find chat elements");
        return;
    }

    const scrollToBottom = () => {
        if(messagesContainer) {
            // TIMEOUT POUR AVOIR LE TMEPS DE calculer la hauteur 
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 50);
        }
    };
    
    // ---------------------------------------------------
    // ----           LOGIQUE DE LA BIO et de la PHOTO              ----
    // ---------------------------------------------------

    
    let currentInput: HTMLInputElement | null = null;

    bioText?.addEventListener('click', () => {
        const input = document.createElement("input");
        currentInput = input; // REF DIRECT

        input.type = "text";
        input.value = bioText.textContent === "Share a quick message" ? "" : bioText.textContent;

        input.className = "text-sm text-gray-700 italic border border-gray-300 rounded px-2 py-1 w-full bg-white focus:outline-none focus:ring focus:ring-blue-300";

        if (bioWrapper) {
            bioWrapper.replaceChild(input, bioText);
            input.focus();
        }

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                finalize(input.value.trim() || "Share a quick message");
            }
        });

        input.addEventListener("blur", () => {
            finalize(input.value.trim() || "Share a quick message");
        });
    });

    async function finalize(text: string) {
        if (!bioWrapper || !bioText || !currentInput) return;

        // teste filnak
        const newBio = text.trim() || "Share a quick message";
        const userId = localStorage.getItem('userId');
        // maj avec emoticones
        const parsed = parseMessage(newBio);
        bioText.innerHTML = parsed;
        bioWrapper.replaceChild(bioText, currentInput);
        currentInput = null;

        // envoi a la base de donnee
        if (userId) {
            try {
                console.log("user_id: ", userId);
                const response = await fetch(`/api/users/${userId}/bio`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ bio: newBio })
                });

                if (!response.ok) {
                    console.error('Error while saving bio');
                } else {
                    console.log('Bio saved !');
                }
            } catch (error) {
                console.error('Network error :', error);
            }
        }
    }



    // ---------------------------------------------------
    // ----      LOGIQUE DES STATUS DYNAMIQUES        ----
    // ---------------------------------------------------

    const statusSelector = document.getElementById('status-selector');
    const statusDropdown = document.getElementById('status-dropdown');
    const statusText = document.getElementById('current-status-text');
    const statusFrame = document.getElementById('user-status') as HTMLImageElement;

    // statusImages déplacé en HAUT.

    const updateStatusDisplay = (status: string) => {
        if (statusFrame && statusText && statusImages[status] && statusLabels[status]) {
            statusFrame.src = statusImages[status];
            statusText.textContent = statusLabels[status];

            const statusOptions = document.querySelectorAll('.status-options');
            statusOptions.forEach(option => {
                const optionStatus = (option as HTMLElement).dataset.status;
                if (optionStatus === status)
                    option.classList.add('bg-blue-50');
                else
                    option.classList.remove('bg-blue-50');
            });
        }
    };


    const savedStatus = localStorage.getItem('userStatus') || 'available';
    window.addEventListener('storage', (e) => {
        if (e.key === 'userStatus' && e.newValue) {
            updateStatusDisplay(e.newValue);
        }
    });
    updateStatusDisplay(savedStatus);

    if (statusSelector && statusDropdown && statusText && statusFrame) {
        statusSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            statusDropdown.classList.toggle('hidden');
            
            document.getElementById('emoticon-dropdown')?.classList.add('hidden');
            document.getElementById('animation-dropdown')?.classList.add('hidden');
            document.getElementById('font-dropdown')?.classList.add('hidden');
            document.getElementById('background-dropdown')?.classList.add('hidden');
        });

        const statusOptions = document.querySelectorAll('.status-option');

        statusOptions.forEach(option => {
        option.addEventListener('click', async (e) => {
            e.stopPropagation();

            const selectedStatus = (option as HTMLElement).dataset.status;

            if (selectedStatus && statusImages[selectedStatus]) {
                statusFrame.src = statusImages[selectedStatus];
                statusText.textContent = statusLabels[selectedStatus];
                
                localStorage.setItem('userStatus', selectedStatus);

                try {
                    const userId = localStorage.getItem('userId');
                    const response = await fetch(`/api/users/${userId}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: selectedStatus })
                    });
                    
                    if (!response.ok) {
                        console.error('Failed to update status');
                    }
                } catch (error) {
                    console.error('Error updating status:', error);
                }
            }

            statusDropdown.classList.add('hidden');
        });
    });

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!statusDropdown.contains(target) && !statusSelector.contains(target)) {
                statusDropdown.classList.add('hidden');
            }
        });
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
                        author: currentUsername // a remplacer par l'username de l'envoyeur 
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
        console.log("erreur:", data.author)
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
                    chatFrame.classList.add('bg-[#3DB6EC]');
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
    // ----           LOGIQUE DU MENU DE CHAT            ----
    // ---------------------------------------------------

	const chatOptionsButton = document.getElementById('chat-options-button');
	const chatOptionsDropdown = document.getElementById('chat-options-dropdown');

	if (chatOptionsButton && chatOptionsDropdown) {
		chatOptionsButton.addEventListener('click', (e) => {
			e.stopPropagation();
			chatOptionsDropdown.classList.toggle('hidden');

	document.getElementById('emoticon-dropdown')?.classList.add('hidden');
	document.getElementById('animation-dropdown')?.classList.add('hidden');
	document.getElementById('font-dropdown')?.classList.add('hidden');
	document.getElementById('background-dropdown')?.classList.add('hidden');
		});

		document.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (!chatOptionsDropdown.contains(target) && !chatOptionsButton.contains(target)) {
				chatOptionsDropdown.classList.add('hidden');
			}
		});

		document.getElementById('button-invite-game')?.addEventListener('click', (e) => {
			e.stopPropagation();
			const currentChatUser = document.getElementById('chat-header-username')?.textContent;
			console.log(`Inviting ${currentChatUser} to play...`);
			chatOptionsDropdown.classList.add('hidden');
			// ici j'ajoute le lancement de la logique du jeu?
		});

		document.getElementById('button-view-profile')?.addEventListener('click', (e) => {
			e.stopPropagation();
			const currentChatUser = document.getElementById('chat-header-username')?.textContent;
			console.log(`Checking ${currentChatUser} profile...`);
			chatOptionsDropdown.classList.add('hidden');
			// ici j'ajoute le lancement de la logique vu de profile?
		});

		document.getElementById('button-report-user')?.addEventListener('click', (e) => {
			e.stopPropagation();
			const currentChatUser = document.getElementById('chat-header-username')?.textContent;
			console.log(`Reporting ${currentChatUser} ...`);
			chatOptionsDropdown.classList.add('hidden');
			// ici j'ajoute le lancement du reporting?
		});

		document.getElementById('button-block-user')?.addEventListener('click', (e) => {
			e.stopPropagation();
			const currentChatUser = document.getElementById('chat-header-username')?.textContent;
			const connectedUserId = localStorage.getItem('userId');

			if (!currentChatUser || !connectedUserId) return;

			if (confirm(`Are you sure you want to block ${currentChatUser}?`)) {
				try {
					console.log(`Blocking user ${currentChatUser} ...`);
					// const response = await fetch(`/api/users/${connectedUserId}/block`, {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify({ username: currentChatUser })
                    // });
                    
                    // if (response.ok) {
                    //     alert("User blocked.");
                    //     window.location.reload(); // on vide le chat et on supprimme l'amis?
                    // }
				} catch (error) {
					console.error("Eroor blocking user:", error);
				}
			}
			chatOptionsDropdown.classList.add('hidden');
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

                styleButton.addEventListener('click', (e) => {
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

    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (fontDropdown && !fontDropdown.contains(target) && !fontButton?.contains(target)) {
            fontDropdown.classList.add('hidden');
        }
    });



    // ---------------------------------------------------
    // ----         AFFICHAGE DES MESSAGES            ----
    // ---------------------------------------------------


    const addMessage = async (message: string, author: string = "Admin") => { // pour le moment -> admin = fallback
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
            socket.emit("sendWizz", { author: currentUsername});
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

    // Creer un event de creation de channel des qu'on clique sur un ami / qu'on cree une partie

    // a partir du moment ou on appuie sur entree-> envoi de l'input
    messageInput.addEventListener('keyup', (event) => {
        if (event.key == 'Enter' && messageInput.value.trim() != '') {
            const msg_content = messageInput.value;
            // on envoie le message au serveur avec emit
            const username = localStorage.getItem('username');
            const sender_id = Number.parseInt(localStorage.getItem('userId') || "0");
            socket.emit("chatMessage", {
                sender_id: sender_id,
                channel: currentChannel,
                msg_content: msg_content }); // changer le sender_id et recv_id par les tokens
            messageInput.value = ''; // on vide l'input
        }
    });

    // ---------------------------------------------------
    // ----           CHARGEMENT DE LA BIO            ----
    // ---------------------------------------------------
    
    const myUserId = localStorage.getItem('userId'); 
    const userProfileImg = document.getElementById('user-profile') as HTMLImageElement;

    if (myUserId) {
        fetch(`/api/users/${myUserId}`)
            .then(response => {
                if (!response.ok) throw new Error('Cannot get user');
                return response.json();
            })
            .then(user => {
                if (user.bio && bioText) {
                    bioText.innerHTML = parseMessage(user.bio);
                }

                const avatarSrc = user.avatar_url || user.avatar; 
                if (avatarSrc && userProfileImg) {
                    userProfileImg.src = avatarSrc;
                }

                if (user.alias && userConnected) {
                    userConnected.textContent = user.alias;
                    localStorage.setItem('username', user.alias);
                }
            })
            .catch(error => {
                console.error('Cannot load user profile:', error);
            });
    }



    ////////// pour mise a jour cote friend

    // Fonction pour mettre à jour l'interface d'un ami spécifique
    const updateFriendUI = (username: string, newStatus: string) => {
        // 1. Mettre à jour la liste d'amis (le point de couleur)
        const friendItems = document.querySelectorAll('.friend-item');
        friendItems.forEach((item) => {
            const el = item as HTMLElement;
            if (el.dataset.username === username) {
                // Mise à jour du dataset
                el.dataset.status = newStatus;
                
                // Mise à jour visuelle du point (dot)
                const statusImg = el.querySelector('img[alt="status"]') as HTMLImageElement;
                if (statusImg) {
                    statusImg.src = getStatusDot(newStatus);
                }
            }
        });

        // 2. Mettre à jour le header du chat si on est en train de parler à cette personne
        const currentChatUser = document.getElementById('chat-header-username')?.textContent;
        if (currentChatUser === username) {
            const chatHeaderStatus = document.getElementById('chat-header-status') as HTMLImageElement;
            if (chatHeaderStatus && statusImages[newStatus]) {
                chatHeaderStatus.src = statusImages[newStatus];
            }
        }
    };

    // Écoute de l'événement socket pour les changements de statut des amis
    // (Assure-toi que ton backend envoie bien cet événement avec { username, status })
    socket.on("friendStatusUpdate", (data: { username: string, status: string }) => {
        console.log(`Status update for ${data.username}: ${data.status}`);
        updateFriendUI(data.username, data.status);
    });
    
    // Si ton backend utilise "userConnected" pour dire "un ami s'est connecté", tu peux aussi l'utiliser :
    socket.on("userConnected", (data: { username: string, status: string }) => {
        // Si c'est moi, je mets à jour mon propre affichage
        if (data.username === currentUsername) {
            updateStatusDisplay(data.status);
        } else {
            // Sinon c'est un ami
            updateFriendUI(data.username, data.status);
        }
    });
}