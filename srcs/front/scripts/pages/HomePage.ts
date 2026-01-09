import htmlContent from "./HomePage.html";
import SocketService from "../services/SocketService";
import { FriendList } from "../components/FriendList";
import { UserProfile } from "../components/UserProfile";
import { Chat } from "../components/Chat";
import { statusImages } from "../components/Data";
import { FriendProfileModal } from "../components/FriendProfileModal";
import { parseMessage } from "../components/ChatUtils";

// ajout de variables globales pour stocker les instances actives de la page
// init() interval est appele a chaque fois auon va sur la HomePage
// ajouts car besoin de clean pour quil n'y ai pas plusieurs process 
// qui s'accumulent quand on change de page et quon revient sur la homePage

let friendListInstance: FriendList | null = null; // on donne atomatiquement null comme valeur a la variable au depart
let chatInstance: Chat | null = null;
// fonciton qui prend en argument (e) nimporte quel type et ne renvoit rien 
let friendSelectedHandler: ((e: any) => void) | null = null; // pour stocker la fonction de lecouteur


export function render(): string {
    return htmlContent;
}

export function cleanup() {
    // arrete setInterval et ses notifications
    if (friendListInstance) {
        friendListInstance.destroy();
        friendListInstance = null;
    }

    // supprimer l'ecouteur d'evenement global sur la fenetre
    // sinon a chaque viisite sur Home on ajoute un nouvel ecouteur
    if (friendSelectedHandler){
        window.removeEventListener('friendSelected', friendSelectedHandler);
        friendSelectedHandler = null;
    }

    if (chatInstance){
        chatInstance.destroy();
        chatInstance = null;
    }

    // detacher les ecouteurs socket specifiques a cette page
    // sinon quand on revient le socket declenche l'evenement x fois
    const socketService = SocketService.getInstance();
    const chatSocket = socketService.getChatSocket();
    if (chatSocket) {
        chatSocket.off('friendProfileUpdated');
        chatSocket.off('friendStatusUpdate');
    }
}

export function afterRender(): void {
    const socketService = SocketService.getInstance();
    // socketService.connect();

    socketService.connectChat();

    friendListInstance = new FriendList();
    
    friendListInstance.init();

    const userProfile = new UserProfile();
    userProfile.init();

    chatInstance = new Chat();
    chatInstance.init();

    // modale pour voir le profil de son ami
    const friendProfileModal = new FriendProfileModal();
    let currentChatFriendId: number | null = null;

    const chatSocket = socketService.getChatSocket();

    if (chatSocket) {
        chatSocket.on('friendProfileUpdated', (data: any) => {
            console.log("Mise à jour reçue pour :", data.username);

            if (currentChatFriendId === data.userId) {
                
                const headerBio = document.getElementById('chat-header-bio');
                if (headerBio && data.bio) {
                    headerBio.innerHTML = parseMessage(data.bio);
                }

                const headerAvatar = document.getElementById('chat-header-avatar') as HTMLImageElement;
                if (headerAvatar && data.avatar) {
                    headerAvatar.src = data.avatar;
                }
                
                const headerName = document.getElementById('chat-header-username');
                if (headerName && data.username) {
                    headerName.textContent = data.username;
                }
            }
        });

        chatSocket.on("friendStatusUpdate", (data: { username: string, status: string }) => {
                // Le header du chat affiche-t-il le statut ? Oui, via 'chat-header-status'
                // Mais friendStatusUpdate ne renvoie souvent que le username, pas l'ID.
                // Il faut vérifier si c'est l'ami courant.
                
                const headerName = document.getElementById('chat-header-username');
                if (headerName && headerName.textContent === data.username) {
                    const headerStatus = document.getElementById('chat-header-status') as HTMLImageElement;
                    if (headerStatus && statusImages[data.status]) {
                        headerStatus.src = statusImages[data.status];
                    }
                }
            });
    }



    // clic sur l'ami
    // MODIF POUR PB DE REFRESH
    friendSelectedHandler = (e: any) => {
        const { friend, friendshipId } = e.detail;

        currentChatFriendId = friend.id;
        console.log("Ami sélectionné:", friend.alias, "Friendship ID:", friendshipId);
        const myId = parseInt(localStorage.getItem('userId') || "0");
        const ids = [myId, friend.id].sort((a, b) => a - b);
        const channelKey = `channel_${ids[0]}_${ids[1]}`;
        console.log("channelKey: ", channelKey);

        const chatPlaceholder = document.getElementById('chat-placeholder');
        const channelChat = document.getElementById('channel-chat');
        if (chatPlaceholder) chatPlaceholder.classList.add('hidden');
        if (channelChat) channelChat.classList.remove('hidden');
        const headerName = document.getElementById('chat-header-username');
        const headerAvatar = document.getElementById('chat-header-avatar') as HTMLImageElement;
        const headerStatus = document.getElementById('chat-header-status') as HTMLImageElement;
        const headerBio = document.getElementById('chat-header-bio');
        if (headerName) headerName.textContent = friend.alias;

        if (headerBio) headerBio.innerHTML = parseMessage(friend.bio || '');

        if (headerAvatar) {
            const avatarSrc = friend.avatar || friend.avatar_url || '/assets/profile/default.png';
            headerAvatar.src = avatarSrc;
        }

        if (headerStatus) {
            headerStatus.src = statusImages[friend.status] || statusImages['invisible'];
        }
        console.log("friendship homepage:", friendshipId);
        // chat.joinChannel(channelKey, friendshipId);

        if (chatInstance) {
            chatInstance.joinChannel(channelKey, friendshipId, friend.id);
        }

    };

    window.addEventListener('friendSelected', friendSelectedHandler);

    // ouverture de la modale
    const viewProfileButton = document.getElementById('button-view-profile');
    
    viewProfileButton?.addEventListener('click', () => {
        document.getElementById('chat-options-dropdown')?.classList.add('hidden');
        console.log("current chat friend id:", currentChatFriendId);
        if (currentChatFriendId) { // est-ce que l'ami exsite?
            friendProfileModal.open(currentChatFriendId);
        }
    });

    // on fait en sorte que le bouton soit cliquable pour amener sur la page de jeu local
    const localGameButton = document.getElementById('local-game');
    if (localGameButton) {
        localGameButton.addEventListener('click', () => {
            console.log("Lancement d'une partie locale...");
            window.history.pushState({ gameMode: 'local' }, '', '/game');
            
            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        });
    }

    const remoteGameButton = document.getElementById('remote-game');
    if (remoteGameButton) {
        remoteGameButton.addEventListener('click', () => {
            console.log("Lancement d'une partie remote...");
            window.history.pushState({ gameMode: 'remote' }, '', '/game');

            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        });
    }


    const tournamentGameButton = document.getElementById('tournament-game');
    if (tournamentGameButton) {
        tournamentGameButton.addEventListener('click', () => {
            console.log("Lancement d'une partie en tournoi...");
            window.history.pushState({ gameMode: 'tournament' }, '', '/game');

            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        });
    }
    
}