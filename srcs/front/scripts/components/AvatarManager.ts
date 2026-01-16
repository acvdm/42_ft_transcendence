import { fetchWithAuth } from "../services/api";
import SocketService from "../services/SocketService";
import i18next from "../i18n";

export class AvatarManager {
	private modal: HTMLElement | null;
	private mainAvatar: HTMLImageElement | null;
	private previewAvatar: HTMLImageElement | null;
	private selectedImageSrc: string = "";
	private userId: string | null;

	constructor(userId: string | null) {
		this.userId = userId;
		this.modal = document.getElementById('picture-modal');
		this.mainAvatar = document.getElementById('current-avatar') as HTMLImageElement;
		this.previewAvatar = document.getElementById('modal-preview-avatar') as HTMLImageElement;
	}

	public init() {
		if (!this.modal || !this.mainAvatar) {
			return;
		}

		const editButton = document.getElementById('edit-picture-button');
		const closeButton = document.getElementById('close-modal');
		const cancelButton = document.getElementById('cancel-button');
		const okButton = document.getElementById('validation-button');
		const browseButton = document.getElementById('browse-button');
		const fileInput = document.getElementById('file-input') as HTMLInputElement;
		const deleteButton = document.getElementById('delete-button');
		const gridContainer = document.getElementById('modal-grid');

		// Listeners
		editButton?.addEventListener('click', () => this.openModal());
		closeButton?.addEventListener('click', () => this.closeModal());
		cancelButton?.addEventListener('click', () => this.closeModal());
		this.modal.addEventListener('click', (e) => {
			if (e.target === this.modal) {
				this.closeModal();
			}
		});

		// Grid for the profil pic
		if (gridContainer) {
			const gridImages = gridContainer.querySelectorAll('img');
			gridImages.forEach(img => {
				img.addEventListener('click', () => {
					this.selectedImageSrc = img.src;
					
					if (this.previewAvatar) {
						this.previewAvatar.src = this.selectedImageSrc;
					}
					gridImages.forEach(i => i.classList.remove('border-[#0078D7]'));
					img.classList.add('border-[#0078D7]'); 
				});
			});
		}

		// Uploading personal file as picture
		browseButton?.addEventListener('click', () => fileInput?.click());
		fileInput?.addEventListener('change', (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					if (e.target?.result) {
						this.selectedImageSrc = e.target.result as string;
						if (this.previewAvatar) {
							this.previewAvatar.src = this.selectedImageSrc;
						}
					}
				};
				reader.readAsDataURL(file);
			}
		});

		// Delete 
		deleteButton?.addEventListener('click', () => {
			const defaultAvatar = "/assets/basic/default.png";
			this.selectedImageSrc = defaultAvatar;
			if (this.previewAvatar) {
				this.previewAvatar.src = defaultAvatar;
			}
		});

		okButton?.addEventListener('click', async () => this.saveAvatar());
	}

	private openModal() {
		if (!this.modal || !this.previewAvatar || !this.mainAvatar) {
			return;
		}

		this.selectedImageSrc = this.mainAvatar.src;
		this.previewAvatar.src = this.selectedImageSrc;
		this.modal.classList.remove('hidden');
		this.modal.classList.add('flex');
	}

	private closeModal() {
		this.modal?.classList.add('hidden');
		this.modal?.classList.remove('flex');
	}

	private async saveAvatar() {
		if (!this.userId) {
			return;
		}

		try {
			const response = await fetchWithAuth(`api/user/${this.userId}/avatar`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ avatar: this.selectedImageSrc })
			});

			if (response.ok) {
				const result = await response.json();
				const cleanAvatarUrl = result.data.avatar;
				
				if (this.mainAvatar) {
					this.mainAvatar.src = cleanAvatarUrl;
				}
				
				SocketService.getInstance().socket?.emit('notifyProfileUpdate', {
					userId: Number(this.userId),
					avatar: cleanAvatarUrl,
					username: localStorage.getItem('username')
				});
				this.closeModal();
			} else {
				alert(i18next.t('profilePage.alerts.avatar_save_error'));
			}
		} catch (error) {
			console.error("Network error:", error);
		}
	}
}