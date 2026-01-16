let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

function subscribeTokenRefresh(cb: (token: string) => void) {
	refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
	refreshSubscribers.forEach(cb => cb(token));
	refreshSubscribers = [];
}

export function getAuthToken(): string | null {
	return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
	
	let token = getAuthToken();

	const getConfigWithAuth = (tokenToUse: string | null, originalOptions: RequestInit) => {
		const headers = new Headers(originalOptions.headers || {});

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

	let response = await fetch(url, getConfigWithAuth(token, options));

	const userId = localStorage.getItem('userId');

	if (response.status === 404 && userId && url.includes(userId) && !url.includes('friendships')) {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('userId');
		localStorage.removeItem('username');
		localStorage.removeItem('userStatus');
		sessionStorage.clear();

		window.history.pushState({}, '', '/');
		window.dispatchEvent(new PopStateEvent('popstate'));

		return response;
	}

	if (response.status === 401) {
		console.warn(`401 detected for ${url}`);
		
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

						const newToken = data.accessToken;
						if (!newToken) {
							throw new Error("No accessToken in refresh response");
						}
    					console.log("Token changed?", getAuthToken() !== newToken);

						const isGuest = sessionStorage.getItem('isGuest') === 'true';

						if (isGuest)
						{
							sessionStorage.setItem('accessToken', newToken);
							console.log("Token stored in sessionStorage (Guest)")
						}
						else
						{
							localStorage.setItem('accessToken', newToken);
							console.log("Token stored in localStorage (User)")
						}

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

				setTimeout(() => {
					reject(new Error(`Token refresh timeout`));
				}, 10000);
			});
		} 
	}
	return response;
}