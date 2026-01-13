import htmlContent from "../pages/LoginPage.html";
import { fetchWithAuth } from "../services/api";
import { updateUserStatus } from "../components/Data";
import { changeLanguage } from "../i18n";
import i18next from "../i18n";

export function render(): string {
    let html = htmlContent;

    html = html.replace(/\{\{loginPage\.welcome\}\}/g, i18next.t('loginPage.welcome'));
    html = html.replace(/\{\{loginPage\.password\}\}/g, i18next.t('loginPage.password'));
    html = html.replace(/\{\{loginPage\.connect_as\}\}/g, i18next.t('loginPage.connect_as'));
    html = html.replace(/\{\{loginPage\.status\.available\}\}/g, i18next.t('loginPage.status.available'));
    html = html.replace(/\{\{loginPage\.status\.busy\}\}/g, i18next.t('loginPage.status.busy'));
    html = html.replace(/\{\{loginPage\.status\.away\}\}/g, i18next.t('loginPage.status.away'));
    html = html.replace(/\{\{loginPage\.status\.offline\}\}/g, i18next.t('loginPage.status.offline'));
    html = html.replace(/\{\{loginPage\.login-button\}\}/g, i18next.t('loginPage.login_button'));
    html = html.replace(/\{\{loginPage\.back\}\}/g, i18next.t('loginPage.back'));
    html = html.replace(/\{\{loginPage\.2fa\}\}/g, i18next.t('loginPage.2fa'));
    html = html.replace(/\{\{loginPage\.security\}\}/g, i18next.t('loginPage.security'));
    html = html.replace(/\{\{loginPage\.enter_code\}\}/g, i18next.t('loginPage.enter_code'));
    html = html.replace(/\{\{loginPage\.verify_button\}\}/g, i18next.t('loginPage.verify_button'));

    return html;
}
//================================================
//================ LOGIN WITH 2FA ================
//================================================

