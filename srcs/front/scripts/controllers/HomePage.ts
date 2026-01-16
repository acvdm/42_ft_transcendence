import htmlContent from "../pages/HomePage.html";
import SocketService from "../services/SocketService";
import { FriendList } from "../components/FriendList";
import { UserProfile } from "../components/UserProfile";
import { Chat } from "../components/Chat";
import { statusImages, Data } from "../components/Data";
import { FriendProfileModal } from "../components/FriendProfileModal";
import { parseMessage } from "../components/ChatUtils";

import i18next from "../i18n";

let friendListInstance: FriendList | null = null;
let chatInstance: Chat | null = null;
let friendSelectedHandler: ((e: any) => void) | null = null;

export function render(): string {
	let html = htmlContent;

	// html = html.replace(/\{\{nav\.home\}\}/g, i18next.t('nav.home'));
	// html = html.replace(/\{\{nav\.profile\}\}/g, i18next.t('nav.profile'));
	// html = html.replace(/\{\{nav\.dashboard\}\}/g, i18next.t('nav.dashboard'));
	// html = html.replace(/\{\{nav\.logout\}\}/g, i18next.t('nav.logout'));

	html = html.replace(/\{\{homepage.profile\.title\}\}/g, i18next.t('homepage.profile.title'));
	html = html.replace(/\{\{homepage.profile\.bio\}\}/g, i18next.t('homepage.profile.bio'));
	html = html.replace(/\{\{homepage.profile\.username\}\}/g, i18next.t('homepage.profile.username'));
	html = html.replace(/\{\{homepage.profile\.status.available\}\}/g, i18next.t('homepage.profile.status.available'));
	html = html.replace(/\{\{homepage.profile\.status.busy\}\}/g, i18next.t('homepage.profile.status.busy'));
	html = html.replace(/\{\{homepage.profile\.status.away\}\}/g, i18next.t('homepage.profile.status.away'));
	html = html.replace(/\{\{homepage.profile\.status.offline\}\}/g, i18next.t('homepage.profile.status.offline'));

	html = html.replace(/\{\{homepage.games\.title\}\}/g, i18next.t('homepage.games.title'));
	html = html.replace(/\{\{homepage.games\.mode\}\}/g, i18next.t('homepage.games.mode'));
	html = html.replace(/\{\{homepage.games\.choose_mode\}\}/g, i18next.t('homepage.games.choose_mode'));
	html = html.replace(/\{\{homepage.games\.title_mode\}\}/g, i18next.t('homepage.games.title_mode'));
	html = html.replace(/\{\{homepage.games\.local\}\}/g, i18next.t('homepage.games.local'));
	html = html.replace(/\{\{homepage.games\.remote\}\}/g, i18next.t('homepage.games.remote'));
	html = html.replace(/\{\{homepage.games\.tournament\}\}/g, i18next.t('homepage.games.tournament'));
	html = html.replace(/\{\{homepage.games\.local_describe\}\}/g, i18next.t('homepage.games.local_describe'));
	html = html.replace(/\{\{homepage.games\.remote_describe\}\}/g, i18next.t('homepage.games.remote_describe'));
	html = html.replace(/\{\{homepage.games\.tournament_describe\}\}/g, i18next.t('homepage.games.tournament_describe'));
	html = html.replace(/\{\{homepage.chat\.title\}\}/g, i18next.t('homepage.chat.title'));
	html = html.replace(/\{\{homepage.chat\.friends\}\}/g, i18next.t('homepage.chat.friends'));
	html = html.replace(/\{\{homepage.chat\.add_friend\}\}/g, i18next.t('homepage.chat.add_friend'));
	html = html.replace(/\{\{homepage.chat\.send_request\}\}/g, i18next.t('homepage.chat.send_request'));
	html = html.replace(/\{\{homepage.chat\.cancel\}\}/g, i18next.t('homepage.chat.cancel'));
	html = html.replace(/\{\{homepage.chat\.contact\}\}/g, i18next.t('homepage.chat.contact'));
	html = html.replace(/\{\{homepage.chat\.placeholder\}\}/g, i18next.t('homepage.chat.placeholder'));
	html = html.replace(/\{\{homepage.chat\.input_placeholder\}\}/g, i18next.t('homepage.chat.input_placeholder'));
	html = html.replace(/\{\{homepage.chat\.view_profile\}\}/g, i18next.t('homepage.chat.view_profile'));
	html = html.replace(/\{\{homepage.chat\.invite_game\}\}/g, i18next.t('homepage.chat.invite_game'));
	html = html.replace(/\{\{homepage.chat\.block_user\}\}/g, i18next.t('homepage.chat.block_user'));
	html = html.replace(/\{\{homepage.notifications\.title\}\}/g, i18next.t('homepage.notifications.title'));
	html = html.replace(/\{\{homepage.notifications\.no_notification\}\}/g, i18next.t('homepage.notifications.no_notification'));
	html = html.replace(/\{\{homepage.modal\.user_profile\}\}/g, i18next.t('homepage.modal.user_profile'));
	html = html.replace(/\{\{friendProfileModal\.no_bio\}\}/g, i18next.t('friendProfileModal.no_bio'));
	html = html.replace(/\{\{homepage.modal\.statistics\}\}/g, i18next.t('homepage.modal.statistics'));
	html = html.replace(/\{\{homepage.modal\.games_played\}\}/g, i18next.t('homepage.modal.games_played'));
	html = html.replace(/\{\{homepage.modal\.wins\}\}/g, i18next.t('homepage.modal.wins'));
	html = html.replace(/\{\{homepage.modal\.losses\}\}/g, i18next.t('homepage.modal.losses'));
	html = html.replace(/\{\{homepage.modal\.winning_streak\}\}/g, i18next.t('homepage.modal.winning_streak'));
	html = html.replace(/\{\{homepage.modal\.close\}\}/g, i18next.t('homepage.modal.close'));
	html = html.replace(/\{\{homepage.modal\.change_picture\}\}/g, i18next.t('homepage.modal.change_picture'));
	html = html.replace(/\{\{homepage.modal\.select_picture\}\}/g, i18next.t('homepage.modal.select_picture'));
	html = html.replace(/\{\{homepage.modal\.picture_description\}\}/g, i18next.t('homepage.modal.picture_description'));
	html = html.replace(/\{\{homepage.modal\.browse\}\}/g, i18next.t('homepage.modal.browse'));
	html = html.replace(/\{\{homepage.modal\.delete\}\}/g, i18next.t('homepage.modal.delete'));
	html = html.replace(/\{\{homepage.modal\.ok\}\}/g, i18next.t('homepage.modal.ok'));
	html = html.replace(/\{\{homepage.modal\.cancel\}\}/g, i18next.t('homepage.modal.cancel'));

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

	if (Data.hasUnreadMessage) {
		const notifElement = document.getElementById('message-notification');
		if (notifElement) {
			notifElement.style.display = 'block';
		}
	}

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
				const currentChatUser = headerName?.dataset.username || headerName?.textContent;

				if (headerName && currentChatUser === data.username) {
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

  
		Data.hasUnreadMessage = false;
		const notifElement = document.getElementById('message-notification');
		if (notifElement) {
			notifElement.style.display = 'none';
		}
		
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
			headerName.dataset.username = friend.username;
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
			window.history.pushState({ gameMode: 'local' }, '', '/game?mode=local');
			const navEvent = new PopStateEvent('popstate');
			window.dispatchEvent(navEvent);
		});
	}

	const remoteGameButton = document.getElementById('remote-game');
	if (remoteGameButton) {
		remoteGameButton.addEventListener('click', () => {
			window.history.pushState({ gameMode: 'remote' }, '', '/game?mode=remote');
			const navEvent = new PopStateEvent('popstate');
			window.dispatchEvent(navEvent);
		});
	}

	const tournamentGameButton = document.getElementById('tournament-game');
	if (tournamentGameButton) {
		tournamentGameButton.addEventListener('click', () => {
			window.history.pushState({ gameMode: 'tournament' }, '', '/game?mode=tournament');
			const navEvent = new PopStateEvent('popstate');
			window.dispatchEvent(navEvent);
		});
	} 
}