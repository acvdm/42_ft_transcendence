import htmlContent from "../pages/ProfilePage.html";
import { fetchWithAuth } from "../services/api";
import { parseMessage } from "../components/ChatUtils";
import { appThemes } from "../components/Data";
import SocketService from "../services/SocketService";
import { AvatarManager } from "../components/AvatarManager";
import { TwoFactorManager } from "../components/TwoFactorManager";
import i18next from "../i18n";

//================================================
//================== INTERFACES ==================
//================================================

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

    averageScore?: number;
    current_win_streak?: number;
    biggest_opponent?: string;
    favorite_game?: string;
}

interface FieldElements {
    container: HTMLElement;
    display: HTMLParagraphElement;
    input: HTMLInputElement;
    changeButton: HTMLButtonElement;
    confirmButton: HTMLButtonElement;
}

export function render(): string {
    let html = htmlContent;

    // Main Page
    html = html.replace(/\{\{profilePage\.window_profile\}\}/g, i18next.t('profilePage.window_profile'));
    html = html.replace(/\{\{profilePage\.my_profile\}\}/g, i18next.t('profilePage.my_profile'));
    html = html.replace(/\{\{profilePage\.my_status\}\}/g, i18next.t('profilePage.my_status'));
    html = html.replace(/\{\{profilePage\.status\.available\}\}/g, i18next.t('profilePage.status.available'));
    html = html.replace(/\{\{profilePage\.status\.busy\}\}/g, i18next.t('profilePage.status.busy'));
    html = html.replace(/\{\{profilePage\.status\.away\}\}/g, i18next.t('profilePage.status.away'));
    html = html.replace(/\{\{profilePage\.status\.offline\}\}/g, i18next.t('profilePage.status.offline'));
    html = html.replace(/\{\{profilePage\.fallback_username\}\}/g, i18next.t('profilePage.fallback_username'));
    html = html.replace(/\{\{profilePage\.fallback_bio\}\}/g, i18next.t('profilePage.fallback_bio'));
    html = html.replace(/\{\{profilePage\.username\}\}/g, i18next.t('profilePage.username'));
    html = html.replace(/\{\{profilePage\.placeholder_username\}\}/g, i18next.t('profilePage.placeholder_username'));
    html = html.replace(/\{\{profilePage\.change_button\}\}/g, i18next.t('profilePage.change_button'));
    html = html.replace(/\{\{profilePage\.confirm_button\}\}/g, i18next.t('profilePage.confirm_button'));
    html = html.replace(/\{\{profilePage\.bio\}\}/g, i18next.t('profilePage.bio'));
    html = html.replace(/\{\{profilePage\.placeholder_bio\}\}/g, i18next.t('profilePage.placeholder_bio'));
    html = html.replace(/\{\{profilePage\.password\}\}/g, i18next.t('profilePage.password'));
    html = html.replace(/\{\{profilePage\.placeholder_password\}\}/g, i18next.t('profilePage.placeholder_password'));
    html = html.replace(/\{\{profilePage\.2fa_button\}\}/g, i18next.t('profilePage.2fa_button'));
    html = html.replace(/\{\{profilePage\.download_button\}\}/g, i18next.t('profilePage.download_button'));
    html = html.replace(/\{\{profilePage\.delete_button\}\}/g, i18next.t('profilePage.delete_button'));
    html = html.replace(/\{\{profilePage\.game_stats\}\}/g, i18next.t('profilePage.game_stats'));
    html = html.replace(/\{\{profilePage\.game_played\}\}/g, i18next.t('profilePage.game_played'));
    html = html.replace(/\{\{profilePage\.wins\}\}/g, i18next.t('profilePage.wins'));
    html = html.replace(/\{\{profilePage\.losses\}\}/g, i18next.t('profilePage.losses'));
    html = html.replace(/\{\{profilePage\.winning_streak\}\}/g, i18next.t('profilePage.winning_streak'));

    // 2FA Modal
    html = html.replace(/\{\{profilePage\.2fa_modal\.title\}\}/g, i18next.t('profilePage.2fa_modal.title'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.choose_method\}\}/g, i18next.t('profilePage.2fa_modal.choose_method'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.message_method\}\}/g, i18next.t('profilePage.2fa_modal.message_method'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.authenticator\}\}/g, i18next.t('profilePage.2fa_modal.authenticator'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.message_authenticator\}\}/g, i18next.t('profilePage.2fa_modal.message_authenticator'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.email_verif\}\}/g, i18next.t('profilePage.2fa_modal.email_verif'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.message_email_verif\}\}/g, i18next.t('profilePage.2fa_modal.message_email_verif'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.qr_code\}\}/g, i18next.t('profilePage.2fa_modal.qr_code'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.message_qr_code\}\}/g, i18next.t('profilePage.2fa_modal.message_qr_code'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.6_digit\}\}/g, i18next.t('profilePage.2fa_modal.6_digit'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.validate\}\}/g, i18next.t('profilePage.2fa_modal.validate'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.cancel\}\}/g, i18next.t('profilePage.2fa_modal.cancel'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.verif_email\}\}/g, i18next.t('profilePage.2fa_modal.verif_email'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.message_verif_email\}\}/g, i18next.t('profilePage.2fa_modal.message_verif_email'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.code_send\}\}/g, i18next.t('profilePage.2fa_modal.code_send'));
    html = html.replace(/\{\{profilePage\.2fa_modal\.code_received\}\}/g, i18next.t('profilePage.2fa_modal.code_received'));

    // Picture Modal
    html = html.replace(/\{\{profilePage\.picture_modal\.title\}\}/g, i18next.t('profilePage.picture_modal.title'));
    html = html.replace(/\{\{profilePage\.picture_modal\.select_pic\}\}/g, i18next.t('profilePage.picture_modal.select_pic'));
    html = html.replace(/\{\{profilePage\.picture_modal\.message_select\}\}/g, i18next.t('profilePage.picture_modal.message_select'));
    html = html.replace(/\{\{profilePage\.picture_modal\.browse\}\}/g, i18next.t('profilePage.picture_modal.browse'));
    html = html.replace(/\{\{profilePage\.picture_modal\.delete\}\}/g, i18next.t('profilePage.picture_modal.delete'));
    html = html.replace(/\{\{profilePage\.picture_modal\.ok\}\}/g, i18next.t('profilePage.picture_modal.ok'));
    html = html.replace(/\{\{profilePage\.picture_modal\.cancel\}\}/g, i18next.t('profilePage.picture_modal.cancel'));

    // Theme Modal
    html = html.replace(/\{\{profilePage\.theme_modal\.title\}\}/g, i18next.t('profilePage.theme_modal.title'));

    // Password Modal
    html = html.replace(/\{\{profilePage\.password_modal\.title\}\}/g, i18next.t('profilePage.password_modal.title'));
    html = html.replace(/\{\{profilePage\.password_modal\.current_pwd\}\}/g, i18next.t('profilePage.password_modal.current_pwd'));
    html = html.replace(/\{\{profilePage\.password_modal\.new_pwd\}\}/g, i18next.t('profilePage.password_modal.new_pwd'));
    html = html.replace(/\{\{profilePage\.password_modal\.confirm_pwd\}\}/g, i18next.t('profilePage.password_modal.confirm_pwd'));
    html = html.replace(/\{\{profilePage\.password_modal\.save\}\}/g, i18next.t('profilePage.password_modal.save'));
    html = html.replace(/\{\{profilePage\.password_modal\.cancel\}\}/g, i18next.t('profilePage.password_modal.cancel'));

    // Delete Modal
    html = html.replace(/\{\{profilePage\.delete_modal\.title\}\}/g, i18next.t('profilePage.delete_modal.title'));
    html = html.replace(/\{\{profilePage\.delete_modal\.confirm_delete\}\}/g, i18next.t('profilePage.delete_modal.confirm_delete'));
    html = html.replace(/\{\{profilePage\.delete_modal\.confirm_message\}\}/g, i18next.t('profilePage.delete_modal.confirm_message'));
    html = html.replace(/\{\{profilePage\.delete_modal\.yes\}\}/g, i18next.t('profilePage.delete_modal.yes'));
    html = html.replace(/\{\{profilePage\.delete_modal\.cancel\}\}/g, i18next.t('profilePage.delete_modal.cancel'));

    return html;
};

