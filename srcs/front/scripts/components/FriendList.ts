import SocketService from "../services/SocketService";
import { getStatusDot, statusImages } from "./Data";
import { fetchWithAuth } from "../pages/api";
import { Friendship } from '../../../back/user/src/repositories/friendships';

export class FriendList {
    private container: HTMLElement | null;
    private userId: string | null;

    constructor() {
        this.container = document.getElementById('contacts-list');
        this.userId = localStorage.getItem('userId');
    }

    public init() {
        this.loadFriends();
        this.setupFriendRequests();
        this.setupNotifications(); 
        this.checkNotifications(); 
        this.listenToUpdates();
        this.setupBlockListener();
        this.registerSocketUser();

        setInterval(() => this.checkNotifications(), 30000);
    }

    private registerSocketUser() {
        const socket = SocketService.getInstance().socket;
        const userId = this.userId;

        if (!socket || !userId) return;

        if (socket.connected) {
            socket.emit('registerUser', userId);
        }

        socket.on('connect', () => {
            socket.emit('registerUser', userId);
        });
    }

    private async loadFriends() {
        const contactsList = this.container;
        if (!this.userId || !contactsList) return;

        try {
            // Timestamp pour éviter le cache navigateur
            const response = await fetchWithAuth(`/api/users/${this.userId}/friends?t=${new Date().getTime()}`);
            
            if (!response.ok) throw new Error('Failed to fetch friends');
            
            const responseData = await response.json();
            const friendList = responseData.data;
            
            contactsList.innerHTML = '';
            
            if (!friendList || friendList.length === 0) {
                contactsList.innerHTML = '<div class="text-xs text-gray-500 ml-2">No friend yet</div>';
                return;
            }

            friendList.forEach((friendship: any) => {
                const user = friendship.user;
                const friend = friendship.friend;

                if (!user || !friend) return;
                
                const currentUserId = Number(this.userId);
                const selectedFriend = (user.id === currentUserId) ? friend : user;
                
                // on chope le statut dans la db
                let rawStatus = selectedFriend.status || 'offline';
                const status = rawStatus.toLowerCase(); 

                const friendItem = document.createElement('div');
                friendItem.className = "friend-item flex items-center gap-3 p-2 rounded-sm hover:bg-gray-100 cursor-pointer transition";

                friendItem.dataset.id = selectedFriend.id;
                friendItem.dataset.friendshipId = friendship.id;
                
                friendItem.dataset.login = selectedFriend.username; 
                friendItem.dataset.alias = selectedFriend.alias;
                
                friendItem.dataset.status = status;
                friendItem.dataset.bio = selectedFriend.bio || "Share a quick message";
                friendItem.dataset.avatar = selectedFriend.avatar_url || selectedFriend.avatar || "/assets/basic/default.png";
                
                friendItem.innerHTML = `
                    <div class="relative w-[50px] h-[50px] flex-shrink-0">
                        <img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] object-cover"
                             src="${getStatusDot(status)}" alt="status">
                    </div>
                    <div class="flex flex-col leading-tight">
                        <span class="font-semibold text-sm text-gray-800">${selectedFriend.alias}</span>
                    </div>
                `;

                contactsList.appendChild(friendItem);
                
                friendItem.addEventListener('click', () => {
                    const event = new CustomEvent('friendSelected', { 
                        detail: { friend: selectedFriend, friendshipId: friendship.id } 
                    });
                    window.dispatchEvent(event);
                });
            });
        } catch (error) {
            console.error("Error loading friends:", error);
            contactsList.innerHTML = '<div class="text-xs text-red-400 ml-2">Error loading contacts</div>';
        }
    }

    private listenToUpdates() {
        const socket = SocketService.getInstance().socket;
        if (!socket) return;
        
        socket.on("friendStatusUpdate", (data: { username: string, status: string }) => {
            console.log(`[FriendList] Status update for ${data.username}: ${data.status}`);
            this.updateFriendUI(data.username, data.status);
        });

        socket.on("userConnected", (data: { username: string, status: string }) => {
             const currentUsername = localStorage.getItem('username');
             if (data.username !== currentUsername) {
                this.updateFriendUI(data.username, data.status);
             }
        });

        socket.on('receiveFriendRequestNotif', () => {
            console.log("New friend request received!");
            this.checkNotifications(); 
        });

        socket.on('friendRequestAccepted', () => {
            console.log("Friend request accepted by other user!");
            // rechargement pour l'affichage
            this.loadFriends();
        });

        socket.on('receiveGameInvite', (data: { senderId: string, senderName: string }) => {
            console.log("Game invite received form", data.senderName);
            this.showGameInviteNotification(data.senderId, data.senderName);
        });

        // AJOUT: Réception globale d'un match (Redirection)
        socket.on('matchFound', (data: any) => {
            console.log("Global matchFound event received", data);
            
            // On sauvegarde les infos du match pour GamePage
            sessionStorage.setItem('pendingMatch', JSON.stringify(data));
            
            // Redirection vers /remote
            window.history.pushState({ gameMode: 'remote' }, "", "/remote");
            
            // Force le rechargement de la vue via l'event de navigation
            const navEvent = new PopStateEvent('popstate', { state: { gameMode: 'remote' } });
            window.dispatchEvent(navEvent);
        });
    }

