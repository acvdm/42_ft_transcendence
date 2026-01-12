import htmlContent from "../pages/RegisterPage.html"

export function render(): string {
	return htmlContent;
}

function handleRegister() {
	const button = document.getElementById('register-button');
	const errorElement = document.getElementById('error-message');

	if (!button) {
		console.error("Can't find register button in DOM");
		return;
	}

	button.addEventListener('click', async () => {
		const email = (document.getElementById('email-input') as HTMLInputElement).value;
		const password = (document.getElementById('password-input') as HTMLInputElement).value;
		const alias = (document.getElementById('alias-input') as HTMLInputElement).value;

		if (errorElement) {
			errorElement.classList.add('hidden');
			errorElement.textContent = '';
		}

		if (!alias || !password || !email) {
			if (errorElement) {
				errorElement.textContent = "Please fill all inputs";
				errorElement.classList.remove('hidden');
			}
			return ;
		}

		try {
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ alias, email, password })
            });

            const result = await response.json();

			if (response.ok)
			{
				sessionStorage.removeItem('isGuest');
   				sessionStorage.removeItem('userRole');

				const { accessToken, userId } = result;
				if (accessToken) {
					localStorage.setItem('accessToken', accessToken);
				}
				if (userId) {
					localStorage.setItem('userId', userId.toString());
				}

				if (userId) {
					try {
						const userRes = await fetch(`/api/user/${userId}`, {
							headers: { 'Authorization': `Bearer ${accessToken}` }
						});
						if (userRes.ok) {

							const userData = await userRes.json();
							if (userData.alias) {
								localStorage.setItem('username', userData.alias);
							}
							if (userData.status) {
								const statusSaved = userData.status === 'online' ? 'available' : userData.status;
								localStorage.setItem('userStatus', statusSaved);
							}
						}
					} catch (err) {
						console.error("Can't get user's profile", err);
					}
				}
				
				window.history.pushState({}, '', '/home');
				window.dispatchEvent(new PopStateEvent('popstate'));

            } else {
                console.error("Login error:", result.error.message);
				if (errorElement) {
					errorElement.textContent = result.error.message || "Authentication failed";
					errorElement.classList.remove('hidden');
				}
            }
        } catch (error) {
           console.error("Network error:", error);
			if (errorElement) {
				errorElement.textContent = "Network error, please try again REGISTER PAGE";
				errorElement.classList.remove('hidden');
			}
        }
	});
}

export function registerEvents() {
	handleRegister();
}