//================================================
//================ APPLYING THEME ================
//================================================

export function applyTheme(themeKey: string) {
    const theme = appThemes[themeKey] || appThemes['basic'];
    localStorage.setItem('userTheme', themeKey);

    const navbar = document.getElementById('main-navbar');
    if (navbar) {
        navbar.style.background = theme.navColor;
    }

    const headerIds = ['profile-header', 'home-header', 'dashboard-header'];
    headerIds.forEach(id => {
        const header = document.getElementById(id);
        if (header) {
            header.style.backgroundImage = `url(${theme.headerUrl})`;
        }
    });

    const body = document.getElementById('app-body');
    if (body) {
        body.className = "m-0 p-0 overflow-x-auto min-w-[1000px] min-h-screen";
        body.style.background = theme.bgColor;
        body.style.backgroundRepeat = "no-repeat";
        body.style.backgroundAttachment = "fixed"; 
    }

    const labels = document.querySelectorAll('.theme-label');

    labels.forEach((element) => {
        (element as HTMLElement).style.color = theme.textColor;
    });
}

export function afterRender(): void {

    const userId = localStorage.getItem('userId');
    const avatarManager = new AvatarManager(userId);
    const twoFactorManager = new TwoFactorManager(userId);
    
    avatarManager.init();
    twoFactorManager.init();

    const mainAvatar = document.getElementById('current-avatar') as HTMLImageElement;
    const statusFrame = document.getElementById('current-statut') as HTMLImageElement;
    const usernameDisplay = document.getElementById('username-profile');
    const bioDisplay = document.getElementById('bio-profile');
    const statusSelect = document.querySelector('select') as HTMLSelectElement;
    const fieldContainers = document.querySelectorAll<HTMLElement>('.flex.flex-row.gap-2[data-field]');

    let currentUserEmail: string = "";

    const statusImages: { [key: string]: string } = {
        'available': '/assets/basic/status_frame_online_large.png',
        'online': '/assets/basic/status_frame_online_large.png',
        'busy':      '/assets/basic/status_frame_busy_large.png',
        'away':      '/assets/basic/status_frame_away_large.png',
        'invisible': '/assets/basic/status_frame_offline_large.png'
    };

    const statusMapping: { [key: string]: string } = {
        'Available': 'available', // This assumes the dropdown options values or text are in English by default, or mapped
        'Busy': 'busy',
        'Away': 'away',
        'Appear offline': 'invisible'
    };
    
    // MODIFICATION: Using translations for the display status mapping
    // We try to match both English (if default) and translated keys if they are used as values
    const reverseStatusMapping: { [key: string]: string } = {
        'available': i18next.t('profilePage.status.available'),
        'online': i18next.t('profilePage.status.available'),
        'busy': i18next.t('profilePage.status.busy'),
        'away': i18next.t('profilePage.status.away'),
        'invisible': i18next.t('profilePage.status.offline')
    };


//================================================
//=============== THEME MANAGEMENT ===============
//================================================

    const themeButton = document.getElementById('theme-button');
    const themeModal = document.getElementById('theme-modal');
    const closeThemeModal = document.getElementById('close-theme-modal');
    const themeGrid = document.getElementById('theme-grid');
    const currentTheme = localStorage.getItem('userTheme') || 'basic';
    
    applyTheme(currentTheme);

    let selectedThemeElement: HTMLElement | null = null;

    // Modal management
    themeButton?.addEventListener('click', () => {
        themeModal?.classList.remove('hidden');
        themeModal?.classList.add('flex');
    });

    const closeThemeFunc = () => {
        themeModal?.classList.add('hidden');
        themeModal?.classList.remove('flex');
    };
    closeThemeModal?.addEventListener('click', closeThemeFunc);


    // Creation theme grid 
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


//================================================
//=============== RGPD MANAGEMENT ================
//================================================

    // Download datas
    const downloadButton = document.getElementById('download-data-button');
    downloadButton?.addEventListener('click', async () => {
        if (!userId) {
            return;
        }

        // Converting blob (big large object)
        try {
            const response = await fetchWithAuth(`api/user/${userId}/export`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `user_data_${userId}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                console.error("Failed to download data");
            }
        } catch (error) {
            console.error("Network error during export:", error);
        }
    });

    // Deleting account
    const deleteAccountButton = document.getElementById('delete-account-button');
    const deleteModal = document.getElementById('delete-modal');
    const closeDeleteModalButton = document.getElementById('close-delete-modal');
    const confirmDeleteButton = document.getElementById('confirm-delete-account-button');
    const cancelDeleteButton = document.getElementById('cancel-delete-account-button');

    const openDeleteModal = () => {
        deleteModal?.classList.remove('hidden');
        deleteModal?.classList.add('flex');
    };

    const closeDeleteModal = () => {
        deleteModal?.classList.add('hidden');
        deleteModal?.classList.remove('flex');
    };

    deleteAccountButton?.addEventListener('click', openDeleteModal);
    closeDeleteModalButton?.addEventListener('click', closeDeleteModal);
    cancelDeleteButton?.addEventListener('click', closeDeleteModal);
    deleteModal?.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });

    confirmDeleteButton?.addEventListener('click', async () => {
        if (!userId) {
            return;
        }

        // MODIFICATION: Translation
        const confirmation = confirm(i18next.t('profilePage.alerts.delete_confirm'));
        if (!confirmation) {
            return;
        }

        try {
            const response = await fetchWithAuth(`api/user/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // MODIFICATION: Translation
                alert(i18next.t('profilePage.alerts.delete_success'));

                localStorage.removeItem('accessToken');
                localStorage.removeItem('userId');
                localStorage.removeItem('userTheme');
                localStorage.removeItem('username');

                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                const result = await response.json();
                // MODIFICATION: Translation with fallback
                alert(result.error?.message || i18next.t('profilePage.alerts.delete_error'));
                closeDeleteModal();
            }
        } catch (error) {
            console.error("Network error during destruction:", error);
            // MODIFICATION: Translation
            alert(i18next.t('profilePage.alerts.network_error'));
        }
    });


//================================================
//============== UPDATING DATA USER ==============
//================================================
    
    const loadUserData = async () => {
        if (!userId) {
            return;
        }

        try {
            const response = await fetchWithAuth(`api/user/${userId}`);
            
            if (response.ok) {
                const user: UserData = await response.json();
                currentUserEmail = user.email || "";
                const statResponse = await fetchWithAuth(`/api/game/users/${userId}/stats`);

                if (statResponse.ok) {
                    const jsonResponse = await statResponse.json();
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
                        if (avgScore) avgScore.innerText = stats.averageScore?.toString() || "0";
                        if (streak) streak.innerText = stats.current_win_streak?.toString() || "0";
                        if (opponent) opponent.innerText = stats.biggest_opponent || "-";
                        
                        // MODIFICATION: Translation for default game
                        if (favGame) favGame.innerText = stats.favorite_game || i18next.t('profilePage.game_local');
                        
                        if (winRateCalcul) {
                            let rateValue = 0;
                            if (stats.total_games > 0) {
                                rateValue = Math.round((stats.wins / stats.total_games) * 100);
                            }
                            winRateCalcul.innerText = `${rateValue}%`;
                        }
                    }
                } else {
                    console.warn("Could not fetch user stats");
                }

                // Updating theme
                if (user.theme) {
                    localStorage.setItem('userTheme', user.theme);
                    applyTheme(user.theme);
                }

                // Updating avatar
                if (user.avatar_url && mainAvatar) {
                    mainAvatar.src = user.avatar_url;
                }

                // Updating 2FA
                if (user.is2faEnabled !== undefined) {
                    twoFactorManager.setStatus(user.is2faEnabled);
                }

                fieldContainers.forEach(container => {
                    const fieldName = container.dataset.field;
                    const display = container.querySelector('.field-display') as HTMLParagraphElement;
                    const input = container.querySelector('.field-input') as HTMLInputElement;

                    if (fieldName && display && input) {
                        let value: string | undefined;

                        if (fieldName === 'alias') {
                            value = user.alias || '';
                            if (usernameDisplay) {
                                usernameDisplay.innerText = value;
                            }
                        } else if (fieldName === 'bio') {
                            value = user.bio || '';
                            if (bioDisplay) {
                                // MODIFICATION: Translation for placeholder
                                bioDisplay.innerHTML = parseMessage(value) || i18next.t('profilePage.bio_placeholder');
                            }
                        } else if (fieldName === 'email') {
                            value = user.email || '';
                        } else if (fieldName === 'password') {
                            value = "********"; 
                        }

                        if (value !== undefined) {
                            // MODIFICATION: Translations for empty states
                            display.innerText = value || (fieldName === 'email' ? i18next.t('profilePage.email_empty') : i18next.t('profilePage.field_empty'));
                            if (fieldName !== 'password') {
                                input.placeholder = value || i18next.t('profilePage.field_empty');
                            }
                        }
                    }
                });


                // Updating status
                if (user.status) {
                    const normalizedStatus = user.status.toLowerCase();
                    // MODIFICATION: Using translated status
                    const statusValue = reverseStatusMapping[normalizedStatus] || i18next.t('profilePage.status.offline');
                    if (statusSelect) statusSelect.value = statusValue;
                    updateStatusFrame(normalizedStatus);
                }

                // Changing profile elements
                fieldContainers.forEach(container => {
                    if (container.dataset.field === 'password') {
                        return;
                    }

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

    // Updating status frame
    const updateStatusFrame = (status: string) => {
        if (statusFrame && statusImages[status]) {
            statusFrame.src = statusImages[status];
        }
    };
    loadUserData();

    // Updating username
    const updateUsername = async (newUsername: string) => {
        
        if (!userId || !newUsername.trim()) {
            return false;
        }

        try {
            const response = await fetchWithAuth(`api/user/${userId}/alias`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alias: newUsername })
            });

            const result = await response.json();

            if (response.ok) {
                // MODIFICATION: Translation
                alert(i18next.t('profilePage.alerts.username_success'));
                if (usernameDisplay) {
                    usernameDisplay.innerText = newUsername;
                }

                localStorage.setItem('username', newUsername);
                SocketService.getInstance().socket?.emit('notifyProfileUpdate', {
                    userId: Number(userId),
                    username: newUsername
                });
                return true;

            } else {
                console.error("Error while updating username");
                if (result.error && result.error.message) {
                    alert(result.error.message);
                } else {
                    // MODIFICATION: Translation
                    alert(i18next.t('profilePage.alerts.username_error'))
                }
                return false;
            }
        } catch (error) {
            console.error("Network error:", error);
            // MODIFICATION: Translation
            alert(i18next.t('profilePage.alerts.username_error'));
            return false;
        }
    };

    // Updating bio
    const updateBio = async (newBio: string) => {
        if (!userId) {
            return false;
        }
        
        const MAX_BIO_LENGTH = 70;
        const trimmedBio = newBio.trim(); 

        if (trimmedBio.length > MAX_BIO_LENGTH) {
            console.error(" Error: Bio is longer than the 70 characters limits.");
            // MODIFICATION: Translation with interpolation
            alert(i18next.t('profilePage.alerts.bio_limit', { count: MAX_BIO_LENGTH }));
            return false;
        }

        try {
            const response = await fetchWithAuth(`api/user/${userId}/bio`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: trimmedBio })
            });

            if (response.ok) {
                if (bioDisplay) {
                    // MODIFICATION: Translation
                    bioDisplay.innerHTML = parseMessage(trimmedBio) || i18next.t('profilePage.bio_placeholder');
                }

                SocketService.getInstance().socket?.emit('notifyProfileUpdate', {
                    userId: Number(userId),
                    bio: trimmedBio,
                    username: localStorage.getItem('username')
                });
                return true;

            } else {
                console.error("Error updating bio");
                // MODIFICATION: Translation
                alert(i18next.t('profilePage.alerts.bio_error'));
                return false;
            }
        } catch (error) {
            console.error("Network error:", error);
            // MODIFICATION: Translation
            alert(i18next.t('profilePage.alerts.bio_error'));
            return false;
        }
    };

    // Updating email
    const updateEmail = async (newEmail: string) => {
        if (!userId || !newEmail.trim()) {
            return false;
        }

        try {
            const response = await fetchWithAuth(`api/user/${userId}/email`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail })
            });

            const user = await response.json();
            if (response.ok) {
                // MODIFICATION: Translation
                alert(i18next.t('profilePage.alerts.email_success'));
                currentUserEmail = newEmail;
                return true;

            } else {
                console.error(user.error.message);
                alert(user.error.message);
                return false;
            }
        } catch (error) {
            console.error("Network error:", error);
            // MODIFICATION: Translation
            alert(i18next.t('profilePage.alerts.email_error'));
            return false;
        }
    };

    // Updating theme
    const updateTheme = async (newTheme: string) => {
        if (!userId) {
            return;
        }

        try {
            const response = await fetchWithAuth(`api/user/${userId}/theme`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme: newTheme })
            });

            if (response.ok) {
                localStorage.setItem('userTheme', newTheme);
            } else {
                console.error("Failed to save theme to database");
            }
        } catch (error) {
            console.error("Network error saving theme:", error);
        }
    };


