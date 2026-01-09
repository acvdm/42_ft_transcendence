import htmlContent from "../pages/DashboardPage.html"
import { applyTheme } from "./ProfilePage";

export function render(): string {
    return htmlContent;
}

export function afterRender(): void {
	const dashboardOverview = document.getElementById('dashboard-overview');
	const totalGames = document.getElementById('dashboard-total-games');
	const avgScore = document.getElementById('dashboard-avg-score');
	const playTime = document.getElementById('dashboard-play-time');
	const totalWins = document.getElementById('dashboard-wins');
	const totalLosses = document.getElementById('dashboard-losses');
	const winRate = document.getElementById('dashboard-win-rate');
	const evolutionGraph = document.getElementById('dashboard-evolution-graph');
	const typeGameChart = document.getElementById('dashboard-game-chart');
	const rivalPodium = document.getElementById('dashboard-rival-podium');
	const filterRival = document.getElementById('filter-opponent');
	const filterMode = document.getElementById('filter-mode');
	const applyFIlter = document.getElementById('apply-filter');



    const currentTheme = localStorage.getItem('userTheme') || 'basic';
    applyTheme(currentTheme);
}