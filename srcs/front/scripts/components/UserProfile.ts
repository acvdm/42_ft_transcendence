import { fetchWithAuth } from "../pages/api"; 
import { statusImages, statusLabels } from "./Data";
import { parseMessage } from "./ChatUtils";

export class UserProfile {
    private bioText: HTMLElement | null;
    private bioWrapper: HTMLElement | null;
    private statusFrame: HTMLImageElement | null;
    private statusText: HTMLElement | null;
    private userConnected: HTMLElement | null;
    private userProfileImg: HTMLImageElement | null;
    private statusSelector: HTMLElement | null;
    private statusDropdown: HTMLElement | null;

    constructor() {
        this.bioText = document.getElementById('user-bio');
        this.bioWrapper = document.getElementById('bio-wrapper');
        this.statusFrame = document.getElementById('user-status') as HTMLImageElement;
        this.statusText = document.getElementById('current-status-text');
        this.userConnected = document.getElementById('user-name');
        this.userProfileImg = document.getElementById('user-profile') as HTMLImageElement;
        this.statusSelector = document.getElementById('status-selector');
        this.statusDropdown = document.getElementById('status-dropdown');
    }

    public init() {
        this.loadUserData();
        this.setupBioEdit();
        this.setupStatusSelector();
        this.loadSavedStatus();
    }

    // CHARGEMENT DE LA BIO
    private async loadUserData() {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.warn("No user ID found");
            return;
        }

        try {
            const response = await fetchWithAuth(`/api/users/${userId}`);
            
            if (!response.ok) throw new Error('Failed to fetch user profile');

            const userData = await response.json();

            if (this.userConnected && userData.alias) {
                this.userConnected.textContent = userData.alias;
                localStorage.setItem('username', userData.alias);
            }
            if (this.bioText && userData.bio) {
                this.bioText.innerHTML = parseMessage(userData.bio);
            }
            if (this.userProfileImg) {
                this.userProfileImg.src = userData.avatar_url || userData.avatar;
            }
            if (userData.status) {
                this.updateStatusDisplay(userData.status);
                localStorage.setItem('userStatus', userData.status);
            }

        } catch (error) {
            console.error("Error loading user profile:", error);
        }
    }

    // LOGIQUE DE LA BIO et de la PHOTO
    private setupBioEdit() {
        if (!this.bioText) return;

        this.bioText.addEventListener('click', () => {
            const input = document.createElement("input");
            const currentText = this.bioText?.textContent === "Share a quick message" ? "" : this.bioText?.textContent || "";
            
            input.type = "text";
            input.value = currentText;
            input.className = "text-sm text-gray-700 italic border border-gray-300 rounded px-2 py-1 w-full bg-white focus:outline-none focus:ring focus:ring-blue-300";

            if (this.bioWrapper && this.bioText) {
                this.bioWrapper.replaceChild(input, this.bioText);
                input.focus();
            }

            const finalize = async (text: string) => {
                if (!this.bioWrapper || !this.bioText) return;
                
                // teste filnak (texte final)
                const newBio = text.trim() || "Share a quick message";
                const userId = localStorage.getItem('userId');
                
                // maj avec emoticones
                const parsed = parseMessage(newBio);
                this.bioText.innerHTML = parsed;
                
                if (this.bioWrapper.contains(input)) {
                    this.bioWrapper.replaceChild(this.bioText, input);
                }

                // envoi a la base de donnee
                if (userId) {
                    try {
                        const response = await fetchWithAuth(`/api/users/${userId}/bio`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ bio: newBio })
                        });
                        if (!response.ok) console.error('Error while saving bio');
                        else console.log('Bio saved!');
                    } catch (error) {
                        console.error('Network error:', error);
                    }
                }
            };

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") finalize(input.value);
            });
            input.addEventListener("blur", () => {
                finalize(input.value);
            });
        });
    }

    // LOGIQUE DES STATUS DYNAMIQUES
    private setupStatusSelector() {
        if (this.statusSelector && this.statusDropdown) {
            this.statusSelector.addEventListener('click', (e) => {
                e.stopPropagation();
                this.statusDropdown!.classList.toggle('hidden');
                // fermeture des autres menus
                document.getElementById('emoticon-dropdown')?.classList.add('hidden');
                document.getElementById('add-friend-dropdown')?.classList.add('hidden');
            });

            const statusOptions = document.querySelectorAll('.status-option');
            statusOptions.forEach(option => {
                option.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const selectedStatus = (option as HTMLElement).dataset.status;

                    if (selectedStatus) {
                        this.updateStatusDisplay(selectedStatus);
                        localStorage.setItem('userStatus', selectedStatus);

                        const userId = localStorage.getItem('userId');
                        try {
                            await fetchWithAuth(`/api/users/${userId}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: selectedStatus })
                            });
                        } catch (error) {
                            console.error('Error updating status:', error);
                        }
                    }
                    this.statusDropdown!.classList.add('hidden');
                });
            });

            document.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (this.statusDropdown && !this.statusDropdown.contains(target) && !this.statusSelector!.contains(target)) {
                    this.statusDropdown.classList.add('hidden');
                }
            });
        }
    }

    private loadSavedStatus() {
        const savedStatus = localStorage.getItem('userStatus') || 'available';
        this.updateStatusDisplay(savedStatus);
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'userStatus' && e.newValue) {
                this.updateStatusDisplay(e.newValue);
            }
        });
    }

    public updateStatusDisplay(status: string) {
        if (this.statusFrame && statusImages[status]) {
            this.statusFrame.src = statusImages[status];
        }
        if (this.statusText && statusLabels[status]) {
            this.statusText.textContent = statusLabels[status];
        }

        const statusOptions = document.querySelectorAll('.status-option');
        statusOptions.forEach(option => {
            const opt = option as HTMLElement;
            const optionStatus = opt.dataset.status;
            if (optionStatus === status) opt.classList.add('bg-blue-50');
            else opt.classList.remove('bg-blue-50');
        });
    }
}