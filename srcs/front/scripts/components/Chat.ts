import SocketService from "../services/SocketService";
import { emoticons, animations, icons } from "./Data";
import { parseMessage } from "./ChatUtils";
import { fetchWithAuth } from "../pages/api";
import { Socket } from "socket.io-client";

export class Chat {
    private chatSocket: Socket | null = null;
    private gameSocket: Socket | null = null;
    private messagesContainer: HTMLElement | null;
    private messageInput: HTMLInputElement | null;
    private wizzContainer: HTMLElement | null;
    private currentChannel: string = "general";
    private currentFriendshipId: number | null = null;
    private currentFriendId: number | null = null;
    private shakeTimeout: number | undefined;

    constructor() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('chat-input') as HTMLInputElement;
        this.wizzContainer = document.getElementById('wizz-container');
    }

    public init() {
        const socketService = SocketService.getInstance();

        socketService.connectChat();
        socketService.connectGame()

        this.chatSocket = socketService.getChatSocket();
        this.gameSocket = socketService.getGameSocket();

        if (!this.gameSocket) {
            console.log("Gamesocket does not exist");
        }
        if (!this.chatSocket) {
            console.error("Chat: Impossible to retrieve chat socket (not connected).");
            return;
        }

        this.setupSocketEvents();
        this.setupInputListeners();
        this.setupWizz();
        this.setupTools();
    }
    

    public joinChannel(channelKey: string, friendshipId?: number, friendId?: number) {
        this.currentChannel = channelKey;
        this.currentFriendshipId = friendshipId || null;
        this.currentFriendId = friendId || null;

        if (this.chatSocket) {
            this.chatSocket.emit("joinChannel", channelKey);
        }
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
    }

    // ---------------------------------------------------
    // ----      MISE EN ÉCOUTE DES SOCKETS           ----
    // ---------------------------------------------------

    private setupSocketEvents() {
        this.chatSocket.on("connect", () => {
            this.addMessage("You can now chat with your friend!", "System");
        });

        this.chatSocket.on("chatMessage", (data: { channelKey: string, msg_content: string, sender_alias: string }) => {
            this.addMessage(data.msg_content, data.sender_alias);
        });

        this.chatSocket.on("msg_history", (data: { channelKey: string, msg_history: any[] }) => {
            if (this.messagesContainer) {
                this.messagesContainer.innerHTML = '';
                if (data.msg_history && data.msg_history.length > 0) {
                    data.msg_history.forEach((msg) => {
                        this.addMessage(msg.msg_content, msg.sender_alias);
                    });
                } else {
                    console.log("No former message in this channel");
                }
            }
        });

        this.chatSocket.on("systemMessage", (data: { content: string}) => {
            this.addSystemMessage(data.content);
        })

        this.chatSocket.on("receivedWizz", (data: { author: string, channel_key: string }) => {
            
            if (data.channel_key && data.channel_key !== this.currentChannel) {
                return;
            }
            
            const currentUser = localStorage.getItem('username');
            this.addMessage(`[b]${data.author} sent a nudge[/b]`, "System");

            if (data.author !== currentUser) {
                this.shakeElement(this.wizzContainer, 3000);
            }
        });

        this.chatSocket.on("receivedAnimation", (data: { animationKey: string, author: string }) => {
            
            const { animationKey, author } = data;
            const imgUrl = animations[animationKey];
            
            if (imgUrl) {
                const animationHTML = `
                    <div>
                        <strong>${author} said:</strong><br>
                        <img src="${imgUrl}" alt="${animationKey}">
                    </div>
                `;
                this.addCustomContent(animationHTML);
            } else {
                this.addMessage(`Animation inconnue (${animationKey}) reçue de ${author}.`, "Système");
            }
        });

        this.chatSocket.on("disconnected", () => {
            this.addMessage("Disconnected from chat server!", "System");
        });
    }

    // ---------------------------------------------------
    // ----           GESTION DE L'INPUT              ----
    // ---------------------------------------------------

    private setupInputListeners() {
        if (!this.messageInput) {
            return;
        }

        this.messageInput.addEventListener('keyup', (event) => {
            if (event.key == 'Enter' && this.messageInput?.value.trim() != '') {
                
                const msg_content = this.messageInput.value;
                const sender_alias = localStorage.getItem('username');
                const sender_id = Number.parseInt(localStorage.getItem('userId') || "0");
                
                this.chatSocket.emit("chatMessage", {
                    sender_id: sender_id,
                    sender_alias: sender_alias,
                    channel_key: this.currentChannel,
                    msg_content: msg_content 
                });
                this.messageInput.value = '';
            }
        });
    }

    // ---------------------------------------------------
    // ----            LOGIQUE DU WIZZ                ----
    // ---------------------------------------------------

    private setupWizz() {
        const wizzButton = document.getElementById('send-wizz');
        if (wizzButton) {
            wizzButton.addEventListener('click', () => {
                const currentUsername = localStorage.getItem('username');
                this.chatSocket.emit("sendWizz", { author: currentUsername, channel_key: this.currentChannel });
                this.shakeElement(this.wizzContainer, 500);
            });
        }
    }

    public emitWizzOnly() {
        if (!this.chatSocket) {
            return;
        }
        const currentUsername = localStorage.getItem('username');
        this.chatSocket.emit("sendWizz", { author: currentUsername, channel_key: this.currentChannel });
    }

    public shakeElement(element: HTMLElement | null, duration: number = 500) {
        if (!element) {
            return;
        }
        if (this.shakeTimeout) {
            clearTimeout(this.shakeTimeout);
        }

        element.classList.remove('wizz-shake');
        void element.offsetWidth;
        element.classList.add('wizz-shake');

        this.shakeTimeout = window.setTimeout(() => {
            element.classList.remove('wizz-shake');
            this.shakeTimeout = undefined;
        }, duration);

        try {
            const wizzSound = new Audio('/assets/chat/wizz_sound.mp3');
            wizzSound.play().catch(e => console.log("Could not play wizz sound:", e.message));
        } catch (e) {
            console.log("Audio API error:", (e as Error).message);
        }
    }

    public getWizzContainer(): HTMLElement | null {
        return this.wizzContainer;
    }

    // ---------------------------------------------------
    // ----         AFFICHAGE DES MESSAGES            ----
    // ---------------------------------------------------


    public sendSystemNotification(message: string) {
        if (this.chatSocket) {
            this.chatSocket.emit("sendSystemMessage", {
                channel_key: this.currentChannel,
                content: message
            });
        } else {
            this.addSystemMessage(message);
        }
    }
    
    public addSystemMessage(message: string) {
        this.addMessage(`[b]${message}[/b]`, "System");
    }

