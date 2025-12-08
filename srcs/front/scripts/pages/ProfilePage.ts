import htmlContent from "./ProfilePage.html";

export function render(): string {
    return htmlContent;
}

export function afterRender(): void {
    const editProfilePic = document.getElementById('edit-picture-button');
    const modal = document.getElementById('picture-modal');
    const closeModal = document.getElementById('close-modal');
    
    editProfilePic?.addEventListener('click', () => {
        modal?.classList.remove('hidden');
        modal?.classList.add('flex');
    });

    closeModal?.addEventListener('click', () => {
        modal?.classList.add('hidden');
        modal?.classList.remove('flex');
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    });
};