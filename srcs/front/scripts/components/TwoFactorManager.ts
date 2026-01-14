// srcs/front/scripts/components/profile/TwoFactorManager.ts
import { fetchWithAuth } from "../services/api";
import i18next from "../i18n";

export class TwoFactorManager {
    private userId: string | null;
    private is2faEnabled: boolean;
    private modal2fa: HTMLElement | null;
    
    // Elements DOM stockés pour usage interne
    private elements: any = {}; 

    constructor(userId: string | null) {
        this.userId = userId;
        this.is2faEnabled = localStorage.getItem('is2faEnabled') === 'true';
        this.modal2fa = document.getElementById('2fa-modal');
        this.cacheElements();
    }

    private cacheElements() {
        this.elements = {
            toggleButton: document.getElementById('2fa-modal-button'),
            qrImg: document.getElementById('2fa-qr-code') as HTMLImageElement,
            inputQr: document.getElementById('2fa-input-code') as HTMLInputElement,
            inputEmailCode: document.getElementById('2fa-input-code-email') as HTMLInputElement,
            methodSelection: document.getElementById('method-selection'),
            qrContent: document.getElementById('qr-content'),
            emailContent: document.getElementById('email-content'),
            inputEmail: document.getElementById('2fa-email-input') as HTMLInputElement,
            codeVerifSection: document.getElementById('code-verification'),
            sendCodeBtn: document.getElementById('send-code-button')
        };
    }

    public init() {
        this.updateToggleButton();
        this.setupListeners();
    }

    // Met à jour l'état initial (appelé depuis ProfilePage si besoin)
    public setStatus(enabled: boolean) {
        this.is2faEnabled = enabled;
        this.updateToggleButton();
    }

    private updateToggleButton() {
        const btn = this.elements.toggleButton;
        if (!btn) return;
        
        if (this.is2faEnabled) {
            // TRADUCTION
            btn.innerText = i18next.t('profilePage.twoFactor.btn_disable');
            btn.classList.remove('bg-green-600');
            btn.classList.add('bg-red-600');
        } else {
            // TRADUCTION
            btn.innerText = i18next.t('profilePage.twoFactor.btn_enable');
            btn.classList.remove('bg-red-600');
            btn.classList.add('bg-green-600');
        }
    }

    private setupListeners() {
        // Toggle principal
        this.elements.toggleButton?.addEventListener('click', () => {
            if (this.is2faEnabled) this.disable2fa();
            else this.openModal();
        });

        // Navigation
        document.querySelector('[data-method="qr"]')?.addEventListener('click', () => this.initiateSetup('qr'));
        document.querySelector('[data-method="email"]')?.addEventListener('click', () => this.initiateSetup('email'));
        
        document.getElementById('close-2fa-modal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-2fa-button')?.addEventListener('click', () => this.closeModal());
        document.getElementById('confirm-2fa-button')?.addEventListener('click', () => 
            this.enable2fa(this.elements.inputQr.value.trim(), 'qr')
        );
        document.getElementById('confirm-2fa-email')?.addEventListener('click', () => 
            this.enable2fa(this.elements.inputEmailCode.value.trim(), 'email')
        );
        
        // Clic dehors
        this.modal2fa?.addEventListener('click', (e) => {
            if (e.target === this.modal2fa) this.closeModal();
        });
    }

    private openModal() {
        if (!this.modal2fa) return;
        this.modal2fa.classList.remove('hidden');
        this.modal2fa.classList.add('flex');
        this.switchView('selection');
    }

    private closeModal() {
        if (!this.modal2fa) return;
        this.modal2fa.classList.add('hidden');
        this.modal2fa.classList.remove('flex');
        // Reset inputs
        if (this.elements.inputQr) this.elements.inputQr.value = "";
        if (this.elements.inputEmailCode) this.elements.inputEmailCode.value = "";
    }

    private switchView(view: 'selection' | 'qr' | 'email') {
        const { methodSelection, qrContent, emailContent } = this.elements;
        
        // Tout cacher d'abord
        [methodSelection, qrContent, emailContent].forEach(el => {
            el?.classList.add('hidden');
            el?.classList.remove('flex');
        });

        if (view === 'selection') {
            methodSelection?.classList.remove('hidden');
            methodSelection?.classList.add('flex');
        } else if (view === 'qr') {
            qrContent?.classList.remove('hidden');
            qrContent?.classList.add('flex');
        } else if (view === 'email') {
            emailContent?.classList.remove('hidden');
            emailContent?.classList.add('flex');
            this.prepareEmailView();
        }
    }

    private prepareEmailView() {
        // Récupérer l'email depuis le DOM (comme dans ton code original)
        const displayedEmail = document.querySelector('div[data-field="email"] .field-display')?.textContent;
        if (displayedEmail && this.elements.inputEmail) {
            this.elements.inputEmail.value = displayedEmail.trim();
            this.elements.inputEmail.disabled = true;
        }
        this.elements.codeVerifSection?.classList.remove('hidden');
        this.elements.codeVerifSection?.classList.add('flex');
        this.elements.sendCodeBtn?.classList.add('hidden');
    }

    private async initiateSetup(method: 'qr' | 'email') {
        if (!this.userId) return;
        const backendType = method === 'qr' ? 'APP' : 'EMAIL';

        try {
            const response = await fetchWithAuth(`api/auth/2fa/secret`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: backendType })
            });

            if (response.ok) {
                const result = await response.json();
                if (method === 'qr' && result.data?.qrCodeUrl) {
                    this.elements.qrImg.src = result.data.qrCodeUrl;
                    this.switchView('qr');
                } else if (method === 'email') {
                    this.switchView('email');
                }
            } else {
                // TRADUCTION
                alert(i18next.t('profilePage.alerts.2fa_init_error'));
            }
        } catch (error) {
            console.error(error);
        }
    }

    private async enable2fa(code: string, type: 'qr' | 'email') {
        if (!code || code.length < 6) {
            // TRADUCTION
            alert(i18next.t('profilePage.alerts.2fa_invalid_code'));
            return;
        }
        const backendType = type === 'qr' ? 'APP' : 'EMAIL';
        try {
            const response = await fetchWithAuth(`api/auth/2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, type: backendType })
            });
            if (response.ok) {
                this.is2faEnabled = true;
                localStorage.setItem('is2faEnabled', 'true');
                this.updateToggleButton();
                this.closeModal();
                // TRADUCTION
                alert(i18next.t('profilePage.alerts.2fa_enabled'));
            } else {
                const res = await response.json();
                // TRADUCTION fallback
                alert(res.message || i18next.t('profilePage.alerts.2fa_invalid_code'));
            }
        } catch (e) { console.error(e); }
    }

    private async disable2fa() {
        // TRADUCTION
        if (!confirm(i18next.t('profilePage.alerts.2fa_disable_confirm'))) return;
        try {
            const response = await fetchWithAuth(`api/auth/2fa`, { method: 'DELETE' });
            if (response.ok) {
                this.is2faEnabled = false;
                localStorage.setItem('is2faEnabled', 'false');
                this.updateToggleButton();
                // TRADUCTION
                alert(i18next.t('profilePage.alerts.2fa_disabled'));
            }
        } catch (e) { console.error(e); }
    }
}