//================================================
//================== EDIT MODE ===================
//================================================

    const setupField = (elements: FieldElements, fieldName: string) => {
        
        const { display, input, changeButton, confirmButton } = elements;
        let initialValue = display.innerText;
        const MAX_BIO_LENGTH = 70;
        const charCountElement = fieldName === 'bio' ? elements.container.querySelector('.char-count') as HTMLSpanElement : null;

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

        // Editiong concerned input
        const enableEditMode = () => {
            
            initialValue = fieldName === 'password' ? '' : display.innerText;
            display.classList.add('hidden');
            input.classList.remove('hidden');
            input.disabled = false;
            
            if (fieldName !== 'password') {
                input.value = '';
                input.placeholder = initialValue;
            } else {
                input.value = '';
            }

            if (fieldName === 'bio' && charCountElement) {
                charCountElement.classList.remove('hidden');
                const initialLength = initialValue.length;
                updateCharCount(initialLength);
            }

            changeButton.classList.add('hidden');
            confirmButton.classList.add('hidden'); 
            input.focus();
        };

        // Disabling edit mode
        const disableEditMode = (newValue: string) => {
            if (fieldName !== 'password') {
                initialValue = newValue;
            }

            display.classList.remove('hidden');
            input.classList.add('hidden');
            input.disabled = true;

            if (fieldName === 'password') {
                 display.innerText = "********";
            } else {
                 display.innerText = newValue;
                 input.value = "";
                 input.placeholder = newValue;
            }

            if (fieldName === 'bio' && charCountElement) {
                charCountElement.classList.add('hidden');
            }
            
            changeButton.classList.remove('hidden');
            confirmButton.classList.add('hidden');
        };

        changeButton.addEventListener('click', enableEditMode);
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


//================================================
//=============== UPDATING STATUS ================
//================================================

    const updateStatus = async (newStatus: string) => {
        if (!userId) {
            return;
        }

        try {
            const response = await fetchWithAuth(`api/user/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                updateStatusFrame(newStatus);
                localStorage.setItem('userStatus', newStatus); 

                const username = localStorage.getItem('username');
                SocketService.getInstance().socket?.emit('notifyStatusChange', { 
                    userId: Number(userId), 
                    status: newStatus,
                    username: username 
                });

            } else {
                console.error("Error updating status");
                // MODIFICATION: Translation
                alert(i18next.t('profilePage.alerts.status_error'));
            }
        } catch (error) {
            console.error("Network error:", error);
            // MODIFICATION: Translation
            alert(i18next.t('profilePage.alerts.status_error'));
        }
    };

    statusSelect?.addEventListener('change', () => {
        const selectedValue = statusSelect.value;
        // MODIFICATION: Logic to support translated values in dropdown
        // Find the key (e.g., 'Available') that corresponds to the selected translated value
        let englishKey = Object.keys(statusMapping).find(key => {
             // We check if the selectedValue matches either the English key or the translated display value
             const backendValue = statusMapping[key];
             const translatedDisplay = reverseStatusMapping[backendValue];
             return selectedValue === key || selectedValue === translatedDisplay || selectedValue === backendValue;
        });

        // Fallback for direct match if logic above is too complex or html values are static
        if (!englishKey && statusMapping[selectedValue]) {
            englishKey = selectedValue;
        }

        const statusKey = englishKey ? statusMapping[englishKey] : null;

        if (statusKey) {
            updateStatus(statusKey);
        }
    });


//================================================
//============== UPDATING PASSWORD ===============
//================================================

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
        if (currentPwdInput) {
            currentPwdInput.value = '';
        }
        if (newPwdInput) {
            newPwdInput.value = '';
        }
        if (confirmPwdInput) {
            confirmPwdInput.value = '';
        }
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

        if (!oldPass || !newPass || !confirmPass) {
            if (pwdError) {
                // MODIFICATION: Translation
                pwdError.innerText = i18next.t('profilePage.alerts.pwd_inputs');
                pwdError.classList.remove('hidden');
            }
            return;
        }

        if (newPass !== confirmPass) {
            console.log("newpass: , confirmpass:", newPass, confirmPass);
            if (pwdError) {
                // MODIFICATION: Translation
                pwdError.innerText = i18next.t('profilePage.alerts.pwd_mismatch');
                pwdError.classList.remove('hidden');
            }
            return;
        }
        
        if (newPass.length < 8) {
            if (pwdError) {
                // MODIFICATION: Translation
                pwdError.innerText = i18next.t('profilePage.alerts.pwd_length');
                pwdError.classList.remove('hidden');
            }
            return;
        }

        try {
            const response = await fetchWithAuth(`api/user/${userId}/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPass, newPass, confirmPass })
            });

            const result = await response.json();

            if (response.ok) {
                // MODIFICATION: Translation
                alert(i18next.t('profilePage.alerts.pwd_success'));
                closePwdModal();
            } else {
                if (pwdError) {
                    console.log("pwdError");
                    // MODIFICATION: Translation fallback
                    pwdError.innerText = result.error?.message || i18next.t('profilePage.alerts.pwd_error');
                    pwdError.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error("Catched error:", error);
            if (pwdError) {
                // MODIFICATION: Translation
                pwdError.innerText = i18next.t('profilePage.alerts.network_error');
                pwdError.classList.remove('hidden');
            }
        }
    });

    pwdModal?.addEventListener('click', (e) => {
        if (e.target === pwdModal) closePwdModal();
    });
}