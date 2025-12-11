import { fetchWithAuth } from "../pages/api";
import { statusImages } from "./Data";
import { parseMessage } from "./ChatUtils";

export class FriendProfileModal {
    private modal: HTMLElement | null;
    private closeButton: HTMLElement | null;
    private closeButtonBottom: HTMLElement | null;
    
    private avatar: HTMLImageElement | null;
    private status: HTMLImageElement | null;
    private username: HTMLElement | null;
    private bio: HTMLElement | null;
    private stats: {
        games: HTMLElement | null;
        wins: HTMLElement | null;
        losses: HTMLElement | null;
        rank: HTMLElement | null;
    };

    constructor() {
        this.modal = document.getElementById('friend-profile-modal');
        this.closeButton = document.getElementById('close-friend-modal');
        this.closeButtonBottom = document.getElementById('close-friend-modal-button');

        this.avatar = document.getElementById('friend-modal-avatar') as HTMLImageElement;
        this.status = document.getElementById('friend-modal-status') as HTMLImageElement;
        this.username = document.getElementById('friend-modal-username');
        this.bio = document.getElementById('friend-modal-bio');
        
        this.stats = {
            games: document.getElementById('friend-stat-games'),
            wins: document.getElementById('friend-stat-wins'),
            losses: document.getElementById('friend-stat-losses'),
            rank: document.getElementById('friend-stat-rank')
        };

        this.initListeners();
    }

    private initListeners() {
        const close = () => this.modal?.classList.add('hidden');

        this.closeButton?.addEventListener('click', close);
        this.closeButtonBottom?.addEventListener('click', close);
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) close();
        });
    }

	// on appelle cette methode dans homepage
    public async open(friendId: number) {
        if (!this.modal || !friendId) return;

        try {
            // loading pour les millisecondes 
            if (this.username) this.username.innerText = "Loading...";
            
            const userRes = await fetchWithAuth(`api/users/${friendId}`);
            // const statsRes = await fetchWithAuth(`api/users/${friendId}/stats`);

            if (userRes.ok) {
                const user = await userRes.json();
                this.updateUI(user);
                this.modal.classList.remove('hidden');
                this.modal.classList.add('flex');
            }
        } catch (error) {
            console.error("Error modal:", error);
        }
    }

    private updateUI(user: any) {
        if (this.avatar) this.avatar.src = user.avatar_url || user.avatar || "https://wlm.vercel.app/assets/usertiles/default.png";
        if (this.status && user.status) this.status.src = statusImages[user.status.toLowerCase()] || statusImages['invisible'];
        if (this.username) this.username.innerText = user.alias;
        if (this.bio) this.bio.innerHTML = user.bio ? parseMessage(user.bio) : "No bio.";

        // state en dur pour le moment
        if (this.stats.games) this.stats.games.innerText = user.games_played || "0";
        if (this.stats.wins) this.stats.wins.innerText = user.wins || "0";
    }
}