    ///// pour la notification de l'invitation
    private showGameInviteNotification(senderId: string, senderName: string) {
        const notifIcon = document.getElementById('notification-icon') as HTMLImageElement;
        
        // on active l'icone de notif
        if (notifIcon) notifIcon.src = "/assets/basic/notification.png";

        const toast = document.createElement('div');
        toast.className = "fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 flex flex-col gap-2 border border-blue-200 animate-bounce-in";
        // changer l'emoji pour l'image du jeu 
        toast.innerHTML = `
            <div class="font-bold text-gray-800">🎮 Game Invite</div> 
            <div class="text-sm text-gray-600">${senderName} wants to play Pong!</div>
            <div class="flex gap-2 mt-2">
                <button id="accept-invite" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">Accept</button>
                <button id="decline-invite" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition">Decline</button>
            </div>
        `;

        document.body.appendChild(toast);

        toast.querySelector('#accept-invite')?.addEventListener('click', () => {
            SocketService.getInstance().socket?.emit('acceptGameInvite', { senderId: senderId });
            toast.remove();
        });

        toast.querySelector('#decline-invite')?.addEventListener('click', () => {
            SocketService.getInstance().socket?.emit('declineGameInvite', { senderId: senderId });
            toast.remove();
        });

        // Auto remove après 10s
        setTimeout(() => { if(document.body.contains(toast)) toast.remove(); }, 10000);
    }

    private updateFriendUI(loginOrUsername: string, newStatus: string) {
        const friendItems = document.querySelectorAll('.friend-item');
        
        friendItems.forEach((item) => {
            const el = item as HTMLElement;
            if (el.dataset.login === loginOrUsername || el.dataset.alias === loginOrUsername) {
                
                // maj visuelle du status
                let status = (newStatus || 'offline').toLowerCase();
                el.dataset.status = status;
                
                const statusImg = el.querySelector('img[alt="status"]') as HTMLImageElement;
                if (statusImg) {
                    statusImg.src = getStatusDot(status);
                }
                console.log(`[FriendList] Updated UI for ${loginOrUsername} to ${status}`);
            }
        });
    }

    private setupBlockListener() {
        window.addEventListener('friendBlocked', (e: any) => {
            const blockedUsername = e.detail?.username;
            if (!blockedUsername || !this.container) return;
            const friendToRemove = this.container.querySelector(`.friend-item[data-login="${blockedUsername}"]`);
            if (friendToRemove) {
                (friendToRemove as HTMLElement).style.opacity = '0';
                setTimeout(() => {
                    friendToRemove.remove();
                    if (this.container && this.container.children.length === 0) {
                        this.container.innerHTML = '<div class="text-xs text-gray-500 ml-2">No friend yet</div>';
                    }
                }, 300);
            }
        });
    }

    private setupFriendRequests() {
        const addFriendButton = document.getElementById('add-friend-button');
        const addFriendDropdown = document.getElementById('add-friend-dropdown');
        const friendSearchInput = document.getElementById('friend-search-input') as HTMLInputElement;
        const sendFriendRequestButton = document.getElementById('send-friend-request');
        const cancelFriendRequestButton = document.getElementById('cancel-friend-request');
        const friendRequestMessage = document.getElementById('friend-request-message');

        if (addFriendButton && addFriendDropdown && friendSearchInput && sendFriendRequestButton && cancelFriendRequestButton) {
            addFriendButton.addEventListener('click', (e) => {
                e.stopPropagation();
                addFriendDropdown.classList.toggle('hidden');
                document.getElementById('status-dropdown')?.classList.add('hidden');
                if (!addFriendDropdown.classList.contains('hidden')) {
                    friendSearchInput.focus();
                }
            });
    
            const sendFriendRequest = async () => {
                const searchValue = friendSearchInput.value.trim();
                if (!searchValue) {
                    this.showFriendMessage('Please enter a username or email', 'error', friendRequestMessage);
                    return;
                }
                const userId = localStorage.getItem('userId');
                try {
                    const response = await fetchWithAuth(`/api/users/${userId}/friendships`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ alias: searchValue })
                    });
                    const data = await response.json();
    
                    if (response.ok) {
                        this.showFriendMessage('Friend request sent!', 'success', friendRequestMessage);
                        
                        const targetId = data.data.friend_id || data.data.friend?.id;
                        if (targetId) {
                            SocketService.getInstance().socket?.emit('sendFriendRequestNotif', { 
                                targetId: targetId 
                            });
                        }
                        
                        friendSearchInput.value = '';
                        setTimeout(() => {
                            addFriendDropdown.classList.add('hidden');
                            friendRequestMessage?.classList.add('hidden');
                        }, 1500);
                    } else {
                        this.showFriendMessage(data.error.message || 'Error sending request', 'error', friendRequestMessage);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    this.showFriendMessage('Network error', 'error', friendRequestMessage);
                }
            };
    
