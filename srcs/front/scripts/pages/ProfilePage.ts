import htmlContent from "./ProfilePage.html";
import { fetchWithAuth } from "./api";
import { parseMessage } from "../components/ChatUtils";
import { appThemes } from "../components/Data";

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
    
    // modale 2fa
    const button2faToggle = document.getElementById('2fa-modal-button') as HTMLImageElement;
    const modal2fa = document.getElementById('2fa-modal') as HTMLImageElement;
    const close2faButton = document.getElementById('close-2fa-modal');
    const cancel2faButton = document.getElementById('cancel-2fa-button');
    const confirm2faButton = document.getElementById('confirm-2fa-button');
    const input2fa = document.getElementById('2fa-input-code') as HTMLInputElement;
    const qrCodeImg = document.getElementById('2fa-qr-code') as HTMLImageElement;


    const userId = localStorage.getItem('userId');

    // on conserve l'url temporaire qu'on a choisir dans la modale
    let selectedImageSrc: string = mainAvatar?.src || "";
    let is2faEnabled = false;

    const statusImages: { [key: string]: string } = {
        'available': 'https://wlm.vercel.app/assets/status/status_frame_online_large.png',
        'online': 'https://wlm.vercel.app/assets/status/status_frame_online_large.png',
        'busy':      'https://wlm.vercel.app/assets/status/status_frame_busy_large.png',
        'away':      'https://wlm.vercel.app/assets/status/status_frame_away_large.png',
        'invisible': 'https://wlm.vercel.app/assets/status/status_frame_offline_large.png'
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

    // rajouter la personnalisation sur la modale pour avoir un apercu du theme
    if (themeGrid && themeGrid.children.length === 0) {
        Object.entries(appThemes).forEach(([key, theme]) => {
            const div = document.createElement('div');
            // Mise à jour des classes pour la sélection
            div.className = `theme-item cursor-pointer border-2 rounded overflow-hidden transition-all hover:shadow-lg`;
            div.dataset.themeKey = key; // Stocker la clé pour la sélection
            
            // Appliquer la bordure bleue si c'est le thème actuel
            if (key === currentTheme) {
                div.classList.add('border-blue-500', 'shadow-blue-500/50'); // Bordure initiale pour le thème actif
                selectedThemeElement = div; // Définir comme élément sélectionné
            } else {
                div.classList.add('border-gray-300', 'hover:border-blue-500'); // Bordure par défaut
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

                // 1. Mise à jour de l'affichage de sélection (bordures)
                if (selectedThemeElement) {
                    selectedThemeElement.classList.remove('border-blue-500', 'shadow-lg');
                    selectedThemeElement.classList.add('border-gray-300', 'hover:border-blue-500');
                }
                this.classList.remove('border-gray-300', 'hover:border-blue-500');
                this.classList.add('border-blue-500', 'shadow-lg');
                selectedThemeElement = this;

                // 2. Application et sauvegarde du thème
                applyTheme(themeKey);
                updateTheme(themeKey);
                closeThemeFunc(); // Fermer la modale après la sélection
            });

            themeGrid.appendChild(div);
        });
    }

    themeModal?.addEventListener('click', (e) => {
        if (e.target === themeModal) closeThemeFunc();
    });


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

    const close2fa = () => {
        if (modal2fa)
        {
            modal2fa.classList.add('hidden');
            modal2fa.classList.remove('flex');
            if (input2fa) input2fa.value = ""; // on reset le tout
            if (qrCodeImg) qrCodeImg.src = "";
        }
    };

    const open2faGenerate = async () => {
        if (!userId) return;

        try {
            if (modal2fa) {
                modal2fa.classList.remove('hidden');
                modal2fa.classList.add('flex');
            }

            //fetch pour le qr code
            const response = await fetchWithAuth(`api/auth/2fa/generate`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.data && result.data.qrCodeUrl) {
                    if (qrCodeImg) qrCodeImg.src = result.data.qrCodeUrl;
                }
            } else {
                console.error("Failed to generate QR code");
                alert("Error generating 2FA QR code");
                close2fa();
            }
        } catch (error) {
            console.error("Network error 2FA generate:", error);
            close2fa();
        }
    };

    const enable2fa = async () => {
        const code = input2fa.value.trim();
        if (!code || code.length < 6) {
            alert("Please enter a valid 6-digit code.");
            return;
        }

        try {
            const response = await fetchWithAuth(`api/auth/2fa/enable`, {
                method: 'POST', // ou patch?? a tester
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            if (response.ok) {
                update2faButton(true);
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
                alert("2FA disabled.");
            } else {
                alert("Error disabling 2FA.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    button2faToggle?.addEventListener('click', () => {
        if (is2faEnabled) {
            disable2fa();
        } else {
            open2faGenerate();
        }
    });

    close2faButton?.addEventListener('click', close2fa);
    cancel2faButton?.addEventListener('click', close2fa);
    confirm2faButton?.addEventListener('click', enable2fa);
    
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
                        let value = user[fieldName as keyof UserData] as string | undefined;

                        if (fieldName === 'alias' && user.alias) {
                            value = user.alias;
                            if (usernameDisplay)
                                usernameDisplay.innerText = value;
                        } else if (fieldName === 'bio' && user.bio) {
                            value = user.bio;
                            if (bioDisplay)
                                bioDisplay.innerHTML = parseMessage(value);
                        } else if (fieldName === 'email' && user.email) {
                            value = user.email;
                        } else if (fieldName === 'password') {
                            // on ne met pas la vraie valeur dans le champs pour des questions de securité
                            value = "********"; 
                        }

                        if (value) {
                            display.innerText = value;
                            if (fieldName !== 'password') {
                                // idem que le placeholder au debut
                                input.placeholder = value;
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
                if (usernameDisplay) usernameDisplay.innerText = newUsername;
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
                user.email = newEmail;
                console.log("Email mis à jour");
                return true;
            } else {
                console.error(user.error.message);
                alert(user.error.message);
                return false;
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            alert("Erreur lors de la sauvegarde du Email");
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
            console.error("Network error while saving theme:", error);
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
                pwdError.innerText = "All inpuys are required.";
                pwdError.classList.remove('hidden');
            }
            return;
        }

        if (newPass !== confirmPass) {
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

        try {
            const response = await fetchWithAuth(`api/users/${userId}/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPass, newPass })
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
        const defaultAvatar = "https://wlm.vercel.app/assets/usertiles/default.png";
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

            if (response.ok) {
                // maj sur le profil
                if (mainAvatar) mainAvatar.src = selectedImageSrc;
                
                // on ferme la modale une fois qu'on a valide
                closeModalFunc();
                
                console.log("avatar maj");
            } else {
                console.error("Error while updating");
                alert("Error while saving");
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    });
}