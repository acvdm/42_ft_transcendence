let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

// fonction pour liberer la file d'attente avec le nouveau token
// cb = fonction de rappel, represente une des fonctions stockees dans le tableau
// cb(token) on appel la fonciton en lui donnat le token tout neuf, 
// la fonction lance fetch avec le nouveau token et debloque la promesse qui mettait la requete en pause
function onRefreshed(token: string) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

export function getAuthToken(): string | null {
    return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    
    let token = getAuthToken();

    // Prepare default headers
    const getConfigWithAuth = (tokenToUse: string | null, originalOptions: RequestInit) => {
        const headers = new Headers(originalOptions.headers || {});

        // Deleting old headers to avoid doubles
        if (headers.has('Authorization')) {
            headers.delete('Authorization');
        }
        if (!headers.has('Content-Type') && originalOptions.body) {
            headers.set('Content-Type', 'application/json');
        }
        if (tokenToUse) {
            headers.set('Authorization', `Bearer ${tokenToUse}`);
        }
        return {
            ...originalOptions,
            headers: headers
        };
    };

    // Initial try
    let response = await fetch(url, getConfigWithAuth(token, options));

    const userId = localStorage.getItem('userId');

    if (response.status === 404 && userId && url.includes(userId)) {
        console.warn("Cannot find user. Launching immediat deconnection");
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userStatus');
        sessionStorage.clear();

        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));

        return response;
    }
    // Expiration management with mutex
    if (response.status === 401) {
        console.warn(`401 detected for ${url}`);
        
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = (async () => {
                try {
                    const refreshRes = await fetch('/api/auth/token', { 
                        method: 'POST', 
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        } // enlever headers?
                    });
                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        console.log("Refresh successful, data:", data);

                        const newToken = data.accessToken;
                        if (!newToken) {
                            throw new Error("No accessToken in refresh response");
                        }

                        localStorage.setItem('accessToken', newToken);
                        onRefreshed(newToken);
                        return newToken;
                    } 
                    else
                    {
                        const errorText = await refreshRes.text();
                        console.error("Refresh failed:", errorText);
                        throw new Error(`Refresh failed:, ${refreshRes.status}`);
                    }
                } 
                catch (error) {
                    console.error("Refresh error:", error);
                    throw error;
                } finally {
                    isRefreshing = false;
                    refreshPromise = null;
                }
        })();

        try {
            const newToken = await refreshPromise;
            console.log("Refreshing original request with new token");
            return await fetch(url, getConfigWithAuth(newToken, options));
        }
        catch (error) {
            console.error("Refresh impossible. Deconnection");
            refreshSubscribers = [];
            console.error("Refresh impossible. Deconnection.");
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            window.history.pushState({}, '', '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
            throw error;
        }
        }
        else {
            console.log("Token expired. Waiting the refreshing of the other token...");
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh(async (newToken) => {

                    try {
                        const retryResponse = await fetch(url, getConfigWithAuth(newToken, options))
                        resolve(retryResponse);
                    }
                    catch (err) {
                        console.error(`Error retrying queud for ${url}:`, err);
                        reject(err);
                    }
                });

                // Security timeout
                setTimeout(() => {
                    reject(new Error(`Token refresh timeout`));
                }, 10000);
            });
        } 
    }
    return response;
}