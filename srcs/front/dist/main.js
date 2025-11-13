"use strict";
(() => {
  // scripts/pages/LoginPage.ts
  function LoginPage() {
    return `
	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;"></div
		<!-- Main div -->
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
			<div class="border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm bg-white w-80 p-4 shadow-sm">
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
  }
  function loginEvents() {
    const button = document.getElementById("login-button");
    button?.addEventListener("click", () => {
      const email = document.getElementById("email-input").value;
      const password = document.getElementById("password-input").value;
      console.log("Tentative de connexion avec :", email, password);
    });
  }

  // scripts/pages/HomePage.ts
  function HomePage() {
    return `
    <div class="relative w-full h-[calc(100vh-50px)] overflow-hidden bg-gradient-to-b from-white via-white to-[#7ED5F4]">

        <div class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat" 
             style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;">
        </div>

        <div class="absolute top-[20px] bottom-0 left-0 right-0 flex justify-center p-6 overflow-y-auto">

            <div class="flex flex-row min-w-[1000px] h-full gap-4">

                <div class="w-[1300px] h-full bg-gradient-to-b from-blue-50 to-blue-100 border border-gray-300 shadow-inner rounded-sm flex items-center justify-center min-w-[650px]">
                    <h1 class="text-lg font-semibold"> Pong \u{1F47E}</h1>
                </div>

                <div class="flex flex-col gap-4 w-[600px] h-full">
                    
                    <div class="bg-white border border-gray-300 rounded-sm shadow-sm w-full p-4 flex flex-col">
                        <p class="font-semibold mb-2"> Game info</p>
                        <div class="relative w-[50px] h-[50px] mb-4">
                            <img class="absolute inset-0 w-full h-full object-cover" src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">
                            <img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px] object-cover" src="https://wlm.vercel.app/assets/usertiles/default.png">
                        </div>
                        <button id="play-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 focus:ring-1 focus:ring-blue-400">Play</button>
                    </div>

                    <div class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 overflow-hidden">
                        <h1 class="text-lg font-bold mb-2">Live chat </h1>
                        <div class="flex-1 overflow-y-auto border-t border-gray-200 pt-2 space-y-2 text-sm">
                            <p><strong>Faustoche01:</strong> coucou</p>
                            <p><strong>Faustoche03:</strong> salu sa va</p>
                        </div>
                        <input type="text" placeholder="\xC9crire un message..." class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    </div>
                </div>
            </div>
        </div>
    </div>
	`;
  }

  // scripts/pages/ProfilePage.ts
  function ProfilPage() {
    return `
		<div class="p-8">
			<h1 class="text-4xl font-bold text-green-400 mb-4">
				My profil \u{1F47A}
			</h1>
			<p class="text-lg text-gray-300">
				Infos perso, addresse mail, statistiques? amis
			</p>
			</div>
	`;
  }

  // scripts/pages/NotFound.ts
  function NotFoundPage() {
    return `
		<div class="p-8 text-center">
			<h1 class="text-6xl font-bold text-red-500 mb-4">
				Not found, try again
			</h1>
			<p class="text-2xl text-gray-300">
				404 not found that's it
			</p>
			<a href="/" class="mt-4 inline-block text-blue-400 hover:underline">
				Go back to the main page
			</a>
			</div>
	`;
  }

  // scripts/main.ts
  var appElement = document.getElementById("app");
  var routes = {
    "/": {
      render: HomePage,
      afterRender: () => console.log("HomePage charg\xE9e")
    },
    "/profile": {
      render: ProfilPage,
      afterRender: () => console.log("Profil page charg\xE9e -> modifications de la page de profil, photo etc")
    },
    "/logout": {
      render: LoginPage,
      afterRender: loginEvents
    },
    "/404": {
      render: NotFoundPage
    }
  };
  var handleLocationChange = () => {
    if (!appElement) return;
    const path = window.location.pathname;
    const page = routes[path] || routes["/404"];
    appElement.innerHTML = page.render();
    if (page.afterRender) {
      page.afterRender();
    }
  };
  var navigate = (event) => {
    event.preventDefault();
    const target = event.target;
    if (target.href == window.location.href)
      return;
    window.history.pushState({}, "", target.href);
    handleLocationChange();
  };
  window.addEventListener("click", (event) => {
    const target = event.target;
    const anchor = target.closest("a");
    if (anchor && anchor.href.startsWith(window.location.origin)) {
      navigate(event);
    }
  });
  window.addEventListener("popstate", () => {
    handleLocationChange();
  });
  document.addEventListener("DOMContentLoaded", () => {
    handleLocationChange();
  });
})();
