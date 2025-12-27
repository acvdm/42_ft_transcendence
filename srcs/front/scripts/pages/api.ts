// srcs/front/scripts/api.ts

// variable globale pour savoir si un refresh est en cours
let isRefreshing = false;
// creation dune liste vide, qui ne peut accepter que des fonctions en parametre et ces fonctions doivent accepter des token en parametre
let refreshSubscribers: ((token: string) => void)[] = [];

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
    const token = getAuthToken();

    // 1. Préparer les headers par défaut (fonction interne)
    const getHeaders = (currentToken: string | null) => {
        const headers = new Headers(options.headers || {});
        if (!headers.has('Content-Type') && options.body) {
            headers.set('Content-Type', 'application/json'); 
        }
        if (currentToken) {
            headers.set('Authorization', `Bearer ${currentToken}`);
        }
        return headers;
    };

    // 2. Tentative initiale
    let response = await fetch(url, {
        ...options,
        headers: getHeaders(token)
    });

    // 3. Gestion de l'expiration avec mutex
    if (response.status === 401) {
        
        if (!isRefreshing) {
            // PREMIER REFRESH
            isRefreshing = true;
            console.warn("Token expired (401). Atempt to refresh...");
            try {
                const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    const newToken = data.access_token;
                    localStorage.setItem('accessToken', newToken);
                    isRefreshing = false;
                    onRefreshed(newToken); // on previent tous les appels de foncitons qui attendaient
                    return await fetch(url, { ...options, headers: getHeaders(newToken)});
                } else {
                    // echec total du refresh -> logout pour tout le monde
                    isRefreshing = false;
                    refreshSubscribers = []; // on vide la file dattente
                    console.error("Refresh impossible. Deconnection.");
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('userId');
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    throw new Error("Session expired");
                }
            } catch (error) {
                isRefreshing = false;
                throw error;
            }
        }
        else {
            // requete qui suit ==> doit attendre
            console.log("Token expired. Waiting the refreshing of the other token...");
            // on cree une promesse qui ne se resoud que qund la premiere requete sera traitee
            return new Promise((resolve) => {
                subscribeTokenRefresh(async (newToken) => {
                    // le token est arrive, on rejoue la requete
                    resolve(await fetch(url, {...options, headers: getHeaders(newToken) }));
                });
            });
        } 
    }
    return response;
}