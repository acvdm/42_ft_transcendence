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
    const usernameDisplay = document.getElementById('username-profile');
    const bioDisplay = document.getElementById('bio-profile');
    const modal = document.getElementById('picture-modal');
    
    // buoutons
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

                // maj pseudo et bio sur la page principale
                if (user.alias && usernameDisplay)
                    usernameDisplay.innerText = user.alias;

                if (user.bio && bioDisplay)
                    bioDisplay.innerText = user.bio;
            }
        } catch (error) {
            console.error("Erreur while charging profile:", error);
        }
    };

    // on recharge la page
    loadUserData();


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
        const defaultAvatar = "https://wlm.vercel.app/assets/usertiles/default.png"; // charger la version locale
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
};