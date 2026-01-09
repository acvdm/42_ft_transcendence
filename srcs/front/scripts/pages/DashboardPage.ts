import htmlContent from "../pages/DashboardPage.html"
import { applyTheme } from "./ProfilePage";
import { fetchWithAuth } from "./api";


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
	
						const totalGame = document.getElementById('stats-total-games');
						const wins = document.getElementById('stats-wins');
						const losses = document.getElementById('stats-losses');
						const winRateCalcul = document.getElementById('stats-win-rate');
						const avgScore = document.getElementById('stats-average-score');
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
	
	
					// maj theme
					if (user.theme) {
						localStorage.setItem('userTheme', user.theme);
						applyTheme(user.theme);
					}
					// maj avatar si on arrive a le recuperer
					if (user.avatar_url && mainAvatar) {
						mainAvatar.src = user.avatar_url;
						// maj de selected image pour que la modale ait l'image mis a jour
						selectedImageSrc = user.avatar_url; 
					}
	
					if (user.is2faEnabled !== undefined) {
						update2faButton(user.is2faEnabled);
					}
	
					// initialisation des champs
					fieldContainers.forEach(container => {
						const fieldName = container.dataset.field;
						const display = container.querySelector('.field-display') as HTMLParagraphElement;
						const input = container.querySelector('.field-input') as HTMLInputElement;
	
						if (fieldName && display && input) {
							let value: string | undefined;
	
							if (fieldName === 'alias') {
								value = user.alias || '';
								if (usernameDisplay)
									usernameDisplay.innerText = value;
							} else if (fieldName === 'bio') {
								value = user.bio || '';
								if (bioDisplay)
									bioDisplay.innerHTML = parseMessage(value) || "Share a quick message";
							} else if (fieldName === 'email') {
								value = user.email || '';
							} else if (fieldName === 'password') {
								value = "********"; 
							}
	
							// Mise à jour de l'affichage pour tous les champs
							if (value !== undefined) {
								display.innerText = value || (fieldName === 'email' ? 'No email' : 'Empty');
								if (fieldName !== 'password') {
									input.placeholder = value || "Empty";
								}
							}
						}
					});
	
	
					// maj du status
					if (user.status) {
						const normalizedStatus = user.status.toLowerCase();
						const statusValue = reverseStatusMapping[normalizedStatus] || 'Appear offline';
						if (statusSelect) statusSelect.value = statusValue;
						updateStatusFrame(normalizedStatus);
					}
	
					//logique change/confirme
					fieldContainers.forEach(container => {
						if (container.dataset.field === 'password') return;
	
						const display = container.querySelector('.field-display') as HTMLParagraphElement;
						const input = container.querySelector('.field-input') as HTMLInputElement;
						const changeButton = container.querySelector('.change-button') as HTMLButtonElement;
						const confirmButton = container.querySelector('.confirm-button') as HTMLButtonElement;
						
						if (display && input && changeButton && confirmButton) {
							const fieldElements: FieldElements = { container, display, input, changeButton, confirmButton };
							setupField(fieldElements, container.dataset.field as string);
						}
					});
	
	
	
	
				}
			} catch (error) {
				console.error("Erreur while charging profile:", error);
			}
		};
	
}