import htmlContent from "./HomePage.html";
import SocketService from "../services/SocketService";
import { FriendList } from "../components/FriendList";
import { UserProfile } from "../components/UserProfile";
import { Chat } from "../components/Chat";
import { statusImages } from "../components/Data";
import { FriendProfileModal } from "../components/FriendProfileModal";
import { parseMessage } from "../components/ChatUtils";

export function render(): string {
    return htmlContent;
}

export function afterRender(): void {
    const socketService = SocketService.getInstance();
    socketService.connect();

    const friendList = new FriendList();
    
    friendList.init();

    const userProfile = new UserProfile();
    userProfile.init();

    const chat = new Chat();
    chat.init();

    // modale pour voir le profil de son ami
    const friendProfileModal = new FriendProfileModal();
    let currentChatFriendId: number | null = null;

    // clic sur l'ami
    window.addEventListener('friendSelected', (e: any) => {
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

        // *** Fonction qui génère une erreur ***
        // if (headerBio) headerBio.innerHTML = parseMessage(friend.bio);

        if (headerAvatar) {
            const avatarSrc = friend.avatar || friend.avatar_url || '/assets/profile/default.png';
            headerAvatar.src = avatarSrc;
        }

        if (headerStatus) {
            headerStatus.src = statusImages[friend.status] || statusImages['invisible'];
        }
        console.log("friendship homepage:", friendshipId);
        chat.joinChannel(channelKey, friendshipId);

    });

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
            // 1er argument : l'état qu'on veut récupérer dans main.ts
            window.history.pushState({ gameMode: 'local' }, '', '/game');
            
            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        });
    }

    // Gestion du bouton REMOTE : on passe { gameMode: 'remote' } dans le pushState
    const remoteGameButton = document.getElementById('remote-game');
    if (remoteGameButton) {
        remoteGameButton.addEventListener('click', () => {
            console.log("Lancement d'une partie remote...");
            window.history.pushState({ gameMode: 'remote' }, '', '/game');

            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        });
    }

    
}