async function init2faLogin(accessToken: string, userId: number, selectedStatus: string) {
    
    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
    }
    if (userId) {
        localStorage.setItem('userId', userId.toString());
    }

    // Getting back user profil
    if (userId && accessToken) {
        try {
            const userRes = await fetch(`/api/user/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.alias)
                    localStorage.setItem('username', userData.alias);
                if (userData.theme)
                    localStorage.setItem('userTheme', userData.theme);
            }
        } catch (err) {
            console.error("Can't get user's profile", err);
        }

        // Updating status
        try {
            await fetch(`/api/user/${userId}/status`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status: selectedStatus })
            });
        } catch (err) {
            console.error("Failed to update status on login", err);
        }
    }

    localStorage.setItem('userStatus', selectedStatus);
    window.history.pushState({}, '', '/home');
    window.dispatchEvent(new PopStateEvent('popstate'));
}


//================================================
//=============== LOGIN CONNECTION ===============
//================================================

function handleLogin() {

    const button = document.getElementById('login-button');
    const errorElement = document.getElementById('error-message');
    const modal2fa = document.getElementById('2fa-modal');
    const input2fa = document.getElementById('2fa-input-code') as HTMLInputElement;
    const confirm2fa = document.getElementById('confirm-2fa-button');
    const close2fa = document.getElementById('close-2fa-modal');
    const error2fa = document.getElementById('2fa-error-message');
    const backButton = document.getElementById('back-button');

    let tempToken: string | null = null;
    let cachedStatus = 'available';

    backButton?.addEventListener('click', () => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
    });

    button?.addEventListener('click', async () => {
        const email = (document.getElementById('email-input') as HTMLInputElement).value;
        const password = (document.getElementById('password-input') as HTMLInputElement).value;
        const selectedStatus = (document.getElementById('status-input') as HTMLSelectElement).value;

        if (errorElement) {
            errorElement.classList.add('hidden');
            errorElement.textContent = '';
        }

        if (!email || !password) {
            if (errorElement) {
                errorElement.textContent = "Please fill all inputs";
                errorElement.classList.remove('hidden');
            }
            return;
        }

        // Authentication
        try {
            const response = await fetch('/api/auth/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            // 1st case: 2fa is required
            if (result.require2fa) {
                localStorage.setItem('is2faEnabled', 'true');
                tempToken = result.tempToken;

                if (modal2fa) {
                    modal2fa.classList.remove('hidden');
                    modal2fa.classList.add('flex');
                    input2fa.value = '';
                    input2fa.focus();
                }
                return;
            }


            if (result.success) {
                localStorage.setItem('is2faEnabled', 'false');
				const { accessToken, userId } = result.data;
                await init2faLogin(accessToken, userId, cachedStatus);

                // Tokens and infos storage
                if (accessToken) {
                    localStorage.setItem('accessToken', accessToken);
                }
                if (userId) {
                    localStorage.setItem('userId', userId.toString());
                }
                if (userId && accessToken) {
                    try {

                        const userRes = await fetchWithAuth(`/api/user/${userId}`, {
                            method: 'GET'
                        });

                        if (userRes.ok) {
                            const userData = await userRes.json();
                            if (userData.alias) {
                                localStorage.setItem('username', userData.alias);
                            }
                            if (userData.theme) {
                                localStorage.setItem('userTheme', userData.theme);
                            }
                        }
                    } catch (err) {
                        console.error("Can't get user's profile", err);
                    }

                    try {
                        await fetchWithAuth(`/api/user/${userId}/status`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: selectedStatus })
                        });
                        console.log("Status updated to database:", selectedStatus);
                    } catch (err) {
                        console.error("Failed to update status on login", err);
                    }
                }

                localStorage.setItem('userStatus', selectedStatus);
                window.history.pushState({}, '', '/home');
                window.dispatchEvent(new PopStateEvent('popstate'));

            } else {
                console.error("Login error:", result.error);
                if (errorElement) {
                    errorElement.textContent = result.error?.message || result.error.error || "Authentication failed";
                    errorElement.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error("Network error:", error);
            if (errorElement) {
                errorElement.textContent = "Network error, please try again";
                errorElement.classList.remove('hidden');
            }
        }
    });


    confirm2fa?.addEventListener('click', async () => {

        const code = input2fa.value.trim();

        if (error2fa) {
            error2fa.classList.add('hidden');
        }

        if (!code || !tempToken) {
            return;
        }

        try {
            const response = await fetch('/api/auth/2fa/challenge', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ code })
            });

            const result = await response.json();

            // If 2fa worked, we generate real tokens
            if (response.ok && result.success) {
                localStorage.setItem('is2faEnabled', 'true');
                const { accessToken, userId } = result;

                if (modal2fa) {
                    modal2fa.classList.add('hidden');
                }
            
                await updateUserStatus('online');
                await init2faLogin(accessToken, userId, cachedStatus);
            } else {
                if (error2fa) {
                    error2fa.textContent = "Invalid code.";
                    error2fa.classList.remove('hidden');
                    console.error("2FA Error:", result.error.message);
                }
            }
        } catch (error) {
            if (error2fa) {
                error2fa.textContent = "Error during verification.";
                error2fa.classList.remove('hidden');
            }
        }
    });

    const closeFunc = () => {
        if (modal2fa) {
            modal2fa.classList.add('hidden');
            modal2fa.classList.remove('flex');
            tempToken = null;
        }
    };

    close2fa?.addEventListener('click', closeFunc);
    modal2fa?.addEventListener('click', (e) => {
        if (e.target === modal2fa) closeFunc();
    });
}

export function loginEvents() {
    handleLogin();

    //================================================
    //=============== LANGUAGE MANAGER ===============
    //================================================

    const toggleBtn = document.getElementById('page-lang-toggle-btn');
    const menuContent = document.getElementById('page-lang-menu-content');
    
    if (toggleBtn && menuContent) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuContent.classList.toggle('hidden');
        });
        window.addEventListener('click', () => {
            if (!menuContent.classList.contains('hidden')) menuContent.classList.add('hidden');
        });
    }
    
    document.querySelectorAll('.page-lang-select').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const target = e.currentTarget as HTMLElement;
            const lang = target.getAttribute('data-lang');
            if (lang) {
                await changeLanguage(lang);
                const display = document.getElementById('page-current-lang-display');
                if (display) display.textContent = lang.toUpperCase();
            }
        });
    });
}