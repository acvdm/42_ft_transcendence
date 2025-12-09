import htmlContent from "./ProfilePage.html";

// interface qui va servir à typer la réponse API de l'utilisateur
interface UserData {
    id: number;
    alias: string;
    avatar_url?: string;
    bio?: string;
    status?: string;
}

export function render(): string {
    return htmlContent;
}

export function afterRender(): void {

    const mainAvatar = document.getElementById('current-avatar') as HTMLImageElement;
    const statusFrame = document.getElementById('current-statut') as HTMLImageElement;
    const usernameDisplay = document.getElementById('username-profile');
    const bioDisplay = document.getElementById('bio-profile');
    const modal = document.getElementById('picture-modal');
    
    // Inputs pour username et bio
    const usernameInput = document.querySelector('input[placeholder="Username"]') as HTMLInputElement;
    const bioInput = document.querySelector('input[placeholder="Share a quick message"]') as HTMLInputElement;
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

    const userId = localStorage.getItem('userId');

    // on conserve l'url temporaire qu'on a choisir dans la modale
    let selectedImageSrc: string = mainAvatar?.src || "";

    // Mapping des status vers les images de frame
    const statusImages: { [key: string]: string } = {
        'available': 'https://wlm.vercel.app/assets/status/status_frame_online_large.png',
        'busy':      'https://wlm.vercel.app/assets/status/status_frame_busy_large.png',
        'away':      'https://wlm.vercel.app/assets/status/status_frame_away_large.png',
        'invisible': 'https://wlm.vercel.app/assets/status/status_frame_offline_large.png'
    };

    // Mapping des valeurs du select vers les valeurs de la DB
    const statusMapping: { [key: string]: string } = {
        'Available': 'available',
        'Busy': 'busy',
        'Away': 'away',
        'Appear offline': 'invisible'
    };

    const reverseStatusMapping: { [key: string]: string } = {
        'available': 'Available',
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
            const response = await fetch(`api/users/${userId}`);
            
            if (response.ok) {
                const user: UserData = await response.json();

                // maj avatar si on arrive a le recuperer
                if (user.avatar_url && mainAvatar) {
                    mainAvatar.src = user.avatar_url;
                    // maj de selected image pour que la modale ait l'image mis a jour
                    selectedImageSrc = user.avatar_url; 
                }

                // maj pseudo et bio sur la page principale ET dans les inputs
                if (user.alias) {
                    if (usernameDisplay) usernameDisplay.innerText = user.alias;
                    if (usernameInput) usernameInput.value = user.alias;
                }

                if (user.bio) {
                    if (bioDisplay) bioDisplay.innerText = user.bio;
                    if (bioInput) bioInput.value = user.bio;
                }

                // maj du status
                if (user.status) {
                    const statusValue = reverseStatusMapping[user.status] || 'Appear offline';
                    if (statusSelect) statusSelect.value = statusValue;
                    updateStatusFrame(user.status);
                }
            }
        } catch (error) {
            console.error("Erreur while charging profile:", error);
        }
    };

    // Fonction pour mettre à jour la frame du status
    const updateStatusFrame = (status: string) => {
        if (statusFrame && statusImages[status]) {
            statusFrame.src = statusImages[status];
        }
    };

    // on recharge la page
    loadUserData();


    // ============================================================
    // ========== MAJ USERNAME ET BIO EN TEMPS RÉEL ===============
    // ============================================================

    // Mise à jour du username
    const updateUsername = async (newUsername: string) => {
        if (!userId || !newUsername.trim()) return;

        try {
            const response = await fetch(`api/users/${userId}/alias`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alias: newUsername })
            });

            if (response.ok) {
                if (usernameDisplay) usernameDisplay.innerText = newUsername;
                console.log("Username mis à jour");
            } else {
                console.error("Erreur lors de la mise à jour du username");
                alert("Erreur lors de la sauvegarde du username");
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            alert("Erreur lors de la sauvegarde du username");
        }
    };

    // Mise à jour de la bio
    const updateBio = async (newBio: string) => {
        if (!userId) return;

        try {
            const response = await fetch(`api/users/${userId}/bio`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: newBio })
            });

            if (response.ok) {
                if (bioDisplay) bioDisplay.innerText = newBio || "c00uköü les kop1";
                console.log("Bio mise à jour");
            } else {
                console.error("Erreur lors de la mise à jour de la bio");
                alert("Erreur lors de la sauvegarde de la bio");
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            alert("Erreur lors de la sauvegarde de la bio");
        }
    };

    // Mise à jour du status
    // Mise à jour du status
    const updateStatus = async (newStatus: string) => {
        if (!userId) return;

        try {
            const response = await fetch(`api/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                updateStatusFrame(newStatus);
                localStorage.setItem('userStatus', newStatus); // ← AJOUT ICI
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

    // Event listeners pour les inputs
    usernameInput?.addEventListener('blur', () => {
        const newUsername = usernameInput.value.trim();
        if (newUsername) {
            updateUsername(newUsername);
        }
    });

    usernameInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            usernameInput.blur();
        }
    });

    bioInput?.addEventListener('blur', () => {
        const newBio = bioInput.value.trim();
        updateBio(newBio);
    });

    bioInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            bioInput.blur();
        }
    });

    // Event listener pour le select du status
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
            const response = await fetch(`api/users/${userId}/avatar`, {
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