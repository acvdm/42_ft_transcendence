import htmlContent from "./ProfilePage.html";
import { fetchWithAuth } from "./api";
import { parseMessage } from "../components/ChatUtils";
import { appThemes } from "../components/Data";
import SocketService from "../services/SocketService";

// interface qui va servir à typer la réponse API de l'utilisateur
interface UserData {
	id: number;
	alias: string;
	avatar_url?: string;
	bio?: string;
	status?: string;
	email?: string;
	theme?: string;
	is2faEnabled?: boolean;
}

interface UserStats {
	wins: number;
	losses: number;
	total_games: number;
}

export function render(): string {
	return htmlContent;
}

export function applyTheme(themeKey: string) {
	const theme = appThemes[themeKey] || appThemes['basic'];
	localStorage.setItem('userTheme', themeKey);

	const navbar = document.getElementById('main-navbar');
	if (navbar) {
		navbar.style.background = theme.navColor;
	}

	const headerIds = ['profile-header', 'home-header'];
	headerIds.forEach(id => {
		const header = document.getElementById(id);
		if (header) {
			header.style.backgroundImage = `url(${theme.headerUrl})`;
		}
	});

	const body = document.getElementById('app-body');
	if (body) {
		// ON DEGAGE les trucs deja implantes
		body.className = "m-0 p-0 overflow-x-auto min-w-[1000px] min-h-screen";
		
		// passage par css 
		body.style.background = theme.bgColor;
		body.style.backgroundRepeat = "no-repeat";
		body.style.backgroundAttachment = "fixed"; 
	}
}

interface FieldElements {
	container: HTMLElement;
	display: HTMLParagraphElement;
	input: HTMLInputElement;
	changeButton: HTMLButtonElement;
	confirmButton: HTMLButtonElement;
}

