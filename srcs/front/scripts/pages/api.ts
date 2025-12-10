// srcs/front/scripts/api.ts

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('accessToken');

    // 1. Préparer les headers par défaut
    const headers = new Headers(options.headers || {});
    
    // 2. Ajouter le Content-Type JSON si on envoie des données et qu'il n'est pas déjà là
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    // 3. Injecter le token AUTOMATIQUEMENT
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // 4. Fusionner avec les options d'origine
    const config = {
        ...options,
        headers: headers
    };

    // 5. Exécuter la requête
    const response = await fetch(url, config);

    // (Optionnel) Gérer l'expiration de session globalement
    if (response.status === 401) {
        console.warn("Session expirée, redirection...");
        // Tu peux rediriger vers le login ici si tu veux
        // window.location.href = '/login';
    }

    return response;
}