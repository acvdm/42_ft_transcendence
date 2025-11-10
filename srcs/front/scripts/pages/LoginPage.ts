// on va exportrter une fonction qui renvoie du html 
export function LoginPage(): string {
	return `
	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;"></div
		<!-- Main div -->
	<div class="flex flex-col justify-center items-center bg-gray-100 gap-6 mt-[-50px]">
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
		<div class="flex flex-col justify-center items-center bg-gray-100 gap-6">
			<div class="border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 bg-white w-80 p-4 shadow-sm">
				<!-- Email -->
				<input type="email" placeholder="Example555@hotmail.com" id="email-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
		
				<!-- Mot de passe -->
				<input type="password" placeholder="Enter your password" id="password-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>

				<!-- Status -> disponible, busy, not displayed -->
				<div class="flex items-center justify-between mb-3 text-sm">
					<div class="flex items-center gap-1 mb-3">
						<span> Sign in as:</span>
						<div class="flex items-center gap-1">
							<span class="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
							<select class="bg-transparent focus:outline-none text-sm" id="status-input">
								<option>Available</option>
								<option>Busy</option>
								<option>Away</option>
								<option>Appear offline</option>
							</select>
						</div>
					</div>
				</div>
			</div>
			<!-- Bouton de connexion/Register/Guest -->
			<div class="flex flex-col gap-2 w-48">
				<button id="login-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Login</button>
				<button id="register-button"class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Register</button>
				<button id="guest-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Play as guest</button>
			</div>
	</div>
	</div>
	`;
};