export function afterRender(): void {

	
	const mainAvatar = document.getElementById('current-avatar') as HTMLImageElement;
	const statusFrame = document.getElementById('current-statut') as HTMLImageElement;
	const usernameDisplay = document.getElementById('username-profile');
	const bioDisplay = document.getElementById('bio-profile');
	const modal = document.getElementById('picture-modal');
	
	// username et bio
	const statusSelect = document.querySelector('select') as HTMLSelectElement;
	const fieldContainers = document.querySelectorAll<HTMLElement>('.flex.flex-row.gap-2[data-field]');

	
	// boutons
	const editButton = document.getElementById('edit-picture-button');
	const closeButton = document.getElementById('close-modal');
	const cancelButton = document.getElementById('cancel-button');
	const okButton = document.getElementById('validation-button');
	const browseButton = document.getElementById('browse-button');
	const deleteButton = document.getElementById('delete-button');

	// modale avatar
	const gridContainer = document.getElementById('modal-grid');
	const previewAvatar = document.getElementById('modal-preview-avatar') as HTMLImageElement;
	const fileInput = document.getElementById('file-input') as HTMLInputElement;
	
	// modale 2fa - ELEMENTS
	const methodSelection = document.getElementById('method-selection');
	const qrContent = document.getElementById('qr-content');
	const emailContent = document.getElementById('email-content');

	// Correction: utilisation de querySelector pour les attributs data
	const buttonSelectQr = document.querySelector('[data-method="qr"]');
	const buttonSelectEmail = document.querySelector('[data-method="email"]');

	const buttonBackQr = document.getElementById('back-from-qr');
	const buttonBackEmail = document.getElementById('back-from-email');

	// Elements specifiques Email
	const inputEmail2fa = document.getElementById('2fa-email-input') as HTMLInputElement;
	const buttonSendCode = document.getElementById('send-code-button');
	const codeVerif = document.getElementById('code-verification');
	const inputCodeEmail = document.getElementById('2fa-input-code-email') as HTMLInputElement;
	const buttonConfirmEmail = document.getElementById('confirm-2fa-email');
	
	// Elements specifiques QR / Modale globale
	const button2faToggle = document.getElementById('2fa-modal-button') as HTMLImageElement;
	const modal2fa = document.getElementById('2fa-modal') as HTMLImageElement;
	const close2faButton = document.getElementById('close-2fa-modal');
	const cancel2faButton = document.getElementById('cancel-2fa-button');
	const confirm2faQrButton = document.getElementById('confirm-2fa-button');
	const input2faQr = document.getElementById('2fa-input-code') as HTMLInputElement;
	const qrCodeImg = document.getElementById('2fa-qr-code') as HTMLImageElement;


	const userId = localStorage.getItem('userId');

	// on conserve l'url temporaire qu'on a choisir dans la modale
	let selectedImageSrc: string = mainAvatar?.src || "";
	let is2faEnabled = localStorage.getItem('is2faEnabled') === 'true';
	let currentUserEmail: string = "";

	
	const statusImages: { [key: string]: string } = {
		'available': '/assets/basic/status_frame_online_large.png',
		'online': '/assets/basic/status_frame_online_large.png',
		'busy':      '/assets/basic/status_frame_busy_large.png',
		'away':      '/assets/basic/status_frame_away_large.png',
		'invisible': '/assets/basic/status_frame_offline_large.png'
	};

	const statusMapping: { [key: string]: string } = {
		'Available': 'available',
		'Busy': 'busy',
		'Away': 'away',
		'Appear offline': 'invisible'
	};

	const reverseStatusMapping: { [key: string]: string } = {
		'available': 'Available',
		'online': 'Available',
		'busy': 'Busy',
		'away': 'Away',
		'invisible': 'Appear offline'
	};


	// ============================================================
	// ========================= THÈMES ===========================
	// ============================================================

	const themeButton = document.getElementById('theme-button');
	const themeModal = document.getElementById('theme-modal');
	const closeThemeModal = document.getElementById('close-theme-modal');
	const themeGrid = document.getElementById('theme-grid');
	const currentTheme = localStorage.getItem('userTheme') || 'basic'; // theme actuel via localsotirage -> le stocker dans la db?
	applyTheme(currentTheme);

	let selectedThemeElement: HTMLElement | null = null;

	// ouverture modale 
	themeButton?.addEventListener('click', () => {
		themeModal?.classList.remove('hidden');
		themeModal?.classList.add('flex');
	});

	const closeThemeFunc = () => {
		themeModal?.classList.add('hidden');
		themeModal?.classList.remove('flex');
	};
	closeThemeModal?.addEventListener('click', closeThemeFunc);

	if (themeGrid && themeGrid.children.length === 0) {
		Object.entries(appThemes).forEach(([key, theme]) => {
			const div = document.createElement('div');

			div.className = `theme-item cursor-pointer border-2 rounded overflow-hidden transition-all hover:shadow-lg`;
			div.dataset.themeKey = key;
			
			if (key === currentTheme) {
				div.classList.add('border-blue-500', 'shadow-blue-500/50');
				selectedThemeElement = div;
			} else {
				div.classList.add('border-gray-300', 'hover:border-blue-500');
			}

			div.innerHTML = `
				<div class="relative">
					<div class="w-full h-12 bg-cover bg-center" style="background-image: url('${theme.headerUrl}')"></div>
					
					<div class="w-full h-16" style="background: ${theme.bgColor}; background-repeat: no-repeat; background-attachment: fixed;"></div>
				</div>
				
				<div class="p-2 bg-white text-center border-t border-gray-200">
					<span class="text-sm font-bold text-gray-800">${theme.name}</span>
				</div>
			`;

			div.addEventListener('click', function(this: HTMLDivElement) {
				const themeKey = this.dataset.themeKey as string;

				if (selectedThemeElement) {
					selectedThemeElement.classList.remove('border-blue-500', 'shadow-lg');
					selectedThemeElement.classList.add('border-gray-300', 'hover:border-blue-500');
				}
				this.classList.remove('border-gray-300', 'hover:border-blue-500');
				this.classList.add('border-blue-500', 'shadow-lg');
				selectedThemeElement = this;

				applyTheme(themeKey);
				updateTheme(themeKey);
				closeThemeFunc();
			});

			themeGrid.appendChild(div);
		});
	}

	themeModal?.addEventListener('click', (e) => {
		if (e.target === themeModal) closeThemeFunc();
	});


	/* AJOUT CASSAMDRE variable pour stocker la methode choisir */
	let current2FAMethod: 'APP' | 'EMAIL' = 'APP'; // app par defaut si pas specifie


	// ============================================================
	// ==================== GESTION DU 2FA --======================
	// ============================================================
	
	const update2faButton = (enabled: boolean) => {
		is2faEnabled = enabled;
		if (enabled)
		{
			button2faToggle.innerText = "Disable 2FA authentication";
			button2faToggle.classList.remove('bg-green-600');
			button2faToggle.classList.add('bg-red-600');
		} 
		else
		{
			button2faToggle.innerText = "Enable 2FA authentication";
			button2faToggle.classList.remove('bg-red-600');
			button2faToggle.classList.add('bg-green-600');
		}
	};

	update2faButton(is2faEnabled);

	const close2fa = () => {
		if (modal2fa)
		{
			modal2fa.classList.add('hidden');
			modal2fa.classList.remove('flex');
			
			// on reset le tout
			if (input2faQr) input2faQr.value = ""; 
			if (inputCodeEmail) inputCodeEmail.value = "";
			if (qrCodeImg) qrCodeImg.src = "";
		}
	};

	const switch2faView = (view: 'selection' | 'qr' | 'email') => {
		// toutes les modales sont cachées
		methodSelection?.classList.add('hidden');
		qrContent?.classList.add('hidden');
		emailContent?.classList.add('hidden');
		
		methodSelection?.classList.remove('flex');
		qrContent?.classList.remove('flex');
		emailContent?.classList.remove('flex');

		// affichange de la sleeciotn email ou app
		if (view === 'selection') {
			methodSelection?.classList.remove('hidden');
			methodSelection?.classList.add('flex');
		} 
		else if (view === 'qr') {
			qrContent?.classList.remove('hidden');
			qrContent?.classList.add('flex');
		} 
		else if (view === 'email') {
			emailContent?.classList.remove('hidden');
			emailContent?.classList.add('flex');
			
			const displayedEmail = document.querySelector('div[data-field="email"] .field-display')?.textContent;

			if (displayedEmail && displayedEmail.trim() !== "")
				currentUserEmail = displayedEmail.trim();
			// email du user
			if (inputEmail2fa) {
				inputEmail2fa.value = currentUserEmail; 
				inputEmail2fa.disabled = true;
			}

			if (codeVerif) {
				codeVerif.classList.remove('hidden');
				codeVerif.classList.add('flex');
			}
			if (buttonSendCode) buttonSendCode.classList.add('hidden');
		}
	};

	const initiate2faSetup = async (method: 'qr' | 'email') => {
		if (!userId) return;

		const backendType = method === 'qr' ? 'APP' : 'EMAIL';
		try {
			//fetch pour le qr code ou l'email
			const response = await fetchWithAuth(`api/auth/2fa/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: backendType })
			});
			
			if (response.ok) {
				const result = await response.json();
				
				if (method === 'qr') {
					if (result.data && result.data.qrCodeUrl) {
						if (qrCodeImg) qrCodeImg.src = result.data.qrCodeUrl;
						switch2faView('qr');
					}
				} else {
					// Email envoyé avec succès
					console.log("Email code sent");
					switch2faView('email');
				}
			} else {
				console.error("Failed to initiate 2FA");
				alert("Error initializing 2FA setup");
			}
		} catch (error) {
			console.error("Network error 2FA generate:", error);
			alert("Network error");
		}
	};

	const enable2fa = async (code: string, type: 'qr' | 'email') => {
		if (!code || code.length < 6) {
			alert("Please enter a valid 6-digit code.");
			return;
		}

		const backendType = type === 'qr' ? 'APP' : 'EMAIL';

		try {
			const response = await fetchWithAuth(`api/auth/2fa/enable`, {
				method: 'POST', // ou patch?? a tester
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: code, type: backendType })
			});

			if (response.ok) {
				update2faButton(true);
				localStorage.setItem('is2faEnabled', 'true');
				close2fa();
				alert("2FA is now enabled!");
			} else {
				const result = await response.json();
				alert(result.message || "Invalid code. Please try again.");
			}
		} catch (error) {
			console.error("Error enabling 2FA:", error);
			alert("An error occurred.");
		}
	};

	// on desactive le 2fa si l'utilisateur veut
	const disable2fa = async () => {
		if (!confirm("Are you sure you want to disable Two-Factor Authentication?")) return;

		try {
			const response = await fetchWithAuth(`api/auth/2fa/disable`, {
				method: 'POST' // ou patch?? a tester
			});

			if (response.ok) {
				update2faButton(false);
				localStorage.setItem('is2faEnabled', 'false');
				alert("2FA disabled.");
			} else {
				alert("Error disabling 2FA.");
			}
		} catch (error) {
			console.error(error);
		}
	};

	buttonSelectQr?.addEventListener('click', () => initiate2faSetup('qr'));
	buttonSelectEmail?.addEventListener('click', () => initiate2faSetup('email'));

	
	buttonBackQr?.addEventListener('click', () => switch2faView('selection'));
	buttonBackEmail?.addEventListener('click', () => switch2faView('selection'));

	confirm2faQrButton?.addEventListener('click', () => enable2fa(input2faQr.value.trim(), 'qr'));
	buttonConfirmEmail?.addEventListener('click', () => enable2fa(inputCodeEmail.value.trim(), 'email'));

	button2faToggle?.addEventListener('click', () => {
		if (is2faEnabled) {
			disable2fa();
		} else {
			if (modal2fa) {
				modal2fa.classList.remove('hidden');
				modal2fa.classList.add('flex');
				
				if (input2faQr) input2faQr.value = '';
				if (inputCodeEmail) inputCodeEmail.value = '';
				
				switch2faView('selection');
			}
		}
	});

	close2faButton?.addEventListener('click', close2fa);
	cancel2faButton?.addEventListener('click', close2fa); // Cancel QR
	
	// Pour l'email, on peut aussi utiliser close2fa pour annuler
	const cancelEmailButton = document.getElementById('cancel-2fa-email');
	cancelEmailButton?.addEventListener('click', close2fa);

	// si on clique dehors 
	modal2fa?.addEventListener('click', (e) => {
		if (e.target === modal2fa) close2fa();
	});


	// ============================================================
	// ========================= MODALE ===========================
	// ============================================================

	// on ferme
	const closeModalFunc = () => {
		if (!modal) return;
		modal.classList.add('hidden');
		modal.classList.remove('flex');
	};

	// on ouvre
	const openModalFunc = () => {
		if (!modal || !previewAvatar || !mainAvatar) return;
	
		// on reset pour qu'a l'ouverture limage actuelle soit correcte
		selectedImageSrc = mainAvatar.src;
		previewAvatar.src = selectedImageSrc;
		
		modal.classList.remove('hidden');
		modal.classList.add('flex');
	};

	// ============================================================
	// ============= MAJ DONNÉES UTILISATEUR  =====================
	// ============================================================
	
	const loadUserData = async () => {
		if (!userId)
			return;
		
		try {
			// on recuperer les infos user
			const response = await fetchWithAuth(`api/users/${userId}`);
			
			if (response.ok) {
				const user: UserData = await response.json();
				
				// IMPORTANT: on recupere l'email ici
				currentUserEmail = user.email || "";


				////// chargement des statistiques
				const statResponse = await fetchWithAuth(`/api/game/users/${userId}/games/stats`);
				if (statResponse.ok) {
					const jsonResponse = await statResponse.json();
					const stats: UserStats = jsonResponse.data;

					const totalGame = document.getElementById('stats-total-games');
					const wins = document.getElementById('stats-wins');
					const losses = document.getElementById('stats-losses');
					const winRateCalcul = document.getElementById('stats-win-rate');

					if (stats && totalGame && winRateCalcul && wins && losses) {
						totalGame.innerText = stats.total_games.toString();
						wins.innerText = stats.wins.toString();
						losses.innerText = stats.losses.toString();
						
						let rateValue = 0;
						if (stats.total_games > 0) {
							rateValue = Math.round((stats.wins / stats.total_games) * 100);
						}
						winRateCalcul.innerText = `${rateValue}%`;
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

	// update de la frame du statut
	const updateStatusFrame = (status: string) => {
		if (statusFrame && statusImages[status]) {
			statusFrame.src = statusImages[status];
		}
	};

	// on recharge la page
	loadUserData();


	// ============================================================
	// =========== FONCTIONS DE MISE À JOUR CIBLÉES ===============
	// ============================================================

	// maj username
	const updateUsername = async (newUsername: string) => {
		if (!userId || !newUsername.trim()) return false;
		try {
			const response = await fetchWithAuth(`api/users/${userId}/alias`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ alias: newUsername })
			});

			const result = await response.json();

			if (response.ok) {
				alert("Username updated successfully!");
				if (usernameDisplay) usernameDisplay.innerText = newUsername;
				localStorage.setItem('username', newUsername);
				SocketService.getInstance().socket?.emit('notifyProfileUpdate', {
					userId: Number(userId),
					username: newUsername
				});
				console.log("Username updated");
				return true;
			} else {
				console.error("Error while updating username");
				if (result.error && result.error.message)
					alert(result.error.message);
				else
					alert("Error while saving username")
				return false;
			}
		} catch (error) {
			console.error("Erreur réseau:", error);
			alert("Error while saving username");
			return false;
		}
	};

	// maj bio
	const updateBio = async (newBio: string) => {
		if (!userId) return false;
		
		const MAX_BIO_LENGTH = 70;
		const trimmedBio = newBio.trim(); 

		if (trimmedBio.length > MAX_BIO_LENGTH) {
			console.error("Erreur: Bio dépasse la limite de 70 caractères.");
			alert(`La biographie ne doit pas dépasser ${MAX_BIO_LENGTH} caractères.`);
			return false;
		}

		try {
			const response = await fetchWithAuth(`api/users/${userId}/bio`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bio: trimmedBio })
			});
			if (response.ok) {
				if (bioDisplay) bioDisplay.innerHTML = parseMessage(trimmedBio) || "Share a quick message";
				SocketService.getInstance().socket?.emit('notifyProfileUpdate', {
					userId: Number(userId),
					bio: trimmedBio,
					username: localStorage.getItem('username')
				});
				console.log("Bio mise à jour");
				return true;
			} else {
				console.error("Erreur lors de la mise à jour de la bio");
				alert("Erreur lors de la sauvegarde de la bio");
				return false;
			}
		} catch (error) {
			console.error("Erreur réseau:", error);
			alert("Erreur lors de la sauvegarde de la bio");
			return false;
		}
	};

	const updateEmail = async (newEmail: string) => {
		if (!userId || !newEmail.trim()) return false;

		try {
			const response = await fetchWithAuth(`api/users/${userId}/email`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: newEmail })
			});
			const user = await response.json();
			if (response.ok) {
				alert("Email updated successfully!");
				currentUserEmail = newEmail;
				console.log("Email updated");
				return true;
			} else {
				console.error(user.error.message);
				alert(user.error.message);
				return false;
			}
		} catch (error) {
			console.error("Network error:", error);
			alert("Error saving email");
			return false;
		}
	};

	const updateTheme = async (newTheme: string) => {
		if (!userId) return;

		try {
			const response = await fetchWithAuth(`api/users/${userId}/theme`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ theme: newTheme })
			});

			if (response.ok) {
				console.log("Theme saved to database:", newTheme);
				// On met à jour le localStorage ici aussi pour être sûr
				localStorage.setItem('userTheme', newTheme);
			} else {
				console.error("Failed to save theme to database");
			}
		} catch (error) {
			console.error("Network error saving theme:", error);
		}
	};


	// ============================================================
	// ============ LOGIQUE CHANGE / CONFIRM GÉNÉRIQUE ============
	// ============================================================
	
	// comportement d'un champs 
	const setupField = (elements: FieldElements, fieldName: string) => {
		const { display, input, changeButton, confirmButton } = elements;
		
		let initialValue = display.innerText;
		
		const MAX_BIO_LENGTH = 70;
		
		const charCountElement = fieldName === 'bio' 
			? elements.container.querySelector('.char-count') as HTMLSpanElement
			: null;

		const updateCharCount = (currentLength: number) => {
			if (charCountElement) {
				charCountElement.innerText = `${currentLength}/${MAX_BIO_LENGTH}`;
				if (currentLength > MAX_BIO_LENGTH) {
					charCountElement.classList.add('text-red-500');
					charCountElement.classList.remove('text-gray-500');
				} else {
					charCountElement.classList.remove('text-red-500');
					charCountElement.classList.add('text-gray-500');
				}
			}
		};

		// eidtion du champs concerné
		const enableEditMode = () => {
			initialValue = fieldName === 'password' ? '' : display.innerText; // si mdp alors le champs est vide
			
			display.classList.add('hidden');
			input.classList.remove('hidden');
			input.disabled = false;
			
			// valuer initialise = placeholder
			if (fieldName !== 'password') {
				input.value = '';
				input.placeholder = initialValue;
			} else {
				// placeholder = *******
				input.value = '';
			}

			if (fieldName === 'bio' && charCountElement) {
				charCountElement.classList.remove('hidden');
				const initialLength = initialValue.length;
				updateCharCount(initialLength);
			}


			changeButton.classList.add('hidden');
			// on affiche confirme quand on commence a taper/modifier
			confirmButton.classList.add('hidden'); 
			input.focus();
		};

		// on revient au mode de base
		const disableEditMode = (newValue: string) => {
			if (fieldName !== 'password') {
				initialValue = newValue;
			}

			display.classList.remove('hidden');
			input.classList.add('hidden');
			input.disabled = true;

			// maj affichage
			if (fieldName === 'password') {
				 display.innerText = "********"; // on cache avec des etoiles
			} else {
				 display.innerText = newValue;
				 input.value = "";
				 input.placeholder = newValue; // maj placeholder
			}

			if (fieldName === 'bio' && charCountElement) {
				charCountElement.classList.add('hidden');
			}
			
			changeButton.classList.remove('hidden');
			confirmButton.classList.add('hidden');
		};

		changeButton.addEventListener('click', enableEditMode);

		// detection saisie
		input.addEventListener('input', () => {
			const currentValue = input.value;
			
			let isChanged = false;
			let isValid = true;
			const trimmedValue = currentValue.trim();

			if (fieldName === 'bio') {
				updateCharCount(currentValue.length);

				if (currentValue.length > MAX_BIO_LENGTH) {
					isValid = false;
				}
				
				const initialTrimmedValue = initialValue.trim();
				isChanged = trimmedValue.length > 0 && trimmedValue !== initialTrimmedValue;

			} else if (fieldName === 'password') {
				isChanged = currentValue.length > 0;
			} else {
				isChanged = trimmedValue !== initialValue.trim() && trimmedValue.length > 0;
			}

			if (isChanged && isValid) {
				confirmButton.classList.remove('hidden');
			} else {
				confirmButton.classList.add('hidden');
			}
		});

		confirmButton.addEventListener('click', async () => {
			const newValue = input.value.trim();
			let updateSuccessful = false;

			switch (fieldName) {
				case 'alias':
					updateSuccessful = await updateUsername(newValue);
					break;
				case 'bio':
					updateSuccessful = await updateBio(newValue);
					break;
				case 'email':
					updateSuccessful = await updateEmail(newValue);
					break;
				default:
					updateSuccessful = true;
			}

			if (updateSuccessful) {
				disableEditMode(newValue);
			}
		});

		// focus/unfocus quand on clic
		input.addEventListener('blur', (e) => {
			if (e.relatedTarget !== confirmButton) {
				const isConfirmedVisible = !confirmButton.classList.contains('hidden');

				if (isConfirmedVisible) {
					disableEditMode(fieldName === 'password' ? display.innerText : initialValue);
				} else {
					disableEditMode(fieldName === 'password' ? display.innerText : initialValue);
				}
			}
		});
		
		input.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				const isConfirmedVisible = !confirmButton.classList.contains('hidden');
				if (isConfirmedVisible) {
					confirmButton.click();
				} else {
					input.blur();
				}
			}
		});
	};

	// ============================================================
	// ========== Mise à jour du status (ancienne logique) ========
	// ============================================================

	// Mise à jour du status
	const updateStatus = async (newStatus: string) => {
		if (!userId) return;

		try {
			const response = await fetchWithAuth(`api/users/${userId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				updateStatusFrame(newStatus);
				localStorage.setItem('userStatus', newStatus); 
				console.log("Status mis à jour:", newStatus);

				const username = localStorage.getItem('username');
				SocketService.getInstance().socket?.emit('notifyStatusChange', { 
					userId: Number(userId), 
					status: newStatus,
					username: username 
				});

			} else {
				console.error("Erreur lors de la mise à jour du status");
				alert("Erreur lors de la sauvegarde du status");
			}
		} catch (error) {
			console.error("Erreur réseau:", error);
			alert("Erreur lors de la sauvegarde du status");
		}
	};

	statusSelect?.addEventListener('change', () => {
		const selectedValue = statusSelect.value;
		const statusKey = statusMapping[selectedValue];
		if (statusKey) {
			updateStatus(statusKey);
		}
	});






	// ============================================================
	// ============= CLOGIQUE DE CHANGEMENT DE MDP ================
	// ============================================================

	const pwdModal = document.getElementById('password-modal');
	const closePwdButton = document.getElementById('close-password-modal');
	const cancelPwdButton = document.getElementById('cancel-password-button');
	const savePwdButton = document.getElementById('save-password-button');
	
	const currentPwdInput = document.getElementById('pwd-current') as HTMLInputElement;
	const newPwdInput = document.getElementById('pwd-new') as HTMLInputElement;
	const confirmPwdInput = document.getElementById('pwd-confirm') as HTMLInputElement;
	const pwdError = document.getElementById('pwd-error');

	const passwordContainer = document.querySelector('div[data-field="password"]');
	const openPwdModalButton = passwordContainer?.querySelector('.change-button');

	const resetPwdForm = () => {
		if (currentPwdInput) currentPwdInput.value = '';
		if (newPwdInput) newPwdInput.value = '';
		if (confirmPwdInput) confirmPwdInput.value = '';
		if (pwdError) {
			pwdError.innerText = '';
			pwdError.classList.add('hidden');
		}
	};

	const closePwdModal = () => {
		pwdModal?.classList.add('hidden');
		pwdModal?.classList.remove('flex');
		resetPwdForm();
	};

	openPwdModalButton?.addEventListener('click', () => {
		pwdModal?.classList.remove('hidden');
		pwdModal?.classList.add('flex');
	});

	closePwdButton?.addEventListener('click', closePwdModal);
	cancelPwdButton?.addEventListener('click', closePwdModal);

	savePwdButton?.addEventListener('click', async () => {
		const oldPass = currentPwdInput.value;
		const newPass = newPwdInput.value;
		const confirmPass = confirmPwdInput.value;

		// on verifie que tous les chanps sont remplis
		if (!oldPass || !newPass || !confirmPass) {
			if (pwdError) {
				pwdError.innerText = "All inputs are required.";
				pwdError.classList.remove('hidden');
			}
			return;
		}

		if (newPass !== confirmPass) {
			console.log("newpass: , confirmpass:", newPass, confirmPass);
			if (pwdError) {
				pwdError.innerText = "These are not the same. Try again";
				pwdError.classList.remove('hidden');
			}
			return;
		}
		
		if (newPass.length < 8) {
			if (pwdError) {
				pwdError.innerText = "Password must be at least 8 characters.";
				pwdError.classList.remove('hidden');
			}
			return;
		}

		console.log("newpass: , confirmpass:", newPass, confirmPass);

		try {
			
			const response = await fetchWithAuth(`api/users/${userId}/password`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ oldPass, newPass, confirmPass })
			});

			const result = await response.json();

			if (response.ok) {
				alert("Password updated successfully!");
				closePwdModal();
			} else {
				if (pwdError) {
					// on recuperer l'erreur du backe
					pwdError.innerText = result.error?.message || "Error updating password";
					pwdError.classList.remove('hidden');
				}
			}
		} catch (error) {
			console.error(error);
			if (pwdError) {
				pwdError.innerText = "Network error.";
				pwdError.classList.remove('hidden');
			}
		}
	});

	pwdModal?.addEventListener('click', (e) => {
		if (e.target === pwdModal) closePwdModal();
	});


	// ============================================================
	// ============= CLIC CLIC CLIC CLIC CLIC  ====================
	// ============================================================

	// OUVERTUR fermetue
	editButton?.addEventListener('click', openModalFunc);
	closeButton?.addEventListener('click', closeModalFunc);
	
	// cancel = on ferme la modale sans rien sauvegarder
	cancelButton?.addEventListener('click', () => {
		closeModalFunc();
	});
	
	// fermetur eua
	modal?.addEventListener('click', (e) => {
		if (e.target === modal) closeModalFunc();
	});

	// afficgage de la grille
	if (gridContainer) {
		const gridImages = gridContainer.querySelectorAll('img');
		gridImages.forEach(img => {
			img.addEventListener('click', () => {
				selectedImageSrc = img.src;
				if (previewAvatar) previewAvatar.src = selectedImageSrc;
				
				// contour gris histoire de 
				gridImages.forEach(i => i.classList.remove('border-[#0078D7]'));
				img.classList.add('border-[#0078D7]'); 
			});
		});
	}

	// chargement d;un fichier perso
	browseButton?.addEventListener('click', () => fileInput?.click());
	
	fileInput?.addEventListener('change', (event) => {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target?.result) {
					const result = e.target.result as string;
					selectedImageSrc = result;
					if (previewAvatar) previewAvatar.src = result;
				}
			};
			reader.readAsDataURL(file);
		}
	});

	// bouton delete qui reset l'image en par defaut
	deleteButton?.addEventListener('click', () => {
		const defaultAvatar = "/assets/basic/default.png";
		selectedImageSrc = defaultAvatar;
		if (previewAvatar) previewAvatar.src = defaultAvatar;
	});


	// ============================================================
	// ========================c'est ok ===========================
	// ============================================================

	okButton?.addEventListener('click', async () => {
		if (!userId) {
			alert("Error: no user found");
			return;
		}

		try {
			console.log("avatar charge");
			
			// envoit de l'url au backend
			const response = await fetchWithAuth(`api/users/${userId}/avatar`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ avatar: selectedImageSrc })
			});

			const result = await response.json();

			if (response.ok) {

				const cleanAvatarUrl = result.data.avatar;
				// maj sur le profil
				if (mainAvatar) mainAvatar.src = cleanAvatarUrl;
				
				SocketService.getInstance().socket?.emit('notifyProfileUpdate', {
					userId: Number(userId),
					avatar: cleanAvatarUrl,
					username: localStorage.getItem('username') // On renvoie le nom pour identifier
				});
				// on ferme la modale une fois qu'on a valide
				closeModalFunc();
				
				console.log("avatar maj:", cleanAvatarUrl);
			} else {
				console.error("Error while updating");
				alert("Error while saving");
			}
		} catch (error) {
			console.error("Network error:", error);
		}
	});
}