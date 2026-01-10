import { fetchWithAuth } from "../services/api";
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
        streak: HTMLElement | null;
        avgScore: HTMLElement | null;
        winRate: HTMLElement | null;
        opponent: HTMLElement | null;
        favGame: HTMLElement | null;

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
            streak: document.getElementById('friend-stat-streak'),
            avgScore: document.getElementById('friend-stat-average-score'),
            winRate: document.getElementById('friend-stat-win-rate'),
            opponent: document.getElementById('friend-stat-opponent'),
            favGame: document.getElementById('friend-stat-fav-game')
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
            
            const [userRes, statsRes] = await Promise.all([
                fetchWithAuth(`api/user/${friendId}`),
                fetchWithAuth(`api/game/users/${friendId}/stats`)
            ]);

            if (userRes.ok) {
                const user = await userRes.json();

                let stats = null;
                if (statsRes.ok) {
                    const statsJson = await statsRes.json();
                    stats = statsJson.data || statsJson;
                }
            
                this.updateUI(user, stats);
                this.modal.classList.remove('hidden');
                this.modal.classList.add('flex');
            }
        } catch (error) {
            console.error("Error modal:", error);
        }
    }

    private updateUI(user: any, stats: any) {
        if (this.avatar) this.avatar.src = user.avatar_url || user.avatar || "/assets/basic/default.png";
        if (this.status && user.status) this.status.src = statusImages[user.status.toLowerCase()] || statusImages['invisible'];
        if (this.username) this.username.innerText = user.alias;
        if (this.bio) this.bio.innerHTML = user.bio ? parseMessage(user.bio) : "No bio.";

        if (stats) {
            const gamesPlayed = stats.total_games ?? stats.totalGames ?? 0;
            const wins = stats.wins || 0;
            
            if (this.stats.games) this.stats.games.innerText = gamesPlayed.toString();
            if (this.stats.wins) this.stats.wins.innerText = wins.toString();
            if (this.stats.losses) this.stats.losses.innerText = (stats.losses || 0).toString();
            if (this.stats.streak) this.stats.streak.innerText = (stats.streak ?? 0).toString();
            if (this.stats.avgScore) this.stats.avgScore.innerText = (stats.average_score ?? 0).toString();
            
            if (this.stats.winRate) {
                let rate = 0;
                if (gamesPlayed > 0) {
                    rate = Math.round((wins / gamesPlayed) * 100);
                }
                this.stats.winRate.innerText = `${rate}%`;
            }

            if (this.stats.opponent) this.stats.opponent.innerText = stats.biggest_opponent || "-";
            if (this.stats.favGame) this.stats.favGame.innerText = stats.favorite_game || "Local";

        } else {
            Object.values(this.stats).forEach(el => {
                if (el) el.innerText = el === this.stats.opponent || el === this.stats.favGame ? "-" : "0";
            });
            if (this.stats.winRate) this.stats.winRate.innerText = "0%";
        }
    }
}