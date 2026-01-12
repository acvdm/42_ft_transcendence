import htmlContent from "../pages/HomePage.html?raw";
import SocketService from "../services/SocketService";
import { FriendList } from "../components/FriendList";
import { UserProfile } from "../components/UserProfile";
import { Chat } from "../components/Chat";
import { statusImages } from "../components/Data";
import { FriendProfileModal } from "../components/FriendProfileModal";
import { parseMessage } from "../components/ChatUtils";

import i18next from "../i18n";

// ajout de variables globales pour stocker les instances actives de la page
// init() interval est appele a chaque fois auon va sur la HomePage
// ajouts car besoin de clean pour quil n'y ai pas plusieurs process 
// qui s'accumulent quand on change de page et quon revient sur la homePage

let friendListInstance: FriendList | null = null;
let chatInstance: Chat | null = null;
let friendSelectedHandler: ((e: any) => void) | null = null;

export function render(): string {
    let html = htmlContent;

    // html = html.replace(/\{\{nav\.home\}\}/g, i18next.t('nav.home'));
    // html = html.replace(/\{\{nav\.profile\}\}/g, i18next.t('nav.profile'));
    // html = html.replace(/\{\{nav\.dashboard\}\}/g, i18next.t('nav.dashboard'));
    // html = html.replace(/\{\{nav\.logout\}\}/g, i18next.t('nav.logout'));

    html = html.replace(/\{\{profile\.title\}\}/g, i18next.t('profile.title'));
    html = html.replace(/\{\{profile\.bio\}\}/g, i18next.t('profile.bio'));
    html = html.replace(/\{\{profile\.username\}\}/g, i18next.t('profile.username'));
    html = html.replace(/\{\{profile\.status.available\}\}/g, i18next.t('profile.status.available'));
    html = html.replace(/\{\{profile\.status.busy\}\}/g, i18next.t('profile.status.busy'));
    html = html.replace(/\{\{profile\.status.away\}\}/g, i18next.t('profile.status.away'));
    html = html.replace(/\{\{profile\.status.invisible\}\}/g, i18next.t('profile.status.invisible'));

    html = html.replace(/\{\{games\.title\}\}/g, i18next.t('games.title'));
    html = html.replace(/\{\{games\.choose_mode\}\}/g, i18next.t('games.choose_mode'));
    html = html.replace(/\{\{games\.local\}\}/g, i18next.t('games.local'));
    html = html.replace(/\{\{games\.remote\}\}/g, i18next.t('games.remote'));
    html = html.replace(/\{\{games\.tournament\}\}/g, i18next.t('games.tournament'));

    html = html.replace(/\{\{chat\.title\}\}/g, i18next.t('chat.title'));
    html = html.replace(/\{\{chat\.friends\}\}/g, i18next.t('chat.friends'));
    html = html.replace(/\{\{chat\.add_friend\}\}/g, i18next.t('chat.add_friend'));
    html = html.replace(/\{\{chat\.send_request\}\}/g, i18next.t('chat.send_request'));
    html = html.replace(/\{\{chat\.cancel\}\}/g, i18next.t('chat.cancel'));
    html = html.replace(/\{\{chat\.contact\}\}/g, i18next.t('chat.contact'));
    html = html.replace(/\{\{chat\.placeholder\}\}/g, i18next.t('chat.placeholder'));
    html = html.replace(/\{\{chat\.inputplace_holder\}\}/g, i18next.t('chat.inputplace_holder'));
    html = html.replace(/\{\{chat\.view_profile\}\}/g, i18next.t('chat.view_profile'));
    html = html.replace(/\{\{chat\.invite_game\}\}/g, i18next.t('chat.invite_game'));
    html = html.replace(/\{\{chat\.block_user\}\}/g, i18next.t('chat.block_user'));

    html = html.replace(/\{\{notifications\.title\}\}/g, i18next.t('notifications.title'));
    html = html.replace(/\{\{notifications\.no_notification\}\}/g, i18next.t('notifications.no_notification'));

    return html;
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