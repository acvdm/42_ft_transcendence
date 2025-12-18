import { fetchWithAuth } from "../pages/api"; 
import { statusImages, statusLabels } from "./Data";
import { parseMessage } from "./ChatUtils";
import SocketService from "../services/SocketService";

export class UserProfile {
    private bioText: HTMLElement | null;
    private bioWrapper: HTMLElement | null;
    private statusFrame: HTMLImageElement | null;
    private statusText: HTMLElement | null;
    private userConnected: HTMLElement | null;
    private userProfileImg: HTMLImageElement | null;
    private statusSelector: HTMLElement | null;
    private statusDropdown: HTMLElement | null;
    private charCountElement: HTMLSpanElement | null;

    constructor() {
        this.bioText = document.getElementById('user-bio');
        this.bioWrapper = document.getElementById('bio-wrapper');
        this.statusFrame = document.getElementById('user-status') as HTMLImageElement;
        this.statusText = document.getElementById('current-status-text');
        this.userConnected = document.getElementById('user-name');
        this.userProfileImg = document.getElementById('user-profile') as HTMLImageElement;
        this.statusSelector = document.getElementById('status-selector');
        this.statusDropdown = document.getElementById('status-dropdown');
        this.charCountElement = document.querySelector<HTMLSpanElement>('#bio-wrapper .char-count');
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
				this.bioText.dataset.raw = userData.bio;
                this.bioText.innerHTML = parseMessage(userData.bio);
            }
            if (this.userProfileImg) {
                this.userProfileImg.src = userData.avatar_url || userData.avatar;
            }
            if (userData.status) {
                const normalizedStatus = userData.status.toLowerCase();
                this.updateStatusDisplay(normalizedStatus);
                localStorage.setItem('userStatus', normalizedStatus);
            }

        } catch (error) {
            console.error("Error loading user profile:", error);
        }
    }

    // LOGIQUE DE LA BIO et de la PHOTO
    private setupBioEdit() {
        if (!this.bioText || !this.bioWrapper) return;

        // on mets a jour le compteur
        const updateCharCount = (currentLength: number) => {
            if (this.charCountElement) {
                this.charCountElement.innerText = `${currentLength}/70`;
                // rouge si la limite est depaassse
                if (currentLength > 70) {
                    this.charCountElement.classList.remove('text-gray-500');
                    this.charCountElement.classList.add('text-red-500');
                } else {
                    this.charCountElement.classList.remove('text-red-500');
                    this.charCountElement.classList.add('text-gray-500');
                }
            }
        };


        this.bioText.addEventListener('click', () => {
            const input = document.createElement("input");
            const currentText = this.bioText!.dataset.raw || ""; 
            
            input.type = "text";
            input.value = currentText;
            input.className = "text-sm text-gray-700 italic border border-gray-300 rounded px-2 py-1 w-full bg-white focus:outline-none focus:ring focus:ring-blue-300";

            this.bioWrapper!.replaceChild(input, this.bioText!);
            
            // affichage du compteur et initialiastion a la longueuyr actuelle de mon texte
            if (this.charCountElement) {
                this.charCountElement.classList.remove('hidden');
                updateCharCount(currentText.length);
            }
            
            input.focus();

            // on ecoute l'input pour connaitre le nombre de caracteres
            input.addEventListener('input', () => {
                const currentLength = input.value.length;
                updateCharCount(currentLength);
            });


            const finalize = async (text: string) => {
                if (!this.bioWrapper || !this.bioText) return;
                
                // on cache le compteur quand on en a plus bexoin
                if (this.charCountElement) {
                    this.charCountElement.classList.add('hidden');
                }

                const newBio = text.trim() || "Share a quick message";
                const userId = localStorage.getItem('userId');
                
                const trimmedBio = newBio.trim(); 

                // check de lal ongueyr
                if (trimmedBio.length > 70) {
                    console.error("Error: Cannot exceed 70 characters.");
                    alert(`Your message cannot exceed 70 characters. Stop talking!`);
                    
                    // on revient a l'ancienne biuo
                    this.bioWrapper!.replaceChild(this.bioText!, input);
                    this.bioText!.innerHTML = parseMessage(this.bioText!.dataset.raw || "Share a quick message");
                    
                    return false;
                }
                
                // si la longueur est ok, zou ça passe à l'api
                try {
                    const response = await fetchWithAuth(`api/users/${userId}/bio`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bio: trimmedBio })
                    });
                    
                    if (response.ok) {
                        this.bioText!.dataset.raw = trimmedBio;
                        this.bioText!.innerHTML = parseMessage(trimmedBio) || "Share a quick message";
                        this.bioWrapper!.replaceChild(this.bioText!, input);
                        console.log("Message updated");
                        const socket = SocketService.getInstance().socket;

                        socket.emit('notifyProfileUpdate', {
                            userId: Number(userId),
                            bio: trimmedBio,
                            username: localStorage.getItem('username')
                        });
                        return true;
                    } else {
                        console.error("Error while updating your message");
                        this.bioWrapper!.replaceChild(this.bioText!, input); // si erreur api on remet l'ancienne bio
                        return false;
                    }
                } catch (error) {
                    console.error("Network error:", error);
                    this.bioWrapper!.replaceChild(this.bioText!, input);
                    return false;
                }
            };

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") finalize(input.value);
            });
            
            input.addEventListener("blur", () => {
                if (input.value.trim().length <= 70) {
                    finalize(input.value);
                } else {
                    alert(`Your message cannot exceed 70 characters. Stop talking!`);
                    
                    if (this.charCountElement) {
                        this.charCountElement.classList.add('hidden');
                    }
                    this.bioWrapper!.replaceChild(this.bioText!, input);
                }
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

                            const socket = SocketService.getInstance().socket;
                            const username = localStorage.getItem('username');

                            if (socket && username) {
                                socket.emit('notifyStatusChange', { 
                                    userId: Number(userId), 
                                    status: selectedStatus,
                                    username: username 
                                });
                            }
                            this.updateStatusDisplay(selectedStatus);

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
        const rawStatus = localStorage.getItem('userStatus') || 'available';
        const savedStatus = rawStatus.toLowerCase();
        this.updateStatusDisplay(savedStatus);
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'userStatus' && e.newValue) {
                this.updateStatusDisplay(e.newValue.toLowerCase());
            }
        });
    }

    public updateStatusDisplay(status: string) {
        if (this.statusFrame && statusImages[status]) {
            console.log("Status:", this.statusFrame);
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