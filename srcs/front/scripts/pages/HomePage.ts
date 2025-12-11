import htmlContent from "./HomePage.html";
import SocketService from "../services/SocketService";
import { FriendList } from "../components/FriendList";
import { UserProfile } from "../components/UserProfile";
import { Chat } from "../components/Chat";
import { statusImages } from "../components/Data";

// on va exporter une fonction qui renvoie du html 
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

    window.addEventListener('friendSelected', (e: any) => {
        const friend = e.detail;
        
        // je récupère mes ids
        const myId = parseInt(localStorage.getItem('userId') || "0");
        const friendId = friend.id;
        
        // je fais mon calcul
        const ids = [myId, friendId].sort((a, b) => a - b);
        const channelKey = `channel_${ids[0]}_${ids[1]}`;

        // affichage du chat
        const chatPlaceholder = document.getElementById('chat-placeholder');
        const channelChat = document.getElementById('channel-chat');
        if (chatPlaceholder) chatPlaceholder.classList.add('hidden');
        if (channelChat) channelChat.classList.remove('hidden');

        // maj header
        const headerName = document.getElementById('chat-header-username');
        const headerAvatar = document.getElementById('chat-header-avatar') as HTMLImageElement;
        const headerStatus = document.getElementById('chat-header-status') as HTMLImageElement;
        const headerBio = document.getElementById('chat-header-bio');

        if (headerName) headerName.textContent = friend.alias;
        if (headerBio) headerBio.textContent = friend.bio;
        if (headerAvatar) headerAvatar.src = friend.avatar || friend.avatar_url;
        if (headerStatus) {
            headerStatus.src = statusImages[friend.status] || statusImages['invisible'];
        }

        chat.joinChannel(channelKey);
    });
}