//faustine
    private addMessage(message: string, author: string) {
        if (!this.messagesContainer) return;
        const msgElement = document.createElement('div'); // changement par div pour mettre un bouton
        msgElement.className = "mb-2 p-2 rounded bg-opacity-20 hover:bg-opacity-30 transition";

        ///// DÉTECTION DE L'INVITATION
        const inviteRegex = /\[GAME_INVITE\|(\d+)\]/;
        const match = message.match(inviteRegex);

        if (match) {
            // invitation
            const friendshipId = match[1];
            const isMe = author === localStorage.getItem('username');
            
            // style different selon qui invite
            msgElement.classList.add(isMe ? 'bg-blue-100' : 'bg-green-100');

            //on store le private id dans session storage pour qu'il soit pas garde quand on rejoins une autre roo,
            msgElement.innerHTML = `
                <div class="flex flex-col gap-2">
                    <strong>${author}</strong> veut jouer à Pong ! 🏓<br>
                    <button 
                        class="bg-blue-500 hover:bg-blue-600 text-black font-bold py-1 px-3 rounded shadow-md text-xs transition-transform transform active:scale-95"
                        onclick="
                            sessionStorage.setItem('privateGameId', '${friendshipId}'); 
                            window.history.pushState({ gameMode: 'remote' }, '', '/game');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                        "
                    >
                        ${isMe ? 'Join my waitroom' : 'Accept the match'}
                    </button>
                </div>
            `;
        } else {
            // pour envoyer un message normal
            msgElement.classList.add('bg-white'); // ou transparent a tester
            const contentEmoticons = parseMessage(message);
            msgElement.innerHTML = `<strong>${author} said:</strong><br> ${contentEmoticons}`;
        }

        this.messagesContainer.appendChild(msgElement);
        this.scrollToBottom();
    }

    private addCustomContent(htmlContent: string) {
        if (!this.messagesContainer) return;
        const msgElement = document.createElement('div');
        msgElement.className = "mb-1";
        msgElement.innerHTML = htmlContent;
        this.messagesContainer.appendChild(msgElement);
        this.scrollToBottom();
    }

    private scrollToBottom() {
        if (this.messagesContainer) {
            // TIMEOUT POUR AVOIR LE TMEPS DE calculer la hauteur 
            setTimeout(() => {
                if (this.messagesContainer)
                    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 50);
        }
    }

    // ---------------------------------------------------
    // ----      OUTILS (EMOTICONES, FONTS...)        ----
    // ---------------------------------------------------

    private setupTools() {
        // LOGIQUE D'ÉMOTICONES
        const emoticonButton = document.getElementById('select-emoticon');
        const emoticonDropdown = document.getElementById('emoticon-dropdown');
        const emoticonGrid = document.getElementById('emoticon-grid');

        if (emoticonButton && emoticonDropdown && emoticonGrid) {
            emoticonGrid.innerHTML = '';
            // remplissage de la grille des emoticones dans le menu
            const emoticonsByUrl = new Map<string, string[]>();
            const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);

            sortedKeys.forEach(key => {
                const imgUrl = emoticons[key];
                if (!emoticonsByUrl.has(imgUrl)) emoticonsByUrl.set(imgUrl, []);
                emoticonsByUrl.get(imgUrl)!.push(key);
            });
            
            emoticonsByUrl.forEach((keys, imgUrl) => {
                const primaryKey = keys[0]; 
                const tooltipTitle = keys.join(' | ');
                const emoticonItem = document.createElement('div');
                emoticonItem.className = 'cursor-pointer w-7 h-7 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100';
                emoticonItem.innerHTML = `<img src="${imgUrl}" alt="${primaryKey}" title="${tooltipTitle}" class="w-[20px] h-[20px]">`;

                // gestion du clic sur l'emoticone dans le menu
                emoticonItem.addEventListener('click', (event) => {
                    event.stopPropagation();
                    this.insertText(primaryKey + ' '); 
                    emoticonDropdown.classList.add('hidden'); // on cache le menu apres la selection
                });
                emoticonGrid.appendChild(emoticonItem);
            });

            // afficher et masquer le menu au clic du bouton 
            emoticonButton.addEventListener('click', (e) => {
                e.stopPropagation();
                emoticonDropdown.classList.toggle('hidden');
                this.closeOtherMenus('emoticon');
            });
            document.addEventListener('click', (e) => {
                if (!emoticonDropdown.contains(e.target as Node) && !emoticonButton.contains(e.target as Node)) {
                    emoticonDropdown.classList.add('hidden');
                }
            });
        }

        // LOGIQUE D'ANIMATION
        const animationButton = document.getElementById('select-animation');
        const animationDropdown = document.getElementById('animation-dropdown');
        const animationGrid = document.getElementById('animation-grid');

        if (animationButton && animationDropdown && animationGrid) {
            // on rempli la grille des animations
            animationGrid.innerHTML = '';
            Object.keys(icons).forEach(key => {
                const imgUrl = icons[key];
                const animationItem = document.createElement('div');
                animationItem.className = 'cursor-pointer-w10 h-10 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100';
                animationItem.innerHTML = `<img src="${imgUrl}" alt="${key}" title="${key}" class="w-[32px] h-[32px] object-contain">`;

                // clic sur l'anumation
                animationItem.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const currentUsername = localStorage.getItem('username');
                    // envoi de l'animation via la sockettt

                    this.chatSocket.emit("sendAnimation", {
                        animationKey: key,
                        author: currentUsername,
                        channel_key: this.currentChannel
                    });
                    animationDropdown.classList.add('hidden');
                });
                animationGrid.appendChild(animationItem);
            });

            animationButton.addEventListener('click', (e) => {
                e.stopPropagation();
                animationDropdown.classList.toggle('hidden');
                this.closeOtherMenus('animation');
            });
            document.addEventListener('click', (e) => {
                if (!animationDropdown.contains(e.target as Node) && !animationButton.contains(e.target as Node)) {
                    animationDropdown.classList.add('hidden');
                }
            });
        }

        // LOGIQUE DE POLICE
        const fontButton = document.getElementById('change-font');
        const fontDropdown = document.getElementById('font-dropdown');
        const fontGrid = document.getElementById('font-grid');

        if (fontButton && fontDropdown && fontGrid) {
            // remplissage de la grille
            fontGrid.innerHTML = '';
            
            const colors = ['#000000', '#F42F25', '#F934FB', '#F76D2A', '#217F1C', '#3019F7', '#F9CA37', '#42FB37'];
            colors.forEach(color => {
                const colorButton = document.createElement('div');
                colorButton.className = 'w-6 h-6 cursor-pointer border border-gray-300 hover:border-blue-500 hover:shadow-sm rounded-[2px]';
                colorButton.style.backgroundColor = color;
                colorButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.wrapSelection(color, true);
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

            styles.forEach(style => {
                const styleButton = document.createElement('div');
                styleButton.className = 'w-6 h-6 flex justify-center items-center cursor-pointer border border-transparent hover:bg-blue-50 hover:border-blue-200 rounded-[2px] transition-all';
                styleButton.innerHTML = `<img src="/assets/chat/${style.icon}" alt="${style.title}" class="w-[14px] h-[14px]">`;
                styleButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.wrapSelection(style.tag, false);
                    fontDropdown.classList.add('hidden');
                });
                fontGrid.appendChild(styleButton);
            });

            fontButton.addEventListener('click', (e) => {
                e.stopPropagation();
                fontDropdown.classList.toggle('hidden');
                this.closeOtherMenus('font');
            });
            document.addEventListener('click', (e) => {
                if (!fontDropdown.contains(e.target as Node) && !fontButton.contains(e.target as Node)) {
                    fontDropdown.classList.add('hidden');
                }
            });
        }

        // LOGIQUE DE BACKGROUND
        const bgButton = document.getElementById('select-background');
        const bgDropdown = document.getElementById('background-dropdown');
        const chatFrame = document.getElementById('chat-frame');
        const bgOptions = document.querySelectorAll('.bg-option');

        if (bgButton && bgDropdown && chatFrame) {
            // ouverture fermeture du menu
            bgButton.addEventListener('click', (e) => {
                e.stopPropagation(); // on evite la fermeture immediate
                bgDropdown.classList.toggle('hidden');
                this.closeOtherMenus('background');
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
                if (!bgDropdown.contains(e.target as Node) && !bgButton.contains(e.target as Node)) {
                    bgDropdown.classList.add('hidden');
                }
            });
        }

        // LOGIQUE DU MENU DE CHAT
        const chatOptionsButton = document.getElementById('chat-options-button');
        const chatOptionsDropdown = document.getElementById('chat-options-dropdown');

        if (chatOptionsButton && chatOptionsDropdown) {
            chatOptionsButton.addEventListener('click', (e) => {
                e.stopPropagation();
                chatOptionsDropdown.classList.toggle('hidden');
                this.closeOtherMenus('options');
            });
            document.addEventListener('click', (e) => {
                if (!chatOptionsDropdown.contains(e.target as Node) && !chatOptionsButton.contains(e.target as Node)) {
                    chatOptionsDropdown.classList.add('hidden');
                }
            });
            
            //faustine
            // GESTION DU BOUTON D'INVITATION
            document.getElementById('button-invite-game')?.addEventListener('click', (e) => {
                e.stopPropagation();

                if (this.currentFriendId && this.currentFriendshipId) // on check aussi que le friendship id est pas nul
                {
                    const myName = localStorage.getItem('username');
                    const sender_id = Number.parseInt(localStorage.getItem('userId') || "0");
            

                    if (this.chatSocket && this.chatSocket.connected) {
                        console.log("chatSocket connected");
                        const inviteCode = `[GAME_INVITE|${this.currentFriendshipId}]`; // l'id de la room correspond au friendship id
                        this.chatSocket.emit("chatMessage", {
                            sender_id: sender_id,
                            sender_alias: myName,
                            channel_key: this.currentChannel,
                            msg_content: inviteCode // ici au lieu du message on "envois" le code d'invitation
                        });
                    } else {
                        console.log("chatSocket disconnected");
                    }
                } else {
                    console.error("Game socket not connected", this.gameSocket)
                    this.addSystemMessage("Error: Game server not reachable.");
                }

            // document.getElementById('button-view-profile')?.addEventListener('click', (e) => {
            //     e.stopPropagation();
            //     console.log("Profile clicked");
                chatOptionsDropdown.classList.add('hidden');
            });

            ////////////// ICI POUR LA LOGIQUE DE BLOCK/BLOCAGE D'UN AMI
            document.getElementById('button-block-user')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                console.log("friendhsop id:", this.currentFriendshipId);
                if (!this.currentFriendshipId) { // est-ce qu'on a bien un id d'amitié entre les deux
                    console.error("Cannot block: no friendship id associated to this conv");
                    chatOptionsDropdown.classList.add('hidden'); // on retire le dropdown
                    return ;
                }

                const currentChatUser = document.getElementById('chat-header-username')?.textContent;
                if (currentChatUser && confirm(`Are you sure you want to block ${currentChatUser} ?`)) { // on confirme au cas ou
                    try {
                        const userId = localStorage.getItem('userId');
                        const response = await fetchWithAuth(`api/user/${userId}/friendships/${this.currentFriendshipId}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: 'blocked' })
                        });

                        if (response.ok) {
                            console.log(`User ${currentChatUser} blocked successfully`);
                            const event = new CustomEvent('friendBlocked', { 
                                detail: { username: currentChatUser } 
                            });
                            window.dispatchEvent(event);

                            // disparaission de laconversation
                            if (this.messagesContainer) {
                                this.messagesContainer.innerHTML = '';
                                
                                const infoMsg = document.createElement('div');
                                infoMsg.className = "text-center text-gray-400 text-sm mt-10";
                                infoMsg.innerText = "Conversation deleted (User blocked).";
                                this.messagesContainer.appendChild(infoMsg);
                            }

                            // on vide l'input
                            if (this.messageInput) {
                                this.messageInput.value = "";
                                this.messageInput.disabled = true;
                                this.messageInput.placeholder = "You blocked this user.";
                            }

                            this.currentChannel = "";
                            this.currentFriendshipId = null;
                        } else {
                            console.error("Network error while blocking");
                            alert("Error while blocking");
                        }
                    } catch (error) {
                        console.error("Networik error:", error);
                    }
                }
                chatOptionsDropdown.classList.add('hidden');
            });
        }
    }

    private closeOtherMenus(current: string) {
        if (current !== 'emoticon') document.getElementById('emoticon-dropdown')?.classList.add('hidden');
        if (current !== 'animation') document.getElementById('animation-dropdown')?.classList.add('hidden');
        if (current !== 'font') document.getElementById('font-dropdown')?.classList.add('hidden');
        if (current !== 'background') document.getElementById('background-dropdown')?.classList.add('hidden');
        if (current !== 'options') document.getElementById('chat-options-dropdown')?.classList.add('hidden');
        // on ferme aussi les menus amis et status
        document.getElementById('add-friend-dropdown')?.classList.add('hidden');
        document.getElementById('status-dropdown')?.classList.add('hidden');
    }

    // insertion de la clé de l'emoticon a la position actuelle du cursor dans l'unpout
    private insertText(text: string) {
        if (!this.messageInput) return;
        const start = this.messageInput.selectionStart ?? this.messageInput.value.length;
        const end = this.messageInput.selectionEnd ?? this.messageInput.value.length;
        
        const newValue = this.messageInput.value.substring(0, start) + text + this.messageInput.value.substring(end);
        this.messageInput.value = newValue;
        
        const newPos = start + text.length;
        this.messageInput.setSelectionRange(newPos, newPos);
        this.messageInput.focus();
    }

    // insertion des balises autour du texte selectionne
    private wrapSelection(tagOrColor: string, isColor: boolean) {
        if (!this.messageInput) return;
        
        const start = this.messageInput.selectionStart ?? this.messageInput.value.length;
        const end = this.messageInput.selectionEnd ?? this.messageInput.value.length;
        const selectedText = this.messageInput.value.substring(start, end);

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

        this.messageInput.value = this.messageInput.value.substring(0, start) + replacement + this.messageInput.value.substring(end);
        
        const newCursorPos = selectedText.length > 0 ? start + replacement.length : start + cursorOffset;
        this.messageInput.setSelectionRange(newCursorPos, newCursorPos); 
        this.messageInput.focus();
    }

    public destroy() {
        if (this.socket) {
            this.socket.off("connect");
            this.socket.off("chatMessage");
            this.socket.off("msg_history"); // ajout
            this.socket.off("receivedWizz");
            this.socket.off("receivedAnimation");
            this.socket.off("systemMessage");
            this.socket.off("disconnected");
        }
    }
}