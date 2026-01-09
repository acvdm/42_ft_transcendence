import htmlContent from "../pages/DashboardPage.html"
import { applyTheme } from "./ProfilePage";
import { fetchWithAuth } from "./api";
import { Chart } from "chart.js/auto"; // auto permet d'importer les composants nécéssaires

interface UserStats {
	wins: number;
	losses: number;
	total_games: number;
	averageScore?: number;
	current_win_streak?: number;
	biggest_opponent?: string;
	favorite_game?: string;
	history?: { date: string, result: 'win' | 'loss'}[];
	gameType?: { local: number, remote: number, tournament: number };
}

// variables globales pour stocker les instances de graphique
let evolutionChartInstance: Chart | null = null;
let gameTypeChartInstance: Chart | null = null;

export function render(): string {
    return htmlContent;
}

export function afterRender(): void {
	// les stats
	const totalGame = document.getElementById('dashboard-total-games');
	const avgScore = document.getElementById('dashboard-avg-score');
	const playTime = document.getElementById('dashboard-play-time');
	const wins = document.getElementById('dashboard-wins');
	const losses = document.getElementById('dashboard-losses');
	const winRateCalcul = document.getElementById('dashboard-win-rate');

	// les graphs
	const evolutionCanvas = document.getElementById('dashboard-evolution-graph');
	const gameTypeCanvas = document.getElementById('dashboard-game-chart');
	
	// gestion du thème
    const currentTheme = localStorage.getItem('userTheme') || 'basic';
    applyTheme(currentTheme);


	const loadUserData = async () => {
		const userId = localStorage.getItem('userId');
		if (!userId)
			return;
			
		try {
			// Récupération des infos user
			await fetchWithAuth(`api/user/${userId}`);
			const statResponse = await fetchWithAuth(`/api/game/users/${userId}/stats`);
			
			if (statResponse.ok) {
				const jsonResponse = await statResponse.json();
				console.log("Stats reçues du Backend:", jsonResponse);
				const stats: UserStats = jsonResponse.data || jsonResponse;

				if (stats) {
					if (totalGame) totalGame.innerText = stats.total_games.toString();
					if (wins) wins.innerText = stats.wins.toString();
					if (losses) losses.innerText = stats.losses.toString();
					if (avgScore) avgScore.innerText = stats.averageScore?.toString() || "0";
							
					if (winRateCalcul) {
						let rateValue = 0;
						if (stats.total_games > 0) {
							rateValue = Math.round((stats.wins / stats.total_games) * 100);
						}
						winRateCalcul.innerText = `${rateValue}%`;
					}

					//////// Génération du graphique d'évolution
					const mockHistoryData = generateMockHistory(stats.wins, stats.losses);
					renderEvolutionChart(evolutionCanvas, mockHistoryData);

					//////// Génération du graphique de mode de jeu
					const distribution = stats.gameType || {
						local: Math.round(stats.total_games * 0.4),
						remote: Math.round(stats.total_games * 0.4),
						tournament: Math.round(stats.total_games * 0.2)
					};
					renderGameTypeChart(gameTypeCanvas, distribution);

				} else {
				console.warn("Could not fetch user stats");
				}
			}
		} catch (error) {
			console.error("Erreur while charging profile:", error);
		}
	};

	loadUserData();
	

	//=============================================
	//======== RENDERING EVOLUTION CHART ==========
	//=============================================

	// function renderEvolutionChart(c)



}