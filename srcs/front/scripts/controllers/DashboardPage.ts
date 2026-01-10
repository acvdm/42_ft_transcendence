import htmlContent from "../pages/DashboardPage.html";
import { applyTheme } from "../components/ProfilePage";
import { fetchWithAuth } from "../services/api";
import { Chart } from "chart.js/auto";

// Match's info interface
interface MatchHistoryElement {
	match_id: number;
	game_type: string;
	finished_at: string;
	is_winner: number;
	my_score: number;
	opponent_score: number;
	opponent_alias: string;
	round: string;
}

// User's stat interface
interface UserStats {
	wins: number;
	losses: number;
	total_games: number;
	averageScore?: number;
	total_play_time_minutes?: number;
	totalPlayTime: number;
}

// Global variable for each canvas
let evolutionChart: Chart | null = null;
let gameTypeChart: Chart | null = null;
let rivalChart: Chart | null = null;
let globalMatchHistory: MatchHistoryElement[] = []

export function render(): string { return htmlContent; }

export function afterRender(): void {
	
	// Statistics
	const totalGame = document.getElementById('dashboard-total-games');
	const avgScore = document.getElementById('dashboard-avg-score');
	const playTime = document.getElementById('dashboard-play-time');
	const wins = document.getElementById('dashboard-wins');
	const losses = document.getElementById('dashboard-losses');
	const winRateCalcul = document.getElementById('dashboard-win-rate');

	// Canvas
	const evolutionCanvas = document.getElementById('dashboard-evolution-graph') as HTMLCanvasElement;
	const gameTypeCanvas = document.getElementById('dashboard-game-chart') as HTMLCanvasElement;
    const rivalCanvas = document.getElementById('dashboard-rival-podium') as HTMLCanvasElement;
	
	// Match analysis
	const filterOpponent = document.getElementById('filter-opponent') as HTMLInputElement;
    const filterMode = document.getElementById('filter-mode') as HTMLSelectElement;
    const sortOrder = document.getElementById('sort-order') as HTMLSelectElement;
    const applyFilterButton = document.getElementById('apply-filters');

	// Current theme for header
	const currentTheme = localStorage.getItem('userTheme') || 'basic';
	applyTheme(currentTheme);


	//================================================
	//============ RETRIEVING USER'S DATA ============
	//================================================

	const loadUserData = async () => {
		
		const userId = localStorage.getItem('userId');
		if (!userId) {
			return;
		}

		try {

			// User's statistic
			const statResponse = await fetchWithAuth(`/api/game/users/${userId}/stats`);
			if (statResponse.ok) {
				const jsonResponse = await statResponse.json();
				const statsData: UserStats = jsonResponse.data || jsonResponse;

				if (statsData) {
					if (totalGame) totalGame.innerText = statsData.total_games.toString();
					if (wins) wins.innerText = statsData.wins.toString();
					if (losses) losses.innerText = statsData.losses.toString();
					if (avgScore) avgScore.innerText = statsData.averageScore?.toString() || "0";
                    if (winRateCalcul && statsData.total_games > 0) {
						winRateCalcul.innerText = `${Math.round((statsData.wins / statsData.total_games) * 100)}%`;
					}
                    if (playTime) {
                        const totalMinutes = statsData.total_play_time_minutes || statsData.totalPlayTime || 0;
                        playTime.innerText = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min`;
                    }
				}
			}

			// Match analysis
			const historyResponse = await fetchWithAuth(`/api/game/users/${userId}/history?userId=${userId}&LIMIT=250`); // Est-ce qu'on augmente la limite?
			if (historyResponse.ok) {
				const historyJson = await historyResponse.json();
				const historyData: MatchHistoryElement[] = historyJson.data || [];
				globalMatchHistory = historyData;

				renderGameTypeChart(gameTypeCanvas, calculateGameDistribution(historyData));
				renderEvolutionChart(evolutionCanvas, calculateEvolutionData(historyData));
				renderRivalChart(rivalCanvas, calculateRivalsPodium(historyData));

				// Calling sort function now to show the full list
				setupFilters();
			}
		} catch (error) {
			console.error("Error on dashboard:", error);
		}
	};

	// Loading the data anytime with update the page or when there are new stats
	loadUserData();


	//================================================
	//========== FILTER AND SORT MANAGEMENT ==========
	//================================================

	function setupFilters() {
		
		if (!applyFilterButton || !filterOpponent || !filterMode || !sortOrder) {
			return;
		}

		const applyFiltersAndSort = () => {
			const opponentValue = filterOpponent.value.toLowerCase().trim();
			const modeValue = filterMode.value;
			const sortValue = sortOrder.value;

			// Filtering
			let resultData = globalMatchHistory.filter(match => {
				const matchOpponent = (match.opponent_alias || "").toLowerCase();
				const matchType = (match.game_type || "").toLowerCase();
				const matchName = opponentValue === "" || matchOpponent.includes(opponentValue);
				const matchMode = modeValue === "all" || matchType.includes(modeValue);
				return matchName && matchMode;
			});

			// Sorting
			resultData.sort((a, b) => {
				const dateA = new Date(a.finished_at).getTime();
				const dateB = new Date(b.finished_at).getTime();
				const nameA = (a.opponent_alias || "").toLowerCase();
				const nameB = (b.opponent_alias || "").toLowerCase();

				switch (sortValue) {
					case 'date-ascending':
						return dateA - dateB;
					case 'date-descending':
						return dateB - dateA;
					case 'name-ascending':
						return nameA.localeCompare(nameB);
					case 'name-descending':
						return nameB.localeCompare(nameA);;
					default:
						return dateB - dateA;
				}
			});

			// Showing sorted list updated
			renderMatchHistoryList(resultData);
		};

		// Listening events
		applyFilterButton.addEventListener('click', applyFiltersAndSort);
		filterOpponent.addEventListener('keyup', (e) => {
			if (e.key === 'Enter') {
				applyFiltersAndSort();
			}
		});

		// Immediat filter/sort
		filterMode.addEventListener('change', applyFiltersAndSort);
		sortOrder.addEventListener('changer', applyFiltersAndSort);

		// Default list
		applyFiltersAndSort();
	}


	//================================================
	//=========== RENDERING MATCH ANALYSIS ===========
	//================================================

	function renderMatchHistoryList(history: MatchHistoryElement[]) {
		
		const listContainer = document.getElementById('match-history-list');
		if (!listContainer) {
			return;
		}

		listContainer.innerHTML = '';

		if (history.length === 0) {
			listContainer.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-gray-400 italic">No matches yet.</td></tr>`;
			return;
		}

		// Sort has already been made before. Only iterating here.
		history.forEach(match => {
			const date = new Date(match.finished_at);
			const dateString = `${date.getDate().toString().padStart(2,'0')}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getFullYear()}`;
			const isWin = match.is_winner === 1;
			const resultText = isWin ? "VICTORY" : "DEFEAT";
			const resultColor = isWin ? "text-green-600" : "text-red-500";
			const scoreString = `${match.my_score} - ${match.opponent_score !== undefined ? match.opponent_score : 0}`;
			const roundString = match.round ? match.round : (match.game_type === 'tournament' ? 'Final' : '1v1');
			
			// Adding a new row for each new match
			const row = document.createElement('tr');
			row.className = "hover:bg-blue-50 transition-colors border-b border-gray-100 group";

			row.innerHTML = `
                <td class="py-2 text-gray-500">${dateString}</td>
                <td class="py-2 font-semibold text-gray-700 truncate px-2" title="${match.opponent_alias}">${match.opponent_alias || 'Unknown'}</td>
                <td class="py-2 font-mono text-gray-600 font-bold">${scoreString}</td>
                <td class="py-2 font-mono text-gray-500 capitalize">${match.game_type || 'Local'}</td>
                <td class="py-2 font-mono text-gray-400 capitalize">${roundString}</td>
                <td class="py-2 font-bold ${resultColor}">${resultText}</td>
            `;

			listContainer.appendChild(row);
		});
	}


	//================================================
	//=========== CALCULATE GAME TYPE GRAPH ==========
	//================================================

	function calculateGameDistribution(history: MatchHistoryElement[]) {
		
		const graph = { local: 0, remote: 0, tournament: 0 };

		history.forEach(match => {
			const type = (match.game_type || "").toLowerCase();

			if (type.includes('tournament')) {
				graph.tournament++;
			} else if (type.includes('remote')) {
				graph.remote++;
			} else {
				graph.local++;
			}
		});
		return graph;
	}


	//================================================
	//=========== CALCULATE EVOLUTION GRAPH ==========
	//================================================

	function calculateEvolutionData(history: MatchHistoryElement[]) {
		
		if (!history || history.length === 0) {
			return { labels: ['Start'], data: [0] };
		}

		// Cloning tab with [...] to not change original one
		const sorted = [...history].sort((a, b) => new Date(a.finished_at).getTime() - new Date(b.finished_at).getTime()); // besoin d'explication ici
		const labels: string[] = [];
		const netScoreData: number[] = [];

		let currentNetScore = 0;

		sorted.forEach(match => {
			const date = new Date(match.finished_at);
            const dateLabel = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
			if (match.is_winner === 1) {
				currentNetScore++;
			} else {
				currentNetScore--;
			}

			labels.push(dateLabel);
			netScoreData.push(currentNetScore);
		});
		return { labels, data: netScoreData };
	}


	//================================================
	//============= CALCULATE RIVAL PODIUM ===========
	//================================================

	function calculateRivalsPodium(history: MatchHistoryElement[]) {

		const rivalsMap: { [key: string]: number } = {};
		history.forEach(match => {

			if (match.opponent_alias && match.opponent_alias !== 'Unknown') {
				rivalsMap[match.opponent_alias] = (rivalsMap[match.opponent_alias] || 0) + 1;
			}
		});

		const sortedRivals = Object.entries(rivalsMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
		if (sortedRivals.length === 0) {
			return { labels: [], data: [], colors: [], realCounts: [] };
		}

		const podiumLabels = []; const podiumHeights = []; const podiumRealCounts = []; const podiumColors = [];
        if (sortedRivals.length >= 2) {
            podiumLabels.push(sortedRivals[1][0]); podiumHeights.push(2); podiumRealCounts.push(sortedRivals[1][1]); podiumColors.push('rgba(192, 192, 192, 0.8)');
        }
        if (sortedRivals.length >= 1) {
            podiumLabels.push(sortedRivals[0][0]); podiumHeights.push(3); podiumRealCounts.push(sortedRivals[0][1]); podiumColors.push('rgba(255, 215, 0, 0.8)');
        }
        if (sortedRivals.length >= 3) {
            podiumLabels.push(sortedRivals[2][0]); podiumHeights.push(1); podiumRealCounts.push(sortedRivals[2][1]); podiumColors.push('rgba(205, 127, 50, 0.8)');
        }
		return { labels: podiumLabels, data: podiumHeights, realCounts: podiumRealCounts, colors: podiumColors };
	}


	//================================================
	//=========== RENDERING EVOLUTION CHART ==========
	//================================================

	function renderEvolutionChart(canvas: HTMLCanvasElement, chartData: any) {

		if (!canvas) {
			return;
		}
		if (evolutionChart) {
			evolutionChart.destroy();
		}

		const mainColor = 'rgba(59, 130, 246, 1)';
		const bgColor = 'rgba(59, 130, 246, 0.1)';
		evolutionChart = new Chart(canvas, {
			type: 'line',
			data: {
				labels: chartData.labels,
				datasets: [{
					label: 'Net Score', data: chartData.data, borderColor: mainColor, backgroundColor: bgColor, fill:true, tension: 0.3, pointRadius: 2, pointHoverRadius: 5
				}]
			},
			options: {
				responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
				scales: { x: { display: true, grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: { display: true, grid: { color: (ctx) => ctx.tick.value === 0 ? '#666' : '#eee', lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1 } } }
			}
		});
	}


	//================================================
	//============== RENDERING GAME TYPE =============
	//================================================

	function renderGameTypeChart(canvas: HTMLCanvasElement, graph: { local: number, remote: number, tournament: number }) {

		if (!canvas) {
			return ;
		}
		if (gameTypeChart) {
			gameTypeChart.destroy();
		}

		const total = graph.local + graph. remote + graph.tournament;
		const isEmpty = total === 0;

		gameTypeChart = new Chart(canvas, {
			type: 'pie',
			data: {
				labels: isEmpty ? ['No Data'] : ['Local', 'Remote', 'Tournament'],
				datasets: [{ data: isEmpty ? [1] : [graph.local, graph.remote, graph.tournament], backgroundColor: isEmpty ? ['#ddd'] : ['#3b82f6', '#a855f7', '#f97316'], borderWidth: 0 }]
			},
			options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } } }
		});
	}


	//================================================
	//============ RENDERING RIVAL PODIUM ============
	//================================================

	function renderRivalChart(canvas: HTMLCanvasElement, data: any) {
		if (!canvas) {
			return;
		}
		if (rivalChart) {
			rivalChart.destroy();
		}

		rivalChart = new Chart(canvas, {
			type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{ label: 'Games Played', data: data.data, backgroundColor: data.colors, borderRadius: 4, borderSkipped: false, barPercentage: 1.0, categoryPercentage: 1.0 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `Games played: ${data.realCounts[context.dataIndex]}` } } },
                scales: { y: { display: false, beginAtZero: true }, x: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' }, callback: function(val, index) { const name = data.labels[index]; const count = data.realCounts[index]; const displayName = name.length > 10 ? name.substr(0, 8) + '..' : name; return [`${displayName}`, `(${count} games)`]; } } } }
            }
		});
	}
}