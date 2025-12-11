import SocketService from "../services/SocketService";
import { emoticons, animations, icons } from "./Data";
import { parseMessage } from "./ChatUtils";

export class Chat {
    private socket: any;
    private messagesContainer: HTMLElement | null;
    private messageInput: HTMLInputElement | null;
    private wizzContainer: HTMLElement | null;
    private currentChannel: string = "general";
    private shakeTimeout: number | undefined;

    constructor() {
        this.socket = SocketService.getInstance().socket;
        this.messagesContainer = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('chat-input') as HTMLInputElement;
        this.wizzContainer = document.getElementById('wizz-container');
    }

    public init() {
        if (!this.socket) return;
        
        this.setupSocketEvents();
        this.setupInputListeners();
        this.setupWizz();
        this.setupTools(); // Animations, Fonts, Emoticons, Backgrounds
    }

    public joinChannel(channelKey: string) {
        this.currentChannel = channelKey;
        this.socket.emit("joinChannel", channelKey);
        
        // Reset affichage
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '';
        }
    }

    // ---------------------------------------------------
    // ----      MISE EN ÉCOUTE DES SOCKETS           ----
    // ---------------------------------------------------

    private setupSocketEvents() {
        this.socket.on("connect", () => {
            this.addMessage("Connected to chat server!", "System");
        });

        // on va écouter l'événement chatMessage venant du serveur
        // le backend va renvoyer data, il devrait plus renvoyer message: "" author: ""
        this.socket.on("chatMessage", (data: { channelKey: string, msg_content: string, sender_alias: string }) => {
            this.addMessage(data.msg_content, data.sender_alias);
        });

        this.socket.on("msg_history", (data: { channelKey: string, msg_history: any[] }) => {
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

        // reception ici du serveur au client
        this.socket.on("receivedWizz", (data: { author: string }) => {
            // on affiche le message -> xx send a nudge (poke?)
            this.addMessage(`<strong>${data.author} sent a nudge</strong>`, "System");
            // on declenche la secousse
            this.shakeElement(this.wizzContainer, 3000);
        });

        this.socket.on("receivedAnimation", (data: { animationKey: string, author: string }) => {
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
                this.addCustomContent(animationHTML);
            } else {
                this.addMessage(`Animation inconnue (${animationKey}) reçue de ${author}.`, "Système");
            }
        });

        this.socket.on("disconnected", () => {
            this.addMessage("Disconnected from chat server!", "System");
        });
    }

    // ---------------------------------------------------
    // ----           GESTION DE L'INPUT              ----
    // ---------------------------------------------------

    private setupInputListeners() {
        if (!this.messageInput) return;

        // a partir du moment ou on appuie sur entree-> envoi de l'input
        this.messageInput.addEventListener('keyup', (event) => {
            if (event.key == 'Enter' && this.messageInput?.value.trim() != '') {
                const msg_content = this.messageInput.value;
                // on envoie le message au serveur avec emit
                const sender_alias = localStorage.getItem('username');
                const sender_id = Number.parseInt(localStorage.getItem('userId') || "0");
                
                this.socket.emit("chatMessage", {
                    sender_id: sender_id,
                    sender_alias: sender_alias,
                    channel_key: this.currentChannel,
                    msg_content: msg_content 
                });
                this.messageInput.value = ''; // on vide l'input
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
                // on envois l'element snedWizz au serveur
                this.socket.emit("sendWizz", { author: currentUsername });
                // secousse pour l'expediteur et le receveur
                this.shakeElement(this.wizzContainer, 500);
            });
        }
    }

    // délcencher la secousse 
    private shakeElement(element: HTMLElement | null, duration: number = 500) {
        if (!element) return;

        // annuler le tem,ps de la secousse rpecedence
        if (this.shakeTimeout) clearTimeout(this.shakeTimeout);

        // on applique la classe d'animation avec le css personnalisé -> keyframe
        element.classList.remove('wizz-shake');
        void element.offsetWidth; // force d'un reflow
        element.classList.add('wizz-shake');

        // on retire la classe une fois que l'amination est terminé
        this.shakeTimeout = window.setTimeout(() => {
            element.classList.remove('wizz-shake');
            this.shakeTimeout = undefined;
        }, duration);

        // on essaie de mettre un son
        try {
            const wizzSound = new Audio('/assets/chat/wizz_sound.mp3');
            wizzSound.play().catch(e => console.log("Could not play wizz sound:", e.message));
        } catch (e) {
            console.log("Audio API error:", (e as Error).message);
        }
    }

    // ---------------------------------------------------
    // ----         AFFICHAGE DES MESSAGES            ----
    // ---------------------------------------------------

    private addMessage(message: string, author: string) {
        if (!this.messagesContainer) return;
        const msgElement = document.createElement('p');
        msgElement.className = "mb-1";
        
        // on securise le texte et on parse les emoticones
        const contentEmoticons = parseMessage(message);
        
        msgElement.innerHTML = `<strong>${author} said:</strong><br> ${contentEmoticons}`;
        this.messagesContainer.appendChild(msgElement);
        // rajouter un scroll automatique vers le bas
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
                    this.socket.emit("sendAnimation", {
                        animationKey: key,
                        author: currentUsername 
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
            
            // Tes boutons (Code existant conservé)
            document.getElementById('button-invite-game')?.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log("Invite clicked");
                chatOptionsDropdown.classList.add('hidden');
            });
            document.getElementById('button-view-profile')?.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log("Profile clicked");
                chatOptionsDropdown.classList.add('hidden');
            });
            document.getElementById('button-report-user')?.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log("Report clicked");
                chatOptionsDropdown.classList.add('hidden');
            });
            document.getElementById('button-block-user')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentChatUser = document.getElementById('chat-header-username')?.textContent;
                if (currentChatUser && confirm(`Block ${currentChatUser}?`)) {
                    console.log(`Blocking ${currentChatUser}`);
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
}