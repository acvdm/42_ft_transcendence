import htmlContent from "./ProfilePage.html";
import { fetchWithAuth } from "./api";
import { parseMessage } from "../components/ChatUtils";

// interface qui va servir à typer la réponse API de l'utilisateur
interface UserData {
    id: number;
    alias: string;
    avatar_url?: string;
    bio?: string;
    status?: string;
    email?: string;
}

export function render(): string {
    return htmlContent;
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
    
    // boutons
    const editButton = document.getElementById('edit-picture-button');
    const closeButton = document.getElementById('close-modal');
    const cancelButton = document.getElementById('cancel-button');
    const okButton = document.getElementById('validation-button');
    const browseButton = document.getElementById('browse-button');
    const deleteButton = document.getElementById('delete-button');

    // modale
    const gridContainer = document.getElementById('modal-grid');
    const previewAvatar = document.getElementById('modal-preview-avatar') as HTMLImageElement;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    
    // container des champs modifiables via l'id data-field
    const fieldContainers = document.querySelectorAll<HTMLElement>('.flex.flex-row.gap-2[data-field]');

    const userId = localStorage.getItem('userId');

    // on conserve l'url temporaire qu'on a choisir dans la modale
    let selectedImageSrc: string = mainAvatar?.src || "";

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

                // maj avatar si on arrive a le recuperer
                if (user.avatar_url && mainAvatar) {
                    mainAvatar.src = user.avatar_url;
                    // maj de selected image pour que la modale ait l'image mis a jour
                    selectedImageSrc = user.avatar_url; 
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
            if (response.ok) {
                if (usernameDisplay) usernameDisplay.innerText = newUsername;
                console.log("Username mis à jour");
                return true;
            } else {
                console.error("Erreur lors de la mise à jour du username");
                alert("Erreur lors de la sauvegarde du username");
                return false;
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            alert("Erreur lors de la sauvegarde du username");
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
            const data = await response.json();
            if (response.ok) {
                const user: UserData = await response.json();
                user.email = newEmail;
                console.log("Email mis à jour");
                return true;
            } else {
                console.error(data.error.message);
                alert(data.error.message);
                return false;
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            alert("Erreur lors de la sauvegarde du Email");
            return false;
        }
    };

    //maj password /////////// to complete avec la partie de Anne le chat
    const updatePassword = async (newPassword: string) => {

    };


    // ============================================================
    // ============ LOGIQUE CHANGE / CONFIRM GÉNÉRIQUE ============
    // ============================================================
    
    // comportement d'un champs 
    const setupField = (elements: FieldElements, fieldName: string) => {
        const { display, input, changeButton, confirmButton } = elements;
        
        // stockage de la valeur initiale
        let initialValue = display.innerText;
        
        // Limite de caractères pour la bio
        const MAX_BIO_LENGTH = 70;
        
        // NOUVEAU : Récupérer l'élément de compteur si c'est la bio
        const charCountElement = fieldName === 'bio' 
            ? elements.container.querySelector('.char-count') as HTMLSpanElement
            : null;

        // Fonction de mise à jour du compteur
        const updateCharCount = (currentLength: number) => {
            if (charCountElement) {
                charCountElement.innerText = `${currentLength}/${MAX_BIO_LENGTH}`;
                // Appliquer un style si la limite est dépassée
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

            // Afficher le compteur pour la bio et l'initialiser
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

            // Masquer le compteur
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
                // 1. Mise à jour du compteur
                updateCharCount(currentValue.length);

                // 2. Validation de la longueur
                if (currentValue.length > MAX_BIO_LENGTH) {
                    isValid = false;
                }
                
                // 3. Vérification si la bio a été modifiée et n'est pas vide
                const initialTrimmedValue = initialValue.trim();
                isChanged = trimmedValue.length > 0 && trimmedValue !== initialTrimmedValue;

            } else if (fieldName === 'password') {
                isChanged = currentValue.length > 0;
            } else {
                // Autres champs
                isChanged = trimmedValue !== initialValue.trim() && trimmedValue.length > 0;
            }


            // Le bouton de confirmation est visible si:
            // 1. La valeur est changée ET
            // 2. La valeur est valide (ne dépasse pas la limite)
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
                // case 'password':
                //     updateSuccessful = await updatePassword(newValue);
                //     break;
                default:
                    updateSuccessful = true; // Aucune action spécifique
            }

            if (updateSuccessful) {
                disableEditMode(newValue);
            }
        });

        // focus/unfocus quand on clic
        input.addEventListener('blur', (e) => {
            // Si on sort du champ sans cliquer sur Confirm
            if (e.relatedTarget !== confirmButton) {
                const isConfirmedVisible = !confirmButton.classList.contains('hidden');

                if (isConfirmedVisible) {
                    // Si le bouton Confirm était visible, c'est qu'on a fait une modification, 
                    // mais si on sort sans confirmer, on annule et on revient à la valeur initiale.
                    disableEditMode(fieldName === 'password' ? display.innerText : initialValue);
                } else {
                    // Si le bouton Confirm n'était pas visible, on désactive juste le mode édition
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