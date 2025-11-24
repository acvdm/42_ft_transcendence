import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";

export function LandingPage(): string {
	return `

	<link rel="stylesheet" href="https://unpkg.com/7.css">
	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;"></div>
	<div class="flex flex-col justify-center items-center gap-6 mt-[-50px]">
		<!-- Picture div -->
		<div class="relative w-[170px] h-[170px] mb-4">
			<!-- le cadre -->
			<img class="absolute inset-0 w-full h-full object-cover" src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">
			<!-- l'image -->
			<img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover" src="https://wlm.vercel.app/assets/usertiles/default.png">
		</div>
		<h1 class="font-sans text-xl font-normal text-blue-950">
			Sign in to Transcendence
		</h1>
		<!-- Login div -->
		<div class="flex flex-col justify-center items-center gap-6">
			<!-- Bouton de connexion/Register/Guest -->
			<button id="login-button">Login</button>
	 		<button id="register-button">Register</button>
 			<button id="guest-button">Play as guest</button>
	</div>
	</div>

	
	`;
};

export function initLandingPage() {
	const loginButton = document.getElementById('login-button');
	const registerButton = document.getElementById('register-button');
	const guestButton = document.getElementById('guest-button');

	const handleNavigation = (path: string) => {
		window.history.pushState({}, '', path);
		window.dispatchEvent(new PopStateEvent('popstate'));
	};

	loginButton?.addEventListener('click', () => {
		handleNavigation('/login');
	});

	registerButton?.addEventListener('click', () => {
		handleNavigation('/register');
	});
    
    // Ajout de la navigation pour le bouton "Play as guest" vers la page home
    guestButton?.addEventListener('click', () => {
		handleNavigation('/home');
	});
}

