// srcs/front/scripts/api.ts

// gestion asynchrone 

// variable globale pour savoir si un refresh est en cours
let isRefreshing = false;
// creation dune liste vide, qui ne peut accepter que des fonctions en parametre et ces fonctions doivent accepter des token en parametre
let refreshSubscribers: ((token: string) => void)[] = [];
let refreshPromise: Promise<string> | null = null;

// fonction pour ajouter une requete a la file d'attente
function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

// fonction pour liberer la file d'attente avec le nouveau token
// cb = fonction de rappel, represente une des fonctions stockees dans le tableau
// cb(token) on appel la fonciton en lui donnat le token tout neuf, 
// la fonction lance fetch avec le nouveau token et debloque la promesse qui mettait la requete en pause
function onRefreshed(token: string){
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

export function getAuthToken(): string | null {
    return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}


export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    let token = getAuthToken();

    // 1. Préparer les headers par défaut (fonction interne)
    //on force l'ecrasement du header Auth
    const getConfigWithAuth = (tokenToUse: string | null, originalOptions: RequestInit) => {
        const headers = new Headers(originalOptions.headers || {});

        // on supprime explicitement tout ancien headers Authorizationpour eviterles doublons/conflits
        if (headers.has('Authorization'))
            headers.delete('Authorization');

        if (!headers.has('Content-Type') && originalOptions.body)
            headers.set('Content-Type', 'application/json');

        if (tokenToUse) {
            headers.set('Authorization', `Bearer ${tokenToUse}`);
        }
        return {
            ...originalOptions,
            headers: headers // remplace/ajoute headers aux parametresdeoriginalOptions (method,body,....)
        };
    };

    // 2. Tentative initiale
    let response = await fetch(url, getConfigWithAuth(token, options));

    // 3. Gestion de l'expiration avec mutex
    if (response.status === 401) {
        console.warn(`401 detected fo ${url}`);
        
        if (!isRefreshing) {

            isRefreshing = true;

            refreshPromise = (async () => {
                try {
                    const refreshRes = await fetch('/api/auth/token', { 
                        method: 'POST', 
                        credentials: 'include' 
                    });
                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        console.log("Refresh successful, data:", data);

                        const newToken = data.accessToken;
                        if (!newToken)
                            throw new Error("No accessToken in refresh response");

                        localStorage.setItem('accessToken', newToken);

                        onRefreshed(newToken); // on previent tous les appels de foncitons qui attendaient

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
            // isRefreshing = false;
            refreshSubscribers = []; // on vide la file dattente
            console.error("Refresh impossible. Deconnection.");
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            window.history.pushState({}, '', '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
            throw error;
        }
        }
        else {
            // Mise en file d'attente de la requete 
            console.log("Token expired. Waiting the refreshing of the other token...");
            // on cree une promesse qui ne se resoud que qund la premiere requete sera traitee
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh(async (newToken) => {
                    try { // tant que la promesse du precedent appel n'estpasresoluon attent
                        // le token est arrive, on rejoue la requete
                        // fetch de rejeu de la fonction suivante (stockeedans un tableau)
                        const retryResponse = await fetch(url, getConfigWithAuth(newToken, options))
                        resolve(retryResponse);
                    }
                    catch (err) {
                        console.error(`Error retrying queud for ${url}:`, err);
                        reject(err);
                    }
                });

                // timeout de securite
                setTimeout(() => {
                    reject(new Error(`Token refresh timeout`));
                }, 10000);
            });
        } 
    }
    return response;
}