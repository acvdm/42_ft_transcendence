import htmlContent from "../pages/HomePage.html";
import SocketService from "../services/SocketService";
import { FriendList } from "../components/FriendList";
import { UserProfile } from "../components/UserProfile";
import { Chat } from "../components/Chat";
import { statusImages } from "../components/Data";
import { FriendProfileModal } from "../components/FriendProfileModal";
import { parseMessage } from "../components/ChatUtils";


let friendListInstance: FriendList | null = null;
let chatInstance: Chat | null = null;
let friendSelectedHandler: ((e: any) => void) | null = null;

export function render(): string {
    return htmlContent;
}

export function cleanup() {

    // Cleaning setInterval and notifications
    if (friendListInstance) {
        friendListInstance.destroy();
        friendListInstance = null;
    }

    // Delete listener to clean when leaving the page
    if (friendSelectedHandler){
        window.removeEventListener('friendSelected', friendSelectedHandler);
        friendSelectedHandler = null;
    }

    if (chatInstance){
        chatInstance.destroy();
        chatInstance = null;
    }

    const socketService = SocketService.getInstance();
    const chatSocket = socketService.getChatSocket();
    if (chatSocket) {
        chatSocket.off('friendProfileUpdated');
        chatSocket.off('friendStatusUpdate');
    }
}

export function afterRender(): void {

    const socketService = SocketService.getInstance();
    socketService.connectChat();
    friendListInstance = new FriendList();
    friendListInstance.init();

    const userProfile = new UserProfile();
    userProfile.init();
    chatInstance = new Chat();
    chatInstance.init();

    let currentChatFriendId: number | null = null;
    const friendProfileModal = new FriendProfileModal();
    const chatSocket = socketService.getChatSocket();

    if (chatSocket) {
        chatSocket.on('friendProfileUpdated', (data: any) => {

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

                const headerName = document.getElementById('chat-header-username');

                if (headerName && headerName.textContent === data.username) {
                    const headerStatus = document.getElementById('chat-header-status') as HTMLImageElement;
                    if (headerStatus && statusImages[data.status]) {
                        headerStatus.src = statusImages[data.status];
                    }
                }
            });
    }


	//================================================
	//=============== FRIEND SELECTION ===============
	//================================================

    friendSelectedHandler = (e: any) => {

        const { friend, friendshipId } = e.detail;

        currentChatFriendId = friend.id;
        const myId = parseInt(localStorage.getItem('userId') || "0");
        const ids = [myId, friend.id].sort((a, b) => a - b);
        const channelKey = `channel_${ids[0]}_${ids[1]}`;
        const chatPlaceholder = document.getElementById('chat-placeholder');
        const channelChat = document.getElementById('channel-chat');

        if (chatPlaceholder) {
            chatPlaceholder.classList.add('hidden');
        }
        if (channelChat) {
            channelChat.classList.remove('hidden');
        }

        const headerName = document.getElementById('chat-header-username');
        const headerAvatar = document.getElementById('chat-header-avatar') as HTMLImageElement;
        const headerStatus = document.getElementById('chat-header-status') as HTMLImageElement;
        const headerBio = document.getElementById('chat-header-bio');

        if (headerName) {
            headerName.textContent = friend.alias;
        }
        if (headerBio) {
            headerBio.innerHTML = parseMessage(friend.bio || '');
        }
        if (headerAvatar) {
            const avatarSrc = friend.avatar || friend.avatar_url || '/assets/profile/default.png';
            headerAvatar.src = avatarSrc;
        }
        if (headerStatus) {
            headerStatus.src = statusImages[friend.status] || statusImages['invisible'];
        }
        if (chatInstance) {
            chatInstance.joinChannel(channelKey, friendshipId, friend.id);
        }
    };

    window.addEventListener('friendSelected', friendSelectedHandler);

    // Opening friend profile
    const viewProfileButton = document.getElementById('button-view-profile');
    
    viewProfileButton?.addEventListener('click', () => {
        document.getElementById('chat-options-dropdown')?.classList.add('hidden');
        if (currentChatFriendId) {
            friendProfileModal.open(currentChatFriendId);
        }
    });


	//================================================
	//================= GAMES BUTTONS ================
	//================================================

    const localGameButton = document.getElementById('local-game');
    if (localGameButton) {
        localGameButton.addEventListener('click', () => {
            window.history.pushState({ gameMode: 'local' }, '', '/game');
            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        });
    }

    const remoteGameButton = document.getElementById('remote-game');
    if (remoteGameButton) {
        remoteGameButton.addEventListener('click', () => {
            window.history.pushState({ gameMode: 'remote' }, '', '/game');
            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        });
    }

    const tournamentGameButton = document.getElementById('tournament-game');
    if (tournamentGameButton) {
        tournamentGameButton.addEventListener('click', () => {
            window.history.pushState({ gameMode: 'tournament' }, '', '/game');
            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        });
    } 
}