import htmlContent from "./LoginPage.html";
import { fetchWithAuth } from "./api";
import { updateUserStatus } from "../components/Data";

export function render(): string {
	return htmlContent;
};

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
}