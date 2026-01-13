import SocketService from "../services/SocketService";
import { getStatusDot, statusImages } from "./Data";
import { fetchWithAuth } from "../services/api";
import { Friendship } from '../../../back/user/src/repositories/friendships';

export class FriendList {
    private container: HTMLElement | null;
    private userId: string | null;
    private notificationInterval: any = null;

    constructor() {
        this.container = document.getElementById('contacts-list');
        this.userId = localStorage.getItem('userId');
    }

    public init() {
        console.log("[FriendList] Initializing..."); // LOG AJOUTÉ
        SocketService.getInstance().connectChat();
        SocketService.getInstance().connectGame();
        this.destroy();
        this.listenToUpdates();
        this.loadFriends();
        this.setupFriendRequests();
        this.setupNotifications(); 
        this.checkNotifications(); 
        
        this.setupBlockListener();
        this.registerSocketUser();

        // setInterval(() => this.checkNotifications(), 30000);


        if (this.notificationInterval) clearInterval(this.notificationInterval);

        this.notificationInterval = setInterval(() => this.checkNotifications(), 30000);
    }

    // AJOUT
    public destroy() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }

        const chatSocket = SocketService.getInstance().getChatSocket();
        if (chatSocket) {
            chatSocket.off('chatMessage');
            chatSocket.off('unreadNotification');
            chatSocket.off('unreadStatus');
        }
    }

    private registerSocketUser() {
        const socketService = SocketService.getInstance();
        const chatSocket = socketService.getChatSocket();
        const gameSocket = socketService.getGameSocket();
        const userId = this.userId;

        if (!userId) return;

        if (chatSocket) {
            const registerChat = () => {
                console.log("[FriendList] Registering user on Chat Socket:", userId);
                chatSocket.emit('registerUser', userId);
            };

            if (chatSocket.connected) {
                registerChat();
            } else {
                chatSocket.on('connect', registerChat);
            }
        }


        if (gameSocket) {
             const registerGame = () => {
                 gameSocket.emit('registerGameSocket', userId);
             };

             if (gameSocket.connected) {
                 registerGame();
             } else {
                 gameSocket.on('connect', registerGame);
             }
        }
    }

    private async loadFriends() {
        const contactsList = this.container;
        if (!this.userId || !contactsList) return;

        try {
            // Timestamp pour éviter le cache navigateur
            const response = await fetchWithAuth(`/api/user/${this.userId}/friends?t=${new Date().getTime()}`);
            
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
                friendItem.className = "friend-item flex items-center justify-between p-2 rounded-sm hover:bg-gray-100 cursor-pointer transition relative";

                friendItem.dataset.id = selectedFriend.id;
                friendItem.dataset.friendshipId = friendship.id;
                
                friendItem.dataset.login = selectedFriend.username; 
                friendItem.dataset.alias = selectedFriend.alias;
                
                friendItem.dataset.status = status;
                friendItem.dataset.bio = selectedFriend.bio || "Share a quick message";
                friendItem.dataset.avatar = selectedFriend.avatar_url || selectedFriend.avatar || "/assets/basic/default.png";
                
                friendItem.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="relative w-[40px] h-[40px] flex-shrink-0">
                         <img class="w-full h-full rounded-full object-cover border border-gray-200"
                             src="${selectedFriend.avatar_url || selectedFriend.avatar || "/assets/basic/default.png"}" alt="avatar">
                        
                        <img class="absolute bottom-0 right-0 w-[12px] h-[12px] object-cover border border-white rounded-full"
                             src="${getStatusDot(status)}" alt="status">
                    </div>
                    <div class="flex flex-col leading-tight">
                        <span class="font-semibold text-sm text-gray-800">${selectedFriend.alias}</span>
                        <span class="text-xs text-gray-400 status-text">${status}</span>
                    </div>
                </div>

                <div id="badge-${selectedFriend.id}" 
                     class="hidden bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md z-10"
                     style="background-color: #dc2626; color: white;">
                    1
                </div>
                `;

                contactsList.appendChild(friendItem);

                const chatSocket = SocketService.getInstance().getChatSocket();
                if (chatSocket) {
                    const myId = Number(this.userId);
                    const id1 = Math.min(myId, selectedFriend.id);
                    const id2 = Math.max(myId, selectedFriend.id);
                    const channelKey = `${id1}_${id2}`;
                    console.log(`channelK`)
                    const check = () => {
                        chatSocket.emit('checkUnread', { 
                            channelKey: channelKey, 
                            friendId: selectedFriend.id 
                        });
                    };

                    if (chatSocket.connected) {
                        check();
                    } else {
                        chatSocket.once('connect', check);
                    }

                }
                
                friendItem.addEventListener('click', (e) => {
                    // Si on clique sur le bouton inviter, on ne déclenche pas l'ouverture du chat ici
                    if ((e.target as HTMLElement).closest('.invite-btn')) return;

                    this.clearNotifications(selectedFriend.id);

                    const event = new CustomEvent('friendSelected', { 
                        detail: { friend: selectedFriend, friendshipId: friendship.id } 
                    });
                    window.dispatchEvent(event);
                });

                // AJOUT: Clic sur le bouton d'invitation
                const inviteBtn = friendItem.querySelector('.invite-btn');
                inviteBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.sendInviteDirectly(selectedFriend.id, selectedFriend.alias);
                });
            });
        } catch (error) {
            console.error("Error loading friends:", error);
            contactsList.innerHTML = '<div class="text-xs text-red-400 ml-2">Error loading contacts</div>';
        }
    }

    private clearNotifications(friendId: number) {
        console.log("clear notification")
        const badge = document.getElementById(`badge-${friendId}`);
        if (badge) {
            badge.classList.add('hidden');
            badge.innerText = '0';
        }
    }

    private handleMessageNotification(senderId: number) {
        console.log(`[FriendList] 🔴 Displaying badge for user ${senderId}`);
        const badge = document.getElementById(`badge-${senderId}`);
        if (badge) {
            badge.classList.remove('hidden');
        } else {
            console.warn(`[FriendList] Badge element badge-${senderId} not found in DOM`);
        }
    }

    // AJOUT: Fonction pour envoyer une invitation depuis la liste
    private sendInviteDirectly(friendId: number, friendName: string) {
        const gameSocket = SocketService.getInstance().getGameSocket();
        const myName = localStorage.getItem('username');

        if (!gameSocket || !gameSocket.connected) 
        {
            alert("Game is disconnected, please refresh");
            SocketService.getInstance().connectGame();
            return ;
        }

        console.debug(`Sending game invite to ${friendName} via GameSocket`);
        gameSocket.emit('sendGameInvite', {
            targetId: friendId,
            senderName: myName
        });

        alert(`Invitation sent to ${friendName}`);
    }

    private listenToUpdates() {

        const socketService = SocketService.getInstance();
        const chatSocket = socketService.getChatSocket();
        const gameSocket = socketService.getGameSocket();

        if (!chatSocket) return;
        
        chatSocket.on('chatMessage', (data: { sender_id: number, channelKey: string}) => {
            console.log(`[FriendList] 📨 Received chatMessage event from ${data.sender_id}`);
            this.handleMessageNotification(data.sender_id);
        })

        chatSocket.on('unreadStatus', (data: any) => {
            console.log("[FriendList] 📥 Debug unreadStatus data:", data);
            const idToNotify = data.friendId || data.senderId;

            if (data.hasUnread && idToNotify) {
                this.handleMessageNotification(idToNotify);
            }
        });

        chatSocket.on('unreadNotification', (data: { senderId: number, content: string }) => {
            console.log("[FriendList] 🔔 Event 'unreadNotification' received", data);
            this.handleMessageNotification(data.senderId);
        });

        chatSocket.on("friendStatusUpdate", (data: { username: string, status: string }) => {
            console.log(`[FriendList] Status update for ${data.username}: ${data.status}`);
            this.updateFriendUI(data.username, data.status);
        });

        chatSocket.on("userConnected", (data: { username: string, status: string }) => {
             const currentUsername = localStorage.getItem('username');
             if (data.username !== currentUsername) {
                this.updateFriendUI(data.username, data.status);
             }
        });

        chatSocket.on('receiveFriendRequestNotif', () => {
            console.log("New friend request received!");
            this.checkNotifications(); 
        });

        chatSocket.on('friendRequestAccepted', () => {
            console.log("Friend request accepted by other user!");
            // rechargement pour l'affichage
            this.loadFriends();
        });

        if (!gameSocket)
        {
            console.error("GameSocket cannot be found");
            return ;
        }
        
        // Fonction interne pour attacher les écouteurs une fois qu'on est prêts
        const attachGameListeners = () => {
            console.log(`[CLIENT] Ma GameSocket ID est ${gameSocket.id}`);

            gameSocket.emit('registerGameSocket');
            
            // On retire l'écouteur précédent
            gameSocket.off('receiveGameInvite');

            gameSocket.on('receiveGameInvite', (data: { senderId: string, senderName: string }) => {
                console.log(`Game invite received from ${data.senderName} on ${gameSocket.id}`);
                this.showGameInviteNotification(data.senderId, data.senderName);
            });
        }

        if (gameSocket.connected)
        { 
            // 1. la socket était déjà connectée 
            attachGameListeners();
        }
        else
        {
            // 2. La connexion est en cours
            console.log("⏳ [CLIENT] GameSocket en cours de connexion...");
            gameSocket.once('connect', () => {
                attachGameListeners();
        });            
        }

    }

    ///// pour la notification de l'invitation
    private showGameInviteNotification(senderId: string, senderName: string) {
        console.log("showGameInvite");
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
            const gameSocket = SocketService.getInstance().getGameSocket();
        
            if (!gameSocket || !gameSocket.connected) {
                alert("Error: connexion to server lost");
                toast.remove();
                return;
            }

            console.log("Accepting game invite from", senderName);

            // ✅ ÉTAPE 1 : Attacher le listener AVANT d'accepter
            gameSocket.once('matchFound', (data: any) => {
                console.log("✅ Match found from invitation:", data);
                
                // Sauvegarder les infos
                sessionStorage.setItem('pendingMatch', JSON.stringify(data));
                
                // Redirection
                window.history.pushState({ gameMode: 'remote' }, '', '/game');
                
                // Trigger le rendu
                const event = new PopStateEvent('popstate');
                window.dispatchEvent(event);
            });

            // ✅ ÉTAPE 2 : Maintenant on peut accepter
            gameSocket.emit('acceptGameInvite', { senderId: senderId });
            
            toast.remove();
        });

        // Bouton Decline
        toast.querySelector('#decline-invite')?.addEventListener('click', () => {
            const gameSocket = SocketService.getInstance().getGameSocket()?.emit('declineGameInvite', { senderId: senderId });
            if (gameSocket && gameSocket.connected)
            {
                gameSocket.emit('declineGameInivite', { senderId: senderId });
            }
            toast.remove();
        });

        // Auto-suppression après 10s
        setTimeout(() => { 
            if(document.body.contains(toast)) toast.remove(); 
        }, 10000);
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
                    const response = await fetchWithAuth(`/api/user/${userId}/friendships`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ alias: searchValue })
                    });
                    const data = await response.json();
    
                    if (response.ok) {
                        this.showFriendMessage('Friend request sent!', 'success', friendRequestMessage);
                        
                        const targetId = data.data.friend_id || data.data.friend?.id;
                        if (targetId) {
                            SocketService.getInstance().getChatSocket()?.emit('sendFriendRequestNotif', { 
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
            const response = await fetchWithAuth(`/api/user/${userId}/friendships/pendings`);
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
            const response = await fetchWithAuth(`/api/user/${userId}/friendships/${itemDiv.dataset.friendshipId}`, {
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
                        
                        const socket = SocketService.getInstance().getChatSocket();
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