            sendFriendRequestButton.addEventListener('click', sendFriendRequest);
            friendSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') sendFriendRequest();
            });
            cancelFriendRequestButton.addEventListener('click', () => {
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
    }

    private showFriendMessage(message: string, type: 'success' | 'error', element: HTMLElement | null) {
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden', 'text-green-600', 'text-red-600');
            element.classList.add(type === 'success' ? 'text-green-600' : 'text-red-600');
        }
    };

    private setupNotifications() {
        const notifButton = document.getElementById('notification-button');
        const notifDropdown = document.getElementById('notification-dropdown');

        if (notifButton && notifDropdown) {
            notifButton.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.classList.toggle('hidden');
                document.getElementById('add-friend-dropdown')?.classList.add('hidden');
                if (!notifDropdown.classList.contains('hidden')) {
                    this.checkNotifications();
                }
            });
            document.addEventListener('click', (e) => {
                if (!notifDropdown.contains(e.target as Node) && !notifButton.contains(e.target as Node))
                    notifDropdown.classList.add('hidden');
            });
        }
    }

    private async checkNotifications() {
        const userId = localStorage.getItem('userId');
        const notifList = document.getElementById('notification-list');
        
        if (!userId || !notifList) return;

        try {
            const response = await fetchWithAuth(`/api/users/${userId}/friendships/pendings`);
            if (!response.ok) throw new Error('Failed to fetch pendings');

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

            pendingList.forEach((req: Friendship) => {
                const item = document.createElement('div');
                item.dataset.friendshipId = req.id.toString();
                item.className = "flex items-start p-4 border-b border-gray-200 gap-4 hover:bg-gray-50 transition";

                item.innerHTML = `
                    <div class="relative w-8 h-8 flex-shrink-0 mr-4">
                        <img src="/assets/basic/logo.png" 
                            class="w-full h-full object-cover rounded"
                            alt="avatar">
                    </div>
                    <div class="flex-1 min-w-0 pr-4">
                        <p class="text-sm text-gray-800">
                            <span class="font-semibold">${req.user?.alias}</span> wants to be your friend
                        </p>
                    </div>
                    <div class="flex gap-2 flex-shrink-0">
                        <button class="btn-accept w-7 h-7 flex items-center justify-center bg-white border border-gray-400 rounded hover:bg-green-100 hover:border-green-500 transition-colors" title="Accept">
                            <span class="text-green-600 font-bold text-sm">✓</span>
                        </button>
                        <button class="btn-reject w-7 h-7 flex items-center justify-center bg-white border border-gray-400 rounded hover:bg-red-100 hover:border-red-500 transition-colors" title="Decline">
                            <span class="text-red-600 font-bold text-sm">✕</span>
                        </button>
                        <button class="btn-block w-7 h-7 flex items-center justify-center bg-white border border-gray-400 rounded hover:bg-gray-200 hover:border-gray-600 transition-colors" title="Block">
                            <span class="text-gray-600 text-xs">🚫</span>
                        </button>
                    </div>
                `;
                const buttonAccept = item.querySelector('.btn-accept');
                const buttonReject = item.querySelector('.btn-reject');
                const buttonBlock  = item.querySelector('.btn-block');

                if (req.user && req.user.id) {
                    buttonAccept?.addEventListener('click', (e) => { e.stopPropagation(); this.handleRequest(req.user!.id, 'validated', item); });
                    buttonReject?.addEventListener('click', (e) => { e.stopPropagation(); this.handleRequest(req.user!.id, 'rejected', item); });
                    buttonBlock?.addEventListener('click', (e) => { e.stopPropagation(); this.handleRequest(req.user!.id, 'blocked', item); });
                }

                notifList.appendChild(item);
            });
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }

    private async handleRequest(requesterId: number, action: 'validated' | 'rejected' | 'blocked', itemDiv: HTMLElement) { 
        const userId = localStorage.getItem('userId');
        if (!itemDiv.dataset.friendshipId) return;

        try {
            const response = await fetchWithAuth(`/api/users/${userId}/friendships/${itemDiv.dataset.friendshipId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action }) 
            });

            if (response.ok) {
                itemDiv.style.opacity = '0'; 
                setTimeout(() => {
                    itemDiv.remove();
                    if (action === 'validated') {
                        this.loadFriends(); 
                        
                        const socket = SocketService.getInstance().socket;
                        if (socket) {
                            socket.emit('acceptFriendRequest', { 
                                targetId: requesterId 
                            });
                        }
                    }
                    this.checkNotifications(); 
                }, 300);
            } else {
                console.error("Failed to update request");
            }
        } catch (error) {
            console.error("Network error", error);
        }
    };
}