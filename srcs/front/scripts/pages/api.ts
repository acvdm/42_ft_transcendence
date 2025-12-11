// srcs/front/scripts/api.ts

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('accessToken');

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

    // 3. Gestion de l'expiration
    if (response.status === 401) {
        console.warn("Token expired (401). Atempt to refresh...");

        try {
            // appel au refresh
            const refreshRes = await fetch('/api/auth/refresh', {method: 'POST'});

            if (refreshRes.ok) {
                const data = await refreshRes.json();
                const newToken = data.access_token;

                console.log("✅ Token refreshed with succeed !");

                // mise a jour du stockage
                localStorage.setItem('accessToken', newToken);

                // 4. Rejouer la requete initiale 
                response = await fetch(url, {
                    ...options,
                    headers: getHeaders(newToken) // on utilise le nouveau token
                }); 
            } else {
                console.error("Refresh impossible. Deconnection.");
                localStorage.removeItem('accessToken');
                localStorage.removeItem('userId');
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        } catch (err) {
            console.error("Network error during the refresh of the token", err);
        }
    }
    return response;
}