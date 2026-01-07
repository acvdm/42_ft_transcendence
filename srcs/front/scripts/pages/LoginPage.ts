import htmlContent from "./LoginPage.html";
import { fetchWithAuth } from "./api";
import { updateUserStatus } from "../components/Data";

export function render(): string {
	return htmlContent;
};


async function init2faLogin(accessToken: string, userId: number, selectedStatus: string) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (userId) localStorage.setItem('userId', userId.toString());

    // on recupere le profil
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

        // on met a jour le status 
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


function handleLogin() {
    console.log("handleLogin");
    const button = document.getElementById('login-button');
    const errorElement = document.getElementById('error-message');

    // les elements du 2fa
    const modal2fa = document.getElementById('2fa-modal');
    const input2fa = document.getElementById('2fa-input-code') as HTMLInputElement;
    const confirm2fa = document.getElementById('confirm-2fa-button');
    const close2fa = document.getElementById('close-2fa-modal');
    const error2fa = document.getElementById('2fa-error-message');

    let tempToken: string | null = null;
    let cachedStatus = 'available';


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

        try {
            // Authentification
            const response = await fetch('/api/auth/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            // cas 1: 2fa required
            if (result.require2fa) {
                console.log("2FA require");
                localStorage.setItem('is2faEnabled', 'true');
                tempToken = result.tempToken;
                if (modal2fa) {
                    modal2fa.classList.remove('hidden');
                    modal2fa.classList.add('flex');
                    input2fa.value = '';
                    input2fa.focus();
                }
                return; // attente de validation du code
            }


            if (result.success) {
                localStorage.setItem('is2faEnabled', 'false');
				const { accessToken, userId } = result.data;
                await init2faLogin(accessToken, userId, cachedStatus);

                // Stockage des tokens
                if (accessToken) localStorage.setItem('accessToken', accessToken);
                if (userId) localStorage.setItem('userId', userId.toString());

                // Récupération du profil (Username) (on verrifie qu'on a bien un access token)
                if (userId && accessToken) {
                    try {

                        const userRes = await fetchWithAuth(`/api/user/${userId}`, {
                            method: 'GET'
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

                    try {
                        await fetchWithAuth(`/api/user/${userId}/status`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: selectedStatus })
                        });
                        console.log("Status updated to DB:", selectedStatus);
                    } catch (err) {
                        console.error("Failed to update status on login", err);
                    }
                }

                localStorage.setItem('userStatus', selectedStatus);
                window.history.pushState({}, '', '/home');
                window.dispatchEvent(new PopStateEvent('popstate'));

            } else {
                // Gestion d'erreur login
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

        if (error2fa) error2fa.classList.add('hidden');

        if (!code || !tempToken) return;

        try {
            // ici pas de fetch with auth car token temporaire
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ code })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // reussite du 2fa -> rvraim tokens
                localStorage.setItem('is2faEnabled', 'true');
                const { accessToken, userId } = result; // structure de retour de verify
                
                // fermeutr modale
                if (modal2fa) modal2fa.classList.add('hidden');
            
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
            tempToken = null; // reset du toekn
        }
    };

    close2fa?.addEventListener('click', closeFunc);
    modal2fa?.addEventListener('click', (e) => {
        if (e.target === modal2fa) closeFunc();
    });
}

export function loginEvents() {
    handleLogin();
}