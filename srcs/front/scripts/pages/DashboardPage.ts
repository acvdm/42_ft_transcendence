import htmlContent from "../pages/DashboardPage.html"
import { applyTheme } from "./ProfilePage";
import { fetchWithAuth } from "./api";

interface UserStats {
	wins: number;
	losses: number;
	total_games: number;

	averageScore?: number;
	current_win_streak?: number;
	biggest_opponent?: string;
	favorite_game?: string;
}

export function render(): string {
    return htmlContent;
}

export function afterRender(): void {
	const totalGame = document.getElementById('dashboard-total-games');
	const avgScore = document.getElementById('dashboard-avg-score');
	const playTime = document.getElementById('dashboard-play-time');
	const wins = document.getElementById('dashboard-wins');
	const losses = document.getElementById('dashboard-losses');
	const winRateCalcul = document.getElementById('dashboard-win-rate');
	const evolutionGraph = document.getElementById('dashboard-evolution-graph');
	const typeGameChart = document.getElementById('dashboard-game-chart');
	const rivalPodium = document.getElementById('dashboard-rival-podium');
	const filterRival = document.getElementById('filter-opponent');
	const filterMode = document.getElementById('filter-mode') as HTMLInputElement;
	const applyFIlter = document.getElementById('apply-filter');



    const currentTheme = localStorage.getItem('userTheme') || 'basic';
    applyTheme(currentTheme);


	const loadUserData = async () => {
			const userId = localStorage.getItem('userId');
			if (!userId)
				return;
			
			try {
				// on recuperer les infos user
				const response = await fetchWithAuth(`api/user/${userId}`);
				
				if (response.ok) {
					const statResponse = await fetchWithAuth(`/api/game/users/${userId}/stats`);
					if (statResponse.ok) {
						const jsonResponse = await statResponse.json();
						console.log("Stats reçues du Backend:", jsonResponse);
						const stats: UserStats = jsonResponse.data || jsonResponse;
	
						const streak = document.getElementById('stats-streak');
						const opponent = document.getElementById('stats-opponent');
						const favGame = document.getElementById('stats-fav-game');
	
						if (stats) {
							if (totalGame) totalGame.innerText = stats.total_games.toString();
							if (wins) wins.innerText = stats.wins.toString();
							if (losses) losses.innerText = stats.losses.toString();
							
							if (winRateCalcul) {
								let rateValue = 0;
								if (stats.total_games > 0) {
									rateValue = Math.round((stats.wins / stats.total_games) * 100);
								}
								winRateCalcul.innerText = `${rateValue}%`;
							}
	
							if (avgScore) avgScore.innerText = stats.averageScore?.toString() || "0";
							if (streak) streak.innerText = stats.current_win_streak?.toString() || "0";
							if (opponent) opponent.innerText = stats.biggest_opponent || "-";
							if (favGame) favGame.innerText = stats.favorite_game || "Local";
						}
					} else {
						console.warn("Could not fetch user stats");
					}
				}
			} catch (error) {
				console.error("Erreur while charging profile:", error);
			}
		};
	

		loadUserData();
}