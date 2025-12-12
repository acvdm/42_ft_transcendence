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
        const friend = e.detail;
        
        const friendshipId = friend.friendshipId;
        currentChatFriendId = friend.id;

        console.log("Ami sélectionné:", friend.alias, "Friendship ID:", friendshipId);
        const myId = parseInt(localStorage.getItem('userId') || "0");
        const ids = [myId, friend.id].sort((a, b) => a - b);
        const channelKey = `channel_${ids[0]}_${ids[1]}`;

        const chatPlaceholder = document.getElementById('chat-placeholder');
        const channelChat = document.getElementById('channel-chat');
        if (chatPlaceholder) chatPlaceholder.classList.add('hidden');
        if (channelChat) channelChat.classList.remove('hidden');

        const headerName = document.getElementById('chat-header-username');
        const headerAvatar = document.getElementById('chat-header-avatar') as HTMLImageElement;
        const headerStatus = document.getElementById('chat-header-status') as HTMLImageElement;
        const headerBio = document.getElementById('chat-header-bio');

        if (headerName) headerName.textContent = friend.alias;
        if (headerBio) headerBio.innerHTML = parseMessage(friend.bio);

        if (headerAvatar) {
            const avatarSrc = friend.avatar || friend.avatar_url || '/assets/profile/default.png';
            headerAvatar.src = avatarSrc;
        }

        if (headerStatus) {
            headerStatus.src = statusImages[friend.status] || statusImages['invisible'];
        }
        chat.joinChannel(channelKey, friendshipId);
    });

    // ouverture de la modale
    const viewProfileButton = document.getElementById('button-view-profile');
    
    viewProfileButton?.addEventListener('click', () => {
        document.getElementById('chat-options-dropdown')?.classList.add('hidden');
        if (currentChatFriendId) { // est-ce que l'ami exsite?
            friendProfileModal.open(currentChatFriendId);
        }
    });


    
}