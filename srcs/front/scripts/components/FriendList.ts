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
        this.setupNotifications(); // Configure les clics (ne lance pas de boucle)
        this.checkNotifications(); // Lance la première vérification manuellement
        this.listenToUpdates();
        this.setupBlockListener();

        // enregistrement pour recevoir les notifs
        const socket = SocketService.getInstance().socket;
        if (socket && this.userId) {
            socket.emit('registerUser', this.userId);
        }

        // On déplace l'intervalle ici pour éviter les récursions infinies
        setInterval(() => this.checkNotifications(), 30000);
    }

    private async loadFriends() {
        const contactsList = this.container;
        if (!this.userId || !contactsList) return;

        try {
            const response = await fetchWithAuth(`/api/users/${this.userId}/friends`);
            if (!response.ok) throw new Error('Failed to fetch friends');
            
            const responseData = await response.json();
            const friendList = responseData.data;
            // on vide la liste
            contactsList.innerHTML = '';
            
            if (!friendList || friendList.length === 0) {
                contactsList.innerHTML = '<div class="text-xs text-gray-500 ml-2">No friend yet</div>';
                return;
            }

            friendList.forEach((friendship: any) => {
                const user = friendship.user;
                const friend = friendship.friend;

                if (!user || !friend)
                {
                    console.log(`Invalid friendship data`);
                    return;
                }
                const currentUserId = Number(this.userId);
                const selectedFriend = (user.id === currentUserId) ? friend : user;
                const status = selectedFriend.status || 'invisible';

                const friendItem = document.createElement('div');
                friendItem.className = "friend-item flex items-center gap-3 p-2 rounded-sm hover:bg-gray-100 cursor-pointer transition";

                // on stocke tout
                friendItem.dataset.id = selectedFriend.id;
                friendItem.dataset.friendshipId = friendship.id;
                friendItem.dataset.username = selectedFriend.alias;
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

                // on ajoute a la liste
                contactsList.appendChild(friendItem);
                
                // ouverture du chat
                friendItem.addEventListener('click', () => {
                    const event = new CustomEvent('friendSelected', { 
                        detail: {
                            friend: selectedFriend,
                            friendshipId: friendship.id
                        } 
                    });
                    window.dispatchEvent(event);
                });
            });

        } catch (error) {
            console.error("Error loading friends:", error);
            contactsList.innerHTML = '<div class="text-xs text-red-400 ml-2">Error loading contacts</div>';
        }
    }


    private setupBlockListener() {
        window.addEventListener('friendBlocked', (e: any) => {
            const blockedUsername = e.detail?.username;
            if (!blockedUsername || !this.container) return;

            // element html qui correspond
            const friendToRemove = this.container.querySelector(`.friend-item[data-username="${blockedUsername}"]`);

            if (friendToRemove) {
                // suppression
                (friendToRemove as HTMLElement).style.opacity = '0';
                setTimeout(() => {
                    friendToRemove.remove();

                    // message par defaut
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
        
            // ouverture ou fermeture du dropdown
            addFriendButton.addEventListener('click', (e) => {
                e.stopPropagation();
                addFriendDropdown.classList.toggle('hidden');
                
                // fermeture des autres menus
                document.getElementById('status-dropdown')?.classList.add('hidden');
                
                if (!addFriendDropdown.classList.contains('hidden')) {
                    friendSearchInput.focus();
                }
            });
    
            // envoi de la demande d'ami -> quel route on choisi>
            const sendFriendRequest = async () => {
                const searchValue = friendSearchInput.value.trim(); // onretire les espaces etc
                
                if (!searchValue) { // si vide alors message d;erreur
                    this.showFriendMessage('Please enter a username or email', 'error', friendRequestMessage);
                    return;
                }
    
                const userId = localStorage.getItem('userId');
    
                try {
                    const response = await fetchWithAuth(`/api/users/${userId}/friendships`, { // on lance la requete sur cette route
                        method: 'POST', // post pour creer la demande
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ alias: searchValue })
                    });
    
                    const data = await response.json();
    
                    if (response.ok) {
                        this.showFriendMessage('Friend request sent!', 'success', friendRequestMessage); // si ok alors la friend request en envoyee
                        
                        const targetId = data.data.friend_id || data.data.friend?.id;
                        if (targetId) {
                            SocketService.getInstance().socket.emit('sendFriendRequestNotif', { 
                                targetId: targetId 
                            });
                        }
                        
                        friendSearchInput.value = '';
                        
                        setTimeout(() => { // timeout pour pas garder le menu ouvert indefiniment
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
    
            // clic sur envoyer
            sendFriendRequestButton.addEventListener('click', sendFriendRequest);
            
            friendSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    sendFriendRequest();
                }
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

    // affichage pour l'utilisateur
    private showFriendMessage(message: string, type: 'success' | 'error', element: HTMLElement | null) {
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden', 'text-green-600', 'text-red-600');
            element.classList.add(type === 'success' ? 'text-green-600' : 'text-red-600');
        }
    };

    // Configuration des écouteurs pour le bouton notif (exécuté une seule fois)
    private setupNotifications() {
        const notifButton = document.getElementById('notification-button');
        const notifDropdown = document.getElementById('notification-dropdown');

        if (notifButton && notifDropdown) {
            notifButton.addEventListener('click', (e) => {
                e.stopPropagation();
                notifDropdown.classList.toggle('hidden');
                document.getElementById('add-friend-dropdown')?.classList.add('hidden');
                if (!notifDropdown.classList.contains('hidden')) {
                    this.checkNotifications(); // Appel méthode classe
                }
            });
            document.addEventListener('click', (e) => {
                if (!notifDropdown.contains(e.target as Node) && !notifButton.contains(e.target as Node))
                    notifDropdown.classList.add('hidden');
            });
        }
    }

    // Récupération des données (Méthode de classe indépendante)
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

            // Modif ligne 231 la req est de type Friendship
            pendingList.forEach((req: Friendship) => {
                const item = document.createElement('div');
                item.dataset.friendshipId = req.id.toString();
                item.className = "flex items-start p-4 border-b border-gray-200 gap-4 hover:bg-gray-50 transition";

                // Modif ligne 240 de ${req.alias} à ${req.user?.alias}
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

                // On utilise this.handleRequest (les écouteurs sont attachés ici)
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

    // On ajoute requesterId en premier argument
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
                        this.loadFriends(); // Recharge MA liste (User2)
                        
                        // --- AJOUT : Prévenir l'autre (User1) ---
                        SocketService.getInstance().socket.emit('acceptFriendRequest', { 
                            targetId: requesterId 
                        });
                    }
                    // Appel correct via 'this'
                    this.checkNotifications(); 
                }, 300);
            } else {
                console.error("Failed to update request");
            }
        } catch (error) {
            console.error("Network error", error);
        }
    };

    private listenToUpdates() {
        const socket = SocketService.getInstance().socket;
        if (!socket) return;
        
        socket.on("friendStatusUpdate", (data: { username: string, status: string }) => {
            console.log(`Status update for ${data.username}: ${data.status}`);
            this.updateFriendUI(data.username, data.status);
        });

        socket.on("userConnected", (data: { username: string, status: string }) => {
             const currentUsername = localStorage.getItem('username');
             if (data.username !== currentUsername) {
                this.updateFriendUI(data.username, data.status);
             }
        });

        socket.on('receiveFriendRequestNotif', () => {
            console.log("New friend request received !");
            // On peut maintenant appeler checkNotifications car c'est une méthode de classe
            this.checkNotifications(); 
        });


        socket.on('friendRequestAccepted', () => {
            console.log("Friend request has been accepted !");
            this.loadFriends();
        });
    }


    private updateFriendUI(username: string, newStatus: string) {
        //  maj point de connexion
        const friendItems = document.querySelectorAll('.friend-item');
        friendItems.forEach((item) => {
            const el = item as HTMLElement;
            if (el.dataset.username === username) {
                el.dataset.status = newStatus;
                const statusImg = el.querySelector('img[alt="status"]') as HTMLImageElement;
                if (statusImg) {
                    statusImg.src = getStatusDot(newStatus);
                }
            }
        });
    }
}