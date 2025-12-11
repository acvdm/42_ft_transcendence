"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // scripts/pages/LoginPage.html
  var LoginPage_default = `	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;"></div>
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
							<select id="status-input" class="bg-transparent focus:outline-none text-sm">
								<option value="available">Available</option>
								<option value="busy">Busy</option>
								<option value="away">Away</option>
								<option value="offline">Appear offline</option>
							</select>
						</div>
					</div>
				</div>
				<div class="flex flex-col items-center justify-center">
					<p id="error-message" class="text-red-600 text-sm mb-2 hidden"></p>
				</div>
			</div>
			<!-- Bouton de connexion/Register/Guest -->
			<div class="flex flex-col gap-2 w-48">
				<button id="login-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Login</button>
			</div>
	</div>
	</div>`;

  // scripts/pages/LoginPage.ts
  function render() {
    return LoginPage_default;
  }
  function handleLogin() {
    const button = document.getElementById("login-button");
    const errorElement = document.getElementById("error-message");
    button?.addEventListener("click", async () => {
      const email = document.getElementById("email-input").value;
      const password = document.getElementById("password-input").value;
      const selectedStatus = document.getElementById("status-input").value;
      if (errorElement) {
        errorElement.classList.add("hidden");
        errorElement.textContent = "";
      }
      if (!email || !password) {
        if (errorElement) {
          errorElement.textContent = "Please fill all inputs";
          errorElement.classList.remove("hidden");
        }
        return;
      }
      try {
        const response = await fetch("/api/auth/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
          // Note: Pas besoin d'envoyer le status ici si ton back-end login ne le gère pas
          // On le gère juste après avec le PATCH
        });
        const result = await response.json();
        if (result.success) {
          const { access_token, user_id } = result.data;
          if (access_token) localStorage.setItem("accessToken", access_token);
          if (user_id) localStorage.setItem("userId", user_id.toString());
          if (user_id && access_token) {
            try {
              const userRes = await fetch(`/api/users/${user_id}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${access_token}`
                }
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.alias) {
                  localStorage.setItem("username", userData.alias);
                }
              }
            } catch (err) {
              console.error("Can't get user's profile", err);
            }
            try {
              await fetch(`/api/users/${user_id}/status`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  // Ajout du token
                  "Authorization": `Bearer ${access_token}`
                },
                body: JSON.stringify({ status: selectedStatus })
              });
              console.log("Status updated to DB:", selectedStatus);
            } catch (err) {
              console.error("Failed to update status on login", err);
            }
          }
          localStorage.setItem("userStatus", selectedStatus);
          window.history.pushState({}, "", "/home");
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else {
          console.error("Login error:", result.error);
          if (errorElement) {
            errorElement.textContent = result.error.errorMessage || result.error.error || "Authentication failed";
            errorElement.classList.remove("hidden");
          }
        }
      } catch (error) {
        console.error("Network error:", error);
        if (errorElement) {
          errorElement.textContent = "Network error, please try again";
          errorElement.classList.remove("hidden");
        }
      }
    });
  }
  function loginEvents() {
    handleLogin();
  }

  // scripts/pages/HomePage.html
  var HomePage_default = `<div id="wizz-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden bg-gradient-to-b from-white via-white to-[#7ED5F4]">

	<div class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"
		 style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;">
	</div>

	<div class="absolute top-[20px] bottom-0 left-0 right-0 flex flex-col px-10 py-2 gap-2" style="padding-left: 100px; padding-right: 100px; bottom: 100px;">
		
		<!-- Container avec left et right qui prennent toute la hauteur restante -->
		<div class="flex gap-6 flex-1 min-h-0" style="gap:80px;">

			<!-- ========= LEFT WINDOW ========= -->
			<div class="window w-[700px] min-w-[700px] flex flex-col">
				<div class="title-bar">
					<div class="title-bar-text">Games</div>
					<div class="title-bar-controls">
						<button aria-label="Minimize"></button>
						<button aria-label="Maximize"></button>
						<button aria-label="Close"></button>
					</div>
				</div>

				<div id="left" class="window-body flex flex-col h-full w-[700px] min-w-[700px] shrink-0 bg-white border border-gray-300 shadow-inner rounded-sm" style="width: 700px; min-width: 700px">
					<div class="flex flex-row w-full h-[160px] rounded-sm p-2 flex-shrink-0 border-b border-gray-300"> 
						<!-- Cadre du profil -->
						<div class="flex flex-row w-full h-[160px] bg-transparent rounded-sm p-2 flex-shrink-0" style="height: 125px; flex-shrink: 0;">
							<div class="relative w-[110px] h-[110px] flex-shrink-0">
								<!-- l'image (profil principal) -->
								<img id="user-profile" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75px] h-[75px] object-cover"
									style="height: 70px; width:70px;" src="/assets/profile/Rubber_Ducky.png" alt="User avatar">
								<!-- le cadre -->
								<img id="user-status" class="absolute inset-0 w-full h-full object-cover" src="/assets/basic/status_away_small.png" alt="Status frame">
							</div>
	
							<!-- username, bio et status -->
							<div class="flex flex-col justify-center pl-4 flex-1">
								<div class="flex items-center gap-2 mb-1">
									<p class="text-xl font-semibold" id="user-name">Username</p>
	
									<!-- selection du status = dynamique -->
									<div class="relative">
										<button id="status-selector" class="flex items-center gap-1 px-2 py-1 text-sm rounded-sm hover:bg-gray-200">
											<span id="current-status-text">(Available)</span>
											<img src="/assets/chat/arrow.png" alt="Arrow" class="w-3 h-3">
										</button>
	
										<!-- Menu dropdown pour le status -->
										<div id="status-dropdown" class="absolute hidden top-full left-0 mt-1 w-70 bg-white border border-gray-300 rounded-md shadow-xl z-50">
											<button class="status-option w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" data-status="available">
												<span class="w-2 h-2 rounded-full"></span>
												<span>Available</span>
											</button>
											<button class="status-option w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" data-status="busy">
												<span class="w-2 h-2 rounded-full"></span>
												<span>Busy</span>
											</button>
											<button class="status-option w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" data-status="away">
												<span class="w-2 h-2 rounded-full"></span>
												<span>Away</span>
											</button>
											<button class="status-option w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2" data-status="invisible">
												<span class="w-2 h-2 rounded-full"></span>
												<span>Offline</span>
											</button>
										</div>
									</div>
								</div>
								<div id="bio-wrapper">
									<p id="user-bio" class="text-sm text-gray-600 italic cursor-text">Share a quick message</p>
									<span class="char-count hidden text-xs text-gray-500 self-center">0/70</span>
								</div>
							</div>
	
							<!-- Notifications /// a mettre en hidden -> ne s'affiche que quand on a une notification!-->
							<div class="ml-auto flex items-start relative">
								<button id="notification-button" class="relative w-10 h-10 cursor-pointer">
									<img id="notification-icon" 
										src="/assets/basic/no_notification.png" 
										alt="Notifications" 
										class="w-full h-full object-contain">
										<div id="notification-badge" class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full hidden border border-white"></div>
								</button>
								<div id="notification-dropdown" class="absolute hidden top-full right-0 mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-xl z-50 overflow-hidden">
									<div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
										<h3 class="font-semibold text-sm text-gray-700">Notifications</h3>
									</div>
									<div id="notification-list" class="flex flex-col max-h-64 overflow-y-auto">
										<div class="p-4 text-center text-xs text-gray-500">No notification</div>
									</div> <!--fin du listing inside dropdown-->
								</div> <!--fin du div dropdown-->
							</div>
						</div>

					</div>	<!--FIn du premier cadre-->		
					<div class="bg-white p-4 flex flex-col items-center justify-center gap-2">
						<h1 class="text-lg font-semibold mb-2">Wanna play? \u{1F47E}</h1>

						<button id="local-game" 
							class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
								px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
								active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
							LOCAL
						</button>

						<button id="remote-game" 
							class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
								px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
								active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
							REMOTE
						</button>

						<button id="tournament-game" 
							class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
								px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
								active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
							TOURNAMENT
						</button>
					</div>	<!--FIn du second cadre-->	
				</div>
			</div>


			<!-- ========= RIGHT WINDOW ========= -->
			<div class="window flex flex-col flex-1 min-w-0">
				<div class="title-bar">
					<div class="title-bar-text">Messenger</div>
					<div class="title-bar-controls">
						<button aria-label="Minimize"></button>
						<button aria-label="Maximize"></button>
						<button aria-label="Close"></button>
					</div>
				</div>

				<div id="right" class="window-body flex flex-row gap-4 flex-1 min-w-0">

					<div id="chat-frame" class="relative flex-1 p-10 bg-gradient-to-b from-blue-50 to-gray-400 rounded-sm flex flex-row items-end bg-cover bg-center transition-all duration-300 min-h-0">

						<div id="friend-list" class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 w-[350px] min-w-[350px] relative z-10 min-h-0 h-full"  style="width:350px; min-width: 350px;">
							<div class="flex flex-row items-center justify-between">
								<p class="text-xl text-black font-semibold text-center tracking-wide mb-3 select-none">MY FRIENDS</p>
								
								<div class="ml-auto flex items-center mb-3 relative">
									<button id="add-friend-button" class="relative w-9 h-9 cursor-pointer">
										<img id="add-friend-icon" 
											src="/assets/basic/1441.png" 
											alt="Friends button" 
											class="w-full h-full object-contain">
									</button>
									<div id="add-friend-dropdown" class="absolute hidden top-full right-0 mt-2 w-72 bg-white border border-gray-300 rounded-md shadow-xl z-50 p-4">
										<p class="text-sm font-semibold mb-2 text-center">Add a friend</p>
										<input type="text" 
											id="friend-search-input" 
											placeholder="Type in username or email" 
											class="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3">
										<div class="flex gap-2">
											<button id="send-friend-request" 
												class="flex-1 bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1.5 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400">
												Send request
											</button>
											<button id="cancel-friend-request" 
												class="flex-1 bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400  rounded-sm px-3 py-1.5 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400">
												Cancel
											</button>
										</div>
										<div id="friend-request-message" class="mt-2 text-xs hidden"></div>
									</div>
								</div>
							</div>

							<div class="flex flex-col gap-3 overflow-y-auto pr-1 select-none border-t border-gray-500" style="padding-top: 13px;">

								<details open class="group">
									<summary class="flex items-center gap-2 cursor-pointer font-semibold text-sm py-1 hover:text-blue-600">
										\u2B50 Contacts
									</summary>

									<div id="contacts-list" class="mt-2 ml-4 flex flex-col gap-2">
										</div>
								</details>

								<details class="group">
									<summary class="flex items-center gap-2 cursor-pointer font-semibold text-sm py-1 hover:text-blue-600">
										\u{1F4C1} Groups
									</summary>

									<div class="mt-2 ml-4 flex flex-col gap-2">
										<div class="text-xs text-gray-600 ml-1">les bogoce</div>
										<div class="text-xs text-gray-600 ml-1">les cheums</div>
									</div>
								</details>
							</div>
						</div>

						<div id="chat-placeholder" class="flex flex-col items-center justify-center flex-1 h-full relative z-10 bg-white border border-gray-300 rounded-sm shadow-sm">
							<img src="/assets/basic/messenger_logo.png" alt="" class="w-24 h-24 opacity-20 grayscale mb-4">
							<p class="text-gray-400 text-lg font-semibold">Select a friend to start chatting</p>
						</div>

						<div id="channel-chat" class="hidden flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 relative z-10 min-h-0 h-full">
							
							<div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-2 relative">
								<div class="flex gap-4 items-center">
									<div class="relative w-[80px] h-[80px] flex-shrink-0">
										<!-- l'image (profil principal) -->
										<img id="chat-header-avatar" 
											class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50px] h-[50px] object-cover"
											src="" 
											alt="User avatar">
										<!-- le cadre -->
										<img id="chat-header-status" 
											class="absolute inset-0 w-full h-full object-contain" 
											src="/assets/basic/status_online_small.png" 
											alt="Status frame">
									</div>
									<div class="flex flex-col justify-start leading-tight">
										<p id="chat-header-username" class="font-bold text-lg leading-none text-gray-800"></p>
										<p id="chat-header-bio" class="text-xs text-gray-500 italic"></p>
									</div>
								</div>
								
								<div class="relative self-start mt-2">
									<button id="chat-options-button" class="p-1 hover:bg-gray-100 rounded-full transition duration-200 cursor-pointer">
										<img src="/assets/chat/meatball.png"
											 alt="options"
											 class="w-6 h-6 object-contain"
											 style="width: 24px; height: 24px; display: block;">
									</button>



									<div id="chat-options-dropdown" class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 hidden overflow-hidden">
										<button id="button-view-profile" class="w-full text-left px-4 py-2 hover: bg-blue-50 text-sm text-gray-700 transition">
											View my friend's profile
										</button>
										<button id="button-invite-game" class="w-full text-left px-4 py-2 hover: bg-blue-50 text-sm text-gray-700 transition">
											Invite to play
										</button>
										<button id="button-report-user" class="w-full text-left px-4 py-2 hover: bg-blue-50 text-sm text-gray-700 transition">
											Report user
										</button>
										<button id="button-block-user" class="w-full text-left px-4 py-2 hover: bg-blue-50 text-sm text-gray-700 transition">
											Report user
										</button>
									</div>

								</div> <!-- fin de la div menu ...-->


							</div>



							<div id="chat-messages" class="flex-1 h-0 overflow-y-auto min-h-0 pt-2 space-y-2 text-sm"></div>

							<div class="flex flex-col">
								<input type="text" id="chat-input" placeholder="\xC9crire un message..." class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">

								<div class="flex border-x border-b rounded-b-[4px] border-[#bdd5df] items-center pl-1" style="background-image: url(&quot;/assets/chat/chat_icons_background.png&quot;);">
									<button id="select-emoticon" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
											<div class="w-5"><img src="/assets/chat/select_emoticon.png" alt="Select Emoticon"></div>
											<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>

											<div id="emoticon-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
												<div class="grid grid-cols-8 gap-1" id="emoticon-grid"></div>
											</div>
										</div>
									</button>

									<button id="select-animation" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
											<div class="w-5"><img src="/assets/chat/select_wink.png" alt="Select Animation"></div>
											<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>

											<div id="animation-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
												<div class="grid grid-cols-8 gap-1" id="animation-grid"></div>
											</div>
										</div>
									</button>

									<div class="absolute top-0 left-0 flex w-full h-full justify-center items-center pointer-events-none"><div></div></div>
									<button id="send-wizz" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300"><div><img src="/assets/chat/wizz.png" alt="Sending wizz"></div></button>
									<div class="px-2"><img src="/assets/chat/chat_icons_separator.png" alt="Icons separator"></div>

									<!-- Menu pour les fonts -->
									
									<button id="change-font" class="h-6">
										<div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
										<div class="w-5"><img src="/assets/chat/change_font.png" alt="Change font"></div>
										<div><img src="/assets/chat/arrow.png" alt="Select arrow"></div>

										<!-- Menu dropdown -> il s'ouvre quand on clique -->
										<div id="font-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-auto p-1 bg-white border border-gray-300 rounded-md shadow-xl">
											<div class="grid grid-cols-4 gap-[2px] w-[102px]" id="font-grid"></div>
										</div>

										</div>
									</button>

									<div class="relative">
									<button id="select-background" class="flex items-center aerobutton p-1 h-6 border border-transparent rounded-sm hover:border-gray-300">
										<div class="w-5"><img src="/assets/chat/select_background.png" alt="Background"></div>
										<div><img src="/assets/chat/arrow.png" alt="Arrow"></div>
									</button>

									<div id="background-dropdown" class="absolute hidden bottom-full right-0 mb-1 w-64 p-2 bg-white border border-gray-300 rounded-md shadow-xl z-50">
										<p class="text-xs text-gray-500 mb-2 pl-1">Choose a background:</p>
													
										<div class="grid grid-cols-3 gap-2">
														
											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/fish_background.jpg')"
													style="background-image: url('/assets/backgrounds/fish_background.jpg');">
											</button>

											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/heart_background.jpg')"
													style="background-image: url('/assets/backgrounds/heart_background.jpg');">
											</button>

											<button class="bg-option w-full h-12 border border-gray-200 hover:border-blue-400 rounded bg-cover bg-center" 
													data-bg="url('/assets/backgrounds/lavender_background.jpg')"
													style="background-image: url('/assets/backgrounds/lavender_background.jpg');">
											</button>

											<button class="bg-option col-span-3 text-xs text-red-500 hover:underline mt-1" data-bg="none">
												Default background
											</button>
										</div>
									</div>
								</div>
						</div>
					</div> 
				</div>
			</div> 
		</div>

	</div>





    <div id="friend-profile-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">
        <div class="window bg-white" style="width: 650px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">
            <div class="title-bar">
                <div class="title-bar-text">My friend</div>
                <div class="title-bar-controls">
                    <button aria-label="Minimize"></button>
                    <button aria-label="Maximize"></button>
                    <button id="close-modal" aria-label="Close"></button>
                </div>
            </div>
            <div class="window-body p-6">
                <div class="mb-6">
                    <h2 id="friend-username" class="text-xl mb-1">'s profile</h2>
                </div>
                
                <div class="flex flex-row gap-6">
					<div class="flex flex-col items-center gap-4 w-[200px]">
                        <div class="relative w-[170px] h-[170px]">
                            <img class="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                            src="https://wlm.vercel.app/assets/status/status_frame_online_large.png">
                            
                            <img id="modal-preview-avatar" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover"
                            src="https://wlm.vercel.app/assets/usertiles/default.png">
                        </div>

                        <div class="flex flex-col gap-2 w-full mt-2 h-64">
                            <input type="file" id="file-input" accept="image/*" hidden>

                            <button id="browse-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                            BROWSE
                            </button>
                            
                            <button id="delete-button" 
                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                            DELETE
                            </button>

                            <div class="mt-auto flex justify-center gap-2 pb-3" style="padding-top:101px">
                                <button id="validation-button" 
                                        class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                            px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                        OK
                                </button>
                                <button id="cancel-button" 
                                        class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm 
                                            px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 
                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                        CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="bg-white border border-[#828790] shadow-inner p-2 h-[250px] overflow-y-auto">
                            <div id="modal-grid" class="grid grid-cols-4 gap-2">
                                <img src="/assets/profile/Beach_Chairs.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Chess_Pieces.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Dirt_Bike.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Friendly_Dog.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Guest_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Orange_Daisy.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Palm_Trees.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Rocket_Launch.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Rubber_Ducky.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Running_Horses.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Skateboarder.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Soccer_Ball.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/User_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile11_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile3_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                                <img src="/assets/profile/Usertile8_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div> <!--fin de la modale pour voir le profil de ses amis -->


</div> <!-- fin du main container -->`;

  // node_modules/engine.io-parser/build/esm/commons.js
  var PACKET_TYPES = /* @__PURE__ */ Object.create(null);
  PACKET_TYPES["open"] = "0";
  PACKET_TYPES["close"] = "1";
  PACKET_TYPES["ping"] = "2";
  PACKET_TYPES["pong"] = "3";
  PACKET_TYPES["message"] = "4";
  PACKET_TYPES["upgrade"] = "5";
  PACKET_TYPES["noop"] = "6";
  var PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
  Object.keys(PACKET_TYPES).forEach((key) => {
    PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
  });
  var ERROR_PACKET = { type: "error", data: "parser error" };

  // node_modules/engine.io-parser/build/esm/encodePacket.browser.js
  var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
  var withNativeArrayBuffer = typeof ArrayBuffer === "function";
  var isView = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
  };
  var encodePacket = ({ type, data }, supportsBinary, callback) => {
    if (withNativeBlob && data instanceof Blob) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(data, callback);
      }
    } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(new Blob([data]), callback);
      }
    }
    return callback(PACKET_TYPES[type] + (data || ""));
  };
  var encodeBlobAsBase64 = (data, callback) => {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const content = fileReader.result.split(",")[1];
      callback("b" + (content || ""));
    };
    return fileReader.readAsDataURL(data);
  };
  function toArray(data) {
    if (data instanceof Uint8Array) {
      return data;
    } else if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    } else {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
  }
  var TEXT_ENCODER;
  function encodePacketToBinary(packet, callback) {
    if (withNativeBlob && packet.data instanceof Blob) {
      return packet.data.arrayBuffer().then(toArray).then(callback);
    } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
      return callback(toArray(packet.data));
    }
    encodePacket(packet, false, (encoded) => {
      if (!TEXT_ENCODER) {
        TEXT_ENCODER = new TextEncoder();
      }
      callback(TEXT_ENCODER.encode(encoded));
    });
  }

  // node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var decode = (base64) => {
    let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }
    const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }
    return arraybuffer;
  };

  // node_modules/engine.io-parser/build/esm/decodePacket.browser.js
  var withNativeArrayBuffer2 = typeof ArrayBuffer === "function";
  var decodePacket = (encodedPacket, binaryType) => {
    if (typeof encodedPacket !== "string") {
      return {
        type: "message",
        data: mapBinary(encodedPacket, binaryType)
      };
    }
    const type = encodedPacket.charAt(0);
    if (type === "b") {
      return {
        type: "message",
        data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
      };
    }
    const packetType = PACKET_TYPES_REVERSE[type];
    if (!packetType) {
      return ERROR_PACKET;
    }
    return encodedPacket.length > 1 ? {
      type: PACKET_TYPES_REVERSE[type],
      data: encodedPacket.substring(1)
    } : {
      type: PACKET_TYPES_REVERSE[type]
    };
  };
  var decodeBase64Packet = (data, binaryType) => {
    if (withNativeArrayBuffer2) {
      const decoded = decode(data);
      return mapBinary(decoded, binaryType);
    } else {
      return { base64: true, data };
    }
  };
  var mapBinary = (data, binaryType) => {
    switch (binaryType) {
      case "blob":
        if (data instanceof Blob) {
          return data;
        } else {
          return new Blob([data]);
        }
      case "arraybuffer":
      default:
        if (data instanceof ArrayBuffer) {
          return data;
        } else {
          return data.buffer;
        }
    }
  };

  // node_modules/engine.io-parser/build/esm/index.js
  var SEPARATOR = String.fromCharCode(30);
  var encodePayload = (packets, callback) => {
    const length = packets.length;
    const encodedPackets = new Array(length);
    let count = 0;
    packets.forEach((packet, i) => {
      encodePacket(packet, false, (encodedPacket) => {
        encodedPackets[i] = encodedPacket;
        if (++count === length) {
          callback(encodedPackets.join(SEPARATOR));
        }
      });
    });
  };
  var decodePayload = (encodedPayload, binaryType) => {
    const encodedPackets = encodedPayload.split(SEPARATOR);
    const packets = [];
    for (let i = 0; i < encodedPackets.length; i++) {
      const decodedPacket = decodePacket(encodedPackets[i], binaryType);
      packets.push(decodedPacket);
      if (decodedPacket.type === "error") {
        break;
      }
    }
    return packets;
  };
  function createPacketEncoderStream() {
    return new TransformStream({
      transform(packet, controller) {
        encodePacketToBinary(packet, (encodedPacket) => {
          const payloadLength = encodedPacket.length;
          let header;
          if (payloadLength < 126) {
            header = new Uint8Array(1);
            new DataView(header.buffer).setUint8(0, payloadLength);
          } else if (payloadLength < 65536) {
            header = new Uint8Array(3);
            const view = new DataView(header.buffer);
            view.setUint8(0, 126);
            view.setUint16(1, payloadLength);
          } else {
            header = new Uint8Array(9);
            const view = new DataView(header.buffer);
            view.setUint8(0, 127);
            view.setBigUint64(1, BigInt(payloadLength));
          }
          if (packet.data && typeof packet.data !== "string") {
            header[0] |= 128;
          }
          controller.enqueue(header);
          controller.enqueue(encodedPacket);
        });
      }
    });
  }
  var TEXT_DECODER;
  function totalLength(chunks) {
    return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  }
  function concatChunks(chunks, size) {
    if (chunks[0].length === size) {
      return chunks.shift();
    }
    const buffer = new Uint8Array(size);
    let j = 0;
    for (let i = 0; i < size; i++) {
      buffer[i] = chunks[0][j++];
      if (j === chunks[0].length) {
        chunks.shift();
        j = 0;
      }
    }
    if (chunks.length && j < chunks[0].length) {
      chunks[0] = chunks[0].slice(j);
    }
    return buffer;
  }
  function createPacketDecoderStream(maxPayload, binaryType) {
    if (!TEXT_DECODER) {
      TEXT_DECODER = new TextDecoder();
    }
    const chunks = [];
    let state = 0;
    let expectedLength = -1;
    let isBinary2 = false;
    return new TransformStream({
      transform(chunk, controller) {
        chunks.push(chunk);
        while (true) {
          if (state === 0) {
            if (totalLength(chunks) < 1) {
              break;
            }
            const header = concatChunks(chunks, 1);
            isBinary2 = (header[0] & 128) === 128;
            expectedLength = header[0] & 127;
            if (expectedLength < 126) {
              state = 3;
            } else if (expectedLength === 126) {
              state = 1;
            } else {
              state = 2;
            }
          } else if (state === 1) {
            if (totalLength(chunks) < 2) {
              break;
            }
            const headerArray = concatChunks(chunks, 2);
            expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
            state = 3;
          } else if (state === 2) {
            if (totalLength(chunks) < 8) {
              break;
            }
            const headerArray = concatChunks(chunks, 8);
            const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
            const n = view.getUint32(0);
            if (n > Math.pow(2, 53 - 32) - 1) {
              controller.enqueue(ERROR_PACKET);
              break;
            }
            expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
            state = 3;
          } else {
            if (totalLength(chunks) < expectedLength) {
              break;
            }
            const data = concatChunks(chunks, expectedLength);
            controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
            state = 0;
          }
          if (expectedLength === 0 || expectedLength > maxPayload) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
        }
      }
    });
  }
  var protocol = 4;

  // node_modules/@socket.io/component-emitter/lib/esm/index.js
  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }
  Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
    return this;
  };
  Emitter.prototype.once = function(event, fn) {
    function on2() {
      this.off(event, on2);
      fn.apply(this, arguments);
    }
    on2.fn = fn;
    this.on(event, on2);
    return this;
  };
  Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }
    var callbacks = this._callbacks["$" + event];
    if (!callbacks) return this;
    if (1 == arguments.length) {
      delete this._callbacks["$" + event];
      return this;
    }
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    if (callbacks.length === 0) {
      delete this._callbacks["$" + event];
    }
    return this;
  };
  Emitter.prototype.emit = function(event) {
    this._callbacks = this._callbacks || {};
    var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }
    return this;
  };
  Emitter.prototype.emitReserved = Emitter.prototype.emit;
  Emitter.prototype.listeners = function(event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks["$" + event] || [];
  };
  Emitter.prototype.hasListeners = function(event) {
    return !!this.listeners(event).length;
  };

  // node_modules/engine.io-client/build/esm/globals.js
  var nextTick = (() => {
    const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
    if (isPromiseAvailable) {
      return (cb) => Promise.resolve().then(cb);
    } else {
      return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
    }
  })();
  var globalThisShim = (() => {
    if (typeof self !== "undefined") {
      return self;
    } else if (typeof window !== "undefined") {
      return window;
    } else {
      return Function("return this")();
    }
  })();
  var defaultBinaryType = "arraybuffer";
  function createCookieJar() {
  }

  // node_modules/engine.io-client/build/esm/util.js
  function pick(obj, ...attr) {
    return attr.reduce((acc, k) => {
      if (obj.hasOwnProperty(k)) {
        acc[k] = obj[k];
      }
      return acc;
    }, {});
  }
  var NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
  var NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
  function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
      obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
      obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
    } else {
      obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
      obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
    }
  }
  var BASE64_OVERHEAD = 1.33;
  function byteLength(obj) {
    if (typeof obj === "string") {
      return utf8Length(obj);
    }
    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
  }
  function utf8Length(str) {
    let c = 0, length = 0;
    for (let i = 0, l = str.length; i < l; i++) {
      c = str.charCodeAt(i);
      if (c < 128) {
        length += 1;
      } else if (c < 2048) {
        length += 2;
      } else if (c < 55296 || c >= 57344) {
        length += 3;
      } else {
        i++;
        length += 4;
      }
    }
    return length;
  }
  function randomString() {
    return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
  }

  // node_modules/engine.io-client/build/esm/contrib/parseqs.js
  function encode(obj) {
    let str = "";
    for (let i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (str.length)
          str += "&";
        str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
      }
    }
    return str;
  }
  function decode2(qs) {
    let qry = {};
    let pairs = qs.split("&");
    for (let i = 0, l = pairs.length; i < l; i++) {
      let pair = pairs[i].split("=");
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
  }

  // node_modules/engine.io-client/build/esm/transport.js
  var TransportError = class extends Error {
    constructor(reason, description, context) {
      super(reason);
      this.description = description;
      this.context = context;
      this.type = "TransportError";
    }
  };
  var Transport = class extends Emitter {
    /**
     * Transport abstract constructor.
     *
     * @param {Object} opts - options
     * @protected
     */
    constructor(opts) {
      super();
      this.writable = false;
      installTimerFunctions(this, opts);
      this.opts = opts;
      this.query = opts.query;
      this.socket = opts.socket;
      this.supportsBinary = !opts.forceBase64;
    }
    /**
     * Emits an error.
     *
     * @param {String} reason
     * @param description
     * @param context - the error context
     * @return {Transport} for chaining
     * @protected
     */
    onError(reason, description, context) {
      super.emitReserved("error", new TransportError(reason, description, context));
      return this;
    }
    /**
     * Opens the transport.
     */
    open() {
      this.readyState = "opening";
      this.doOpen();
      return this;
    }
    /**
     * Closes the transport.
     */
    close() {
      if (this.readyState === "opening" || this.readyState === "open") {
        this.doClose();
        this.onClose();
      }
      return this;
    }
    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     */
    send(packets) {
      if (this.readyState === "open") {
        this.write(packets);
      } else {
      }
    }
    /**
     * Called upon open
     *
     * @protected
     */
    onOpen() {
      this.readyState = "open";
      this.writable = true;
      super.emitReserved("open");
    }
    /**
     * Called with data.
     *
     * @param {String} data
     * @protected
     */
    onData(data) {
      const packet = decodePacket(data, this.socket.binaryType);
      this.onPacket(packet);
    }
    /**
     * Called with a decoded packet.
     *
     * @protected
     */
    onPacket(packet) {
      super.emitReserved("packet", packet);
    }
    /**
     * Called upon close.
     *
     * @protected
     */
    onClose(details) {
      this.readyState = "closed";
      super.emitReserved("close", details);
    }
    /**
     * Pauses the transport, in order not to lose packets during an upgrade.
     *
     * @param onPause
     */
    pause(onPause) {
    }
    createUri(schema, query = {}) {
      return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
    }
    _hostname() {
      const hostname = this.opts.hostname;
      return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
    }
    _port() {
      if (this.opts.port && (this.opts.secure && Number(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80)) {
        return ":" + this.opts.port;
      } else {
        return "";
      }
    }
    _query(query) {
      const encodedQuery = encode(query);
      return encodedQuery.length ? "?" + encodedQuery : "";
    }
  };

  // node_modules/engine.io-client/build/esm/transports/polling.js
  var Polling = class extends Transport {
    constructor() {
      super(...arguments);
      this._polling = false;
    }
    get name() {
      return "polling";
    }
    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @protected
     */
    doOpen() {
      this._poll();
    }
    /**
     * Pauses polling.
     *
     * @param {Function} onPause - callback upon buffers are flushed and transport is paused
     * @package
     */
    pause(onPause) {
      this.readyState = "pausing";
      const pause = () => {
        this.readyState = "paused";
        onPause();
      };
      if (this._polling || !this.writable) {
        let total = 0;
        if (this._polling) {
          total++;
          this.once("pollComplete", function() {
            --total || pause();
          });
        }
        if (!this.writable) {
          total++;
          this.once("drain", function() {
            --total || pause();
          });
        }
      } else {
        pause();
      }
    }
    /**
     * Starts polling cycle.
     *
     * @private
     */
    _poll() {
      this._polling = true;
      this.doPoll();
      this.emitReserved("poll");
    }
    /**
     * Overloads onData to detect payloads.
     *
     * @protected
     */
    onData(data) {
      const callback = (packet) => {
        if ("opening" === this.readyState && packet.type === "open") {
          this.onOpen();
        }
        if ("close" === packet.type) {
          this.onClose({ description: "transport closed by the server" });
          return false;
        }
        this.onPacket(packet);
      };
      decodePayload(data, this.socket.binaryType).forEach(callback);
      if ("closed" !== this.readyState) {
        this._polling = false;
        this.emitReserved("pollComplete");
        if ("open" === this.readyState) {
          this._poll();
        } else {
        }
      }
    }
    /**
     * For polling, send a close packet.
     *
     * @protected
     */
    doClose() {
      const close = () => {
        this.write([{ type: "close" }]);
      };
      if ("open" === this.readyState) {
        close();
      } else {
        this.once("open", close);
      }
    }
    /**
     * Writes a packets payload.
     *
     * @param {Array} packets - data packets
     * @protected
     */
    write(packets) {
      this.writable = false;
      encodePayload(packets, (data) => {
        this.doWrite(data, () => {
          this.writable = true;
          this.emitReserved("drain");
        });
      });
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "https" : "http";
      const query = this.query || {};
      if (false !== this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary && !query.sid) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };

  // node_modules/engine.io-client/build/esm/contrib/has-cors.js
  var value = false;
  try {
    value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
  } catch (err) {
  }
  var hasCORS = value;

  // node_modules/engine.io-client/build/esm/transports/polling-xhr.js
  function empty() {
  }
  var BaseXHR = class extends Polling {
    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @package
     */
    constructor(opts) {
      super(opts);
      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;
        if (!port) {
          port = isSSL ? "443" : "80";
        }
        this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
      }
    }
    /**
     * Sends data.
     *
     * @param {String} data to send.
     * @param {Function} called upon flush.
     * @private
     */
    doWrite(data, fn) {
      const req = this.request({
        method: "POST",
        data
      });
      req.on("success", fn);
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr post error", xhrStatus, context);
      });
    }
    /**
     * Starts a poll cycle.
     *
     * @private
     */
    doPoll() {
      const req = this.request();
      req.on("data", this.onData.bind(this));
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr poll error", xhrStatus, context);
      });
      this.pollXhr = req;
    }
  };
  var Request = class _Request extends Emitter {
    /**
     * Request constructor
     *
     * @param {Object} options
     * @package
     */
    constructor(createRequest, uri, opts) {
      super();
      this.createRequest = createRequest;
      installTimerFunctions(this, opts);
      this._opts = opts;
      this._method = opts.method || "GET";
      this._uri = uri;
      this._data = void 0 !== opts.data ? opts.data : null;
      this._create();
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @private
     */
    _create() {
      var _a;
      const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
      opts.xdomain = !!this._opts.xd;
      const xhr = this._xhr = this.createRequest(opts);
      try {
        xhr.open(this._method, this._uri, true);
        try {
          if (this._opts.extraHeaders) {
            xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
            for (let i in this._opts.extraHeaders) {
              if (this._opts.extraHeaders.hasOwnProperty(i)) {
                xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
              }
            }
          }
        } catch (e) {
        }
        if ("POST" === this._method) {
          try {
            xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
          } catch (e) {
          }
        }
        try {
          xhr.setRequestHeader("Accept", "*/*");
        } catch (e) {
        }
        (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
        if ("withCredentials" in xhr) {
          xhr.withCredentials = this._opts.withCredentials;
        }
        if (this._opts.requestTimeout) {
          xhr.timeout = this._opts.requestTimeout;
        }
        xhr.onreadystatechange = () => {
          var _a2;
          if (xhr.readyState === 3) {
            (_a2 = this._opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(
              // @ts-ignore
              xhr.getResponseHeader("set-cookie")
            );
          }
          if (4 !== xhr.readyState)
            return;
          if (200 === xhr.status || 1223 === xhr.status) {
            this._onLoad();
          } else {
            this.setTimeoutFn(() => {
              this._onError(typeof xhr.status === "number" ? xhr.status : 0);
            }, 0);
          }
        };
        xhr.send(this._data);
      } catch (e) {
        this.setTimeoutFn(() => {
          this._onError(e);
        }, 0);
        return;
      }
      if (typeof document !== "undefined") {
        this._index = _Request.requestsCount++;
        _Request.requests[this._index] = this;
      }
    }
    /**
     * Called upon error.
     *
     * @private
     */
    _onError(err) {
      this.emitReserved("error", err, this._xhr);
      this._cleanup(true);
    }
    /**
     * Cleans up house.
     *
     * @private
     */
    _cleanup(fromError) {
      if ("undefined" === typeof this._xhr || null === this._xhr) {
        return;
      }
      this._xhr.onreadystatechange = empty;
      if (fromError) {
        try {
          this._xhr.abort();
        } catch (e) {
        }
      }
      if (typeof document !== "undefined") {
        delete _Request.requests[this._index];
      }
      this._xhr = null;
    }
    /**
     * Called upon load.
     *
     * @private
     */
    _onLoad() {
      const data = this._xhr.responseText;
      if (data !== null) {
        this.emitReserved("data", data);
        this.emitReserved("success");
        this._cleanup();
      }
    }
    /**
     * Aborts the request.
     *
     * @package
     */
    abort() {
      this._cleanup();
    }
  };
  Request.requestsCount = 0;
  Request.requests = {};
  if (typeof document !== "undefined") {
    if (typeof attachEvent === "function") {
      attachEvent("onunload", unloadHandler);
    } else if (typeof addEventListener === "function") {
      const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
      addEventListener(terminationEvent, unloadHandler, false);
    }
  }
  function unloadHandler() {
    for (let i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        Request.requests[i].abort();
      }
    }
  }
  var hasXHR2 = (function() {
    const xhr = newRequest({
      xdomain: false
    });
    return xhr && xhr.responseType !== null;
  })();
  var XHR = class extends BaseXHR {
    constructor(opts) {
      super(opts);
      const forceBase64 = opts && opts.forceBase64;
      this.supportsBinary = hasXHR2 && !forceBase64;
    }
    request(opts = {}) {
      Object.assign(opts, { xd: this.xd }, this.opts);
      return new Request(newRequest, this.uri(), opts);
    }
  };
  function newRequest(opts) {
    const xdomain = opts.xdomain;
    try {
      if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
        return new XMLHttpRequest();
      }
    } catch (e) {
    }
    if (!xdomain) {
      try {
        return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
      } catch (e) {
      }
    }
  }

  // node_modules/engine.io-client/build/esm/transports/websocket.js
  var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
  var BaseWS = class extends Transport {
    get name() {
      return "websocket";
    }
    doOpen() {
      const uri = this.uri();
      const protocols = this.opts.protocols;
      const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
      if (this.opts.extraHeaders) {
        opts.headers = this.opts.extraHeaders;
      }
      try {
        this.ws = this.createSocket(uri, protocols, opts);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this.ws.binaryType = this.socket.binaryType;
      this.addEventListeners();
    }
    /**
     * Adds event listeners to the socket
     *
     * @private
     */
    addEventListeners() {
      this.ws.onopen = () => {
        if (this.opts.autoUnref) {
          this.ws._socket.unref();
        }
        this.onOpen();
      };
      this.ws.onclose = (closeEvent) => this.onClose({
        description: "websocket connection closed",
        context: closeEvent
      });
      this.ws.onmessage = (ev) => this.onData(ev.data);
      this.ws.onerror = (e) => this.onError("websocket error", e);
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        encodePacket(packet, this.supportsBinary, (data) => {
          try {
            this.doWrite(packet, data);
          } catch (e) {
          }
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      if (typeof this.ws !== "undefined") {
        this.ws.onerror = () => {
        };
        this.ws.close();
        this.ws = null;
      }
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "wss" : "ws";
      const query = this.query || {};
      if (this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };
  var WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
  var WS = class extends BaseWS {
    createSocket(uri, protocols, opts) {
      return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
    }
    doWrite(_packet, data) {
      this.ws.send(data);
    }
  };

  // node_modules/engine.io-client/build/esm/transports/webtransport.js
  var WT = class extends Transport {
    get name() {
      return "webtransport";
    }
    doOpen() {
      try {
        this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this._transport.closed.then(() => {
        this.onClose();
      }).catch((err) => {
        this.onError("webtransport error", err);
      });
      this._transport.ready.then(() => {
        this._transport.createBidirectionalStream().then((stream) => {
          const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
          const reader = stream.readable.pipeThrough(decoderStream).getReader();
          const encoderStream = createPacketEncoderStream();
          encoderStream.readable.pipeTo(stream.writable);
          this._writer = encoderStream.writable.getWriter();
          const read = () => {
            reader.read().then(({ done, value: value2 }) => {
              if (done) {
                return;
              }
              this.onPacket(value2);
              read();
            }).catch((err) => {
            });
          };
          read();
          const packet = { type: "open" };
          if (this.query.sid) {
            packet.data = `{"sid":"${this.query.sid}"}`;
          }
          this._writer.write(packet).then(() => this.onOpen());
        });
      });
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        this._writer.write(packet).then(() => {
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      var _a;
      (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
    }
  };

  // node_modules/engine.io-client/build/esm/transports/index.js
  var transports = {
    websocket: WS,
    webtransport: WT,
    polling: XHR
  };

  // node_modules/engine.io-client/build/esm/contrib/parseuri.js
  var re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
  var parts = [
    "source",
    "protocol",
    "authority",
    "userInfo",
    "user",
    "password",
    "host",
    "port",
    "relative",
    "path",
    "directory",
    "file",
    "query",
    "anchor"
  ];
  function parse(str) {
    if (str.length > 8e3) {
      throw "URI too long";
    }
    const src = str, b = str.indexOf("["), e = str.indexOf("]");
    if (b != -1 && e != -1) {
      str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
    }
    let m = re.exec(str || ""), uri = {}, i = 14;
    while (i--) {
      uri[parts[i]] = m[i] || "";
    }
    if (b != -1 && e != -1) {
      uri.source = src;
      uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
      uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
      uri.ipv6uri = true;
    }
    uri.pathNames = pathNames(uri, uri["path"]);
    uri.queryKey = queryKey(uri, uri["query"]);
    return uri;
  }
  function pathNames(obj, path) {
    const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
    if (path.slice(0, 1) == "/" || path.length === 0) {
      names.splice(0, 1);
    }
    if (path.slice(-1) == "/") {
      names.splice(names.length - 1, 1);
    }
    return names;
  }
  function queryKey(uri, query) {
    const data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
      if ($1) {
        data[$1] = $2;
      }
    });
    return data;
  }

  // node_modules/engine.io-client/build/esm/socket.js
  var withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
  var OFFLINE_EVENT_LISTENERS = [];
  if (withEventListeners) {
    addEventListener("offline", () => {
      OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
    }, false);
  }
  var SocketWithoutUpgrade = class _SocketWithoutUpgrade extends Emitter {
    /**
     * Socket constructor.
     *
     * @param {String|Object} uri - uri or options
     * @param {Object} opts - options
     */
    constructor(uri, opts) {
      super();
      this.binaryType = defaultBinaryType;
      this.writeBuffer = [];
      this._prevBufferLen = 0;
      this._pingInterval = -1;
      this._pingTimeout = -1;
      this._maxPayload = -1;
      this._pingTimeoutTime = Infinity;
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = null;
      }
      if (uri) {
        const parsedUri = parse(uri);
        opts.hostname = parsedUri.host;
        opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
        opts.port = parsedUri.port;
        if (parsedUri.query)
          opts.query = parsedUri.query;
      } else if (opts.host) {
        opts.hostname = parse(opts.host).host;
      }
      installTimerFunctions(this, opts);
      this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
      if (opts.hostname && !opts.port) {
        opts.port = this.secure ? "443" : "80";
      }
      this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
      this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
      this.transports = [];
      this._transportsByName = {};
      opts.transports.forEach((t) => {
        const transportName = t.prototype.name;
        this.transports.push(transportName);
        this._transportsByName[transportName] = t;
      });
      this.opts = Object.assign({
        path: "/engine.io",
        agent: false,
        withCredentials: false,
        upgrade: true,
        timestampParam: "t",
        rememberUpgrade: false,
        addTrailingSlash: true,
        rejectUnauthorized: true,
        perMessageDeflate: {
          threshold: 1024
        },
        transportOptions: {},
        closeOnBeforeunload: false
      }, opts);
      this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
      if (typeof this.opts.query === "string") {
        this.opts.query = decode2(this.opts.query);
      }
      if (withEventListeners) {
        if (this.opts.closeOnBeforeunload) {
          this._beforeunloadEventListener = () => {
            if (this.transport) {
              this.transport.removeAllListeners();
              this.transport.close();
            }
          };
          addEventListener("beforeunload", this._beforeunloadEventListener, false);
        }
        if (this.hostname !== "localhost") {
          this._offlineEventListener = () => {
            this._onClose("transport close", {
              description: "network connection lost"
            });
          };
          OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
        }
      }
      if (this.opts.withCredentials) {
        this._cookieJar = createCookieJar();
      }
      this._open();
    }
    /**
     * Creates transport of the given type.
     *
     * @param {String} name - transport name
     * @return {Transport}
     * @private
     */
    createTransport(name) {
      const query = Object.assign({}, this.opts.query);
      query.EIO = protocol;
      query.transport = name;
      if (this.id)
        query.sid = this.id;
      const opts = Object.assign({}, this.opts, {
        query,
        socket: this,
        hostname: this.hostname,
        secure: this.secure,
        port: this.port
      }, this.opts.transportOptions[name]);
      return new this._transportsByName[name](opts);
    }
    /**
     * Initializes transport to use and starts probe.
     *
     * @private
     */
    _open() {
      if (this.transports.length === 0) {
        this.setTimeoutFn(() => {
          this.emitReserved("error", "No transports available");
        }, 0);
        return;
      }
      const transportName = this.opts.rememberUpgrade && _SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
      this.readyState = "opening";
      const transport = this.createTransport(transportName);
      transport.open();
      this.setTransport(transport);
    }
    /**
     * Sets the current transport. Disables the existing one (if any).
     *
     * @private
     */
    setTransport(transport) {
      if (this.transport) {
        this.transport.removeAllListeners();
      }
      this.transport = transport;
      transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
    }
    /**
     * Called when connection is deemed open.
     *
     * @private
     */
    onOpen() {
      this.readyState = "open";
      _SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
      this.emitReserved("open");
      this.flush();
    }
    /**
     * Handles a packet.
     *
     * @private
     */
    _onPacket(packet) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.emitReserved("packet", packet);
        this.emitReserved("heartbeat");
        switch (packet.type) {
          case "open":
            this.onHandshake(JSON.parse(packet.data));
            break;
          case "ping":
            this._sendPacket("pong");
            this.emitReserved("ping");
            this.emitReserved("pong");
            this._resetPingTimeout();
            break;
          case "error":
            const err = new Error("server error");
            err.code = packet.data;
            this._onError(err);
            break;
          case "message":
            this.emitReserved("data", packet.data);
            this.emitReserved("message", packet.data);
            break;
        }
      } else {
      }
    }
    /**
     * Called upon handshake completion.
     *
     * @param {Object} data - handshake obj
     * @private
     */
    onHandshake(data) {
      this.emitReserved("handshake", data);
      this.id = data.sid;
      this.transport.query.sid = data.sid;
      this._pingInterval = data.pingInterval;
      this._pingTimeout = data.pingTimeout;
      this._maxPayload = data.maxPayload;
      this.onOpen();
      if ("closed" === this.readyState)
        return;
      this._resetPingTimeout();
    }
    /**
     * Sets and resets ping timeout timer based on server pings.
     *
     * @private
     */
    _resetPingTimeout() {
      this.clearTimeoutFn(this._pingTimeoutTimer);
      const delay = this._pingInterval + this._pingTimeout;
      this._pingTimeoutTime = Date.now() + delay;
      this._pingTimeoutTimer = this.setTimeoutFn(() => {
        this._onClose("ping timeout");
      }, delay);
      if (this.opts.autoUnref) {
        this._pingTimeoutTimer.unref();
      }
    }
    /**
     * Called on `drain` event
     *
     * @private
     */
    _onDrain() {
      this.writeBuffer.splice(0, this._prevBufferLen);
      this._prevBufferLen = 0;
      if (0 === this.writeBuffer.length) {
        this.emitReserved("drain");
      } else {
        this.flush();
      }
    }
    /**
     * Flush write buffers.
     *
     * @private
     */
    flush() {
      if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
        const packets = this._getWritablePackets();
        this.transport.send(packets);
        this._prevBufferLen = packets.length;
        this.emitReserved("flush");
      }
    }
    /**
     * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
     * long-polling)
     *
     * @private
     */
    _getWritablePackets() {
      const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
      if (!shouldCheckPayloadSize) {
        return this.writeBuffer;
      }
      let payloadSize = 1;
      for (let i = 0; i < this.writeBuffer.length; i++) {
        const data = this.writeBuffer[i].data;
        if (data) {
          payloadSize += byteLength(data);
        }
        if (i > 0 && payloadSize > this._maxPayload) {
          return this.writeBuffer.slice(0, i);
        }
        payloadSize += 2;
      }
      return this.writeBuffer;
    }
    /**
     * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
     *
     * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
     * `write()` method then the message would not be buffered by the Socket.IO client.
     *
     * @return {boolean}
     * @private
     */
    /* private */
    _hasPingExpired() {
      if (!this._pingTimeoutTime)
        return true;
      const hasExpired = Date.now() > this._pingTimeoutTime;
      if (hasExpired) {
        this._pingTimeoutTime = 0;
        nextTick(() => {
          this._onClose("ping timeout");
        }, this.setTimeoutFn);
      }
      return hasExpired;
    }
    /**
     * Sends a message.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    write(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a message. Alias of {@link Socket#write}.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    send(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a packet.
     *
     * @param {String} type: packet type.
     * @param {String} data.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @private
     */
    _sendPacket(type, data, options, fn) {
      if ("function" === typeof data) {
        fn = data;
        data = void 0;
      }
      if ("function" === typeof options) {
        fn = options;
        options = null;
      }
      if ("closing" === this.readyState || "closed" === this.readyState) {
        return;
      }
      options = options || {};
      options.compress = false !== options.compress;
      const packet = {
        type,
        data,
        options
      };
      this.emitReserved("packetCreate", packet);
      this.writeBuffer.push(packet);
      if (fn)
        this.once("flush", fn);
      this.flush();
    }
    /**
     * Closes the connection.
     */
    close() {
      const close = () => {
        this._onClose("forced close");
        this.transport.close();
      };
      const cleanupAndClose = () => {
        this.off("upgrade", cleanupAndClose);
        this.off("upgradeError", cleanupAndClose);
        close();
      };
      const waitForUpgrade = () => {
        this.once("upgrade", cleanupAndClose);
        this.once("upgradeError", cleanupAndClose);
      };
      if ("opening" === this.readyState || "open" === this.readyState) {
        this.readyState = "closing";
        if (this.writeBuffer.length) {
          this.once("drain", () => {
            if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          });
        } else if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      }
      return this;
    }
    /**
     * Called upon transport error
     *
     * @private
     */
    _onError(err) {
      _SocketWithoutUpgrade.priorWebsocketSuccess = false;
      if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
        this.transports.shift();
        return this._open();
      }
      this.emitReserved("error", err);
      this._onClose("transport error", err);
    }
    /**
     * Called upon transport close.
     *
     * @private
     */
    _onClose(reason, description) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.clearTimeoutFn(this._pingTimeoutTimer);
        this.transport.removeAllListeners("close");
        this.transport.close();
        this.transport.removeAllListeners();
        if (withEventListeners) {
          if (this._beforeunloadEventListener) {
            removeEventListener("beforeunload", this._beforeunloadEventListener, false);
          }
          if (this._offlineEventListener) {
            const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
            if (i !== -1) {
              OFFLINE_EVENT_LISTENERS.splice(i, 1);
            }
          }
        }
        this.readyState = "closed";
        this.id = null;
        this.emitReserved("close", reason, description);
        this.writeBuffer = [];
        this._prevBufferLen = 0;
      }
    }
  };
  SocketWithoutUpgrade.protocol = protocol;
  var SocketWithUpgrade = class extends SocketWithoutUpgrade {
    constructor() {
      super(...arguments);
      this._upgrades = [];
    }
    onOpen() {
      super.onOpen();
      if ("open" === this.readyState && this.opts.upgrade) {
        for (let i = 0; i < this._upgrades.length; i++) {
          this._probe(this._upgrades[i]);
        }
      }
    }
    /**
     * Probes a transport.
     *
     * @param {String} name - transport name
     * @private
     */
    _probe(name) {
      let transport = this.createTransport(name);
      let failed = false;
      SocketWithoutUpgrade.priorWebsocketSuccess = false;
      const onTransportOpen = () => {
        if (failed)
          return;
        transport.send([{ type: "ping", data: "probe" }]);
        transport.once("packet", (msg) => {
          if (failed)
            return;
          if ("pong" === msg.type && "probe" === msg.data) {
            this.upgrading = true;
            this.emitReserved("upgrading", transport);
            if (!transport)
              return;
            SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
            this.transport.pause(() => {
              if (failed)
                return;
              if ("closed" === this.readyState)
                return;
              cleanup();
              this.setTransport(transport);
              transport.send([{ type: "upgrade" }]);
              this.emitReserved("upgrade", transport);
              transport = null;
              this.upgrading = false;
              this.flush();
            });
          } else {
            const err = new Error("probe error");
            err.transport = transport.name;
            this.emitReserved("upgradeError", err);
          }
        });
      };
      function freezeTransport() {
        if (failed)
          return;
        failed = true;
        cleanup();
        transport.close();
        transport = null;
      }
      const onerror = (err) => {
        const error = new Error("probe error: " + err);
        error.transport = transport.name;
        freezeTransport();
        this.emitReserved("upgradeError", error);
      };
      function onTransportClose() {
        onerror("transport closed");
      }
      function onclose() {
        onerror("socket closed");
      }
      function onupgrade(to) {
        if (transport && to.name !== transport.name) {
          freezeTransport();
        }
      }
      const cleanup = () => {
        transport.removeListener("open", onTransportOpen);
        transport.removeListener("error", onerror);
        transport.removeListener("close", onTransportClose);
        this.off("close", onclose);
        this.off("upgrading", onupgrade);
      };
      transport.once("open", onTransportOpen);
      transport.once("error", onerror);
      transport.once("close", onTransportClose);
      this.once("close", onclose);
      this.once("upgrading", onupgrade);
      if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
        this.setTimeoutFn(() => {
          if (!failed) {
            transport.open();
          }
        }, 200);
      } else {
        transport.open();
      }
    }
    onHandshake(data) {
      this._upgrades = this._filterUpgrades(data.upgrades);
      super.onHandshake(data);
    }
    /**
     * Filters upgrades, returning only those matching client transports.
     *
     * @param {Array} upgrades - server upgrades
     * @private
     */
    _filterUpgrades(upgrades) {
      const filteredUpgrades = [];
      for (let i = 0; i < upgrades.length; i++) {
        if (~this.transports.indexOf(upgrades[i]))
          filteredUpgrades.push(upgrades[i]);
      }
      return filteredUpgrades;
    }
  };
  var Socket = class extends SocketWithUpgrade {
    constructor(uri, opts = {}) {
      const o = typeof uri === "object" ? uri : opts;
      if (!o.transports || o.transports && typeof o.transports[0] === "string") {
        o.transports = (o.transports || ["polling", "websocket", "webtransport"]).map((transportName) => transports[transportName]).filter((t) => !!t);
      }
      super(uri, o);
    }
  };

  // node_modules/engine.io-client/build/esm/index.js
  var protocol2 = Socket.protocol;

  // node_modules/socket.io-client/build/esm/url.js
  function url(uri, path = "", loc) {
    let obj = uri;
    loc = loc || typeof location !== "undefined" && location;
    if (null == uri)
      uri = loc.protocol + "//" + loc.host;
    if (typeof uri === "string") {
      if ("/" === uri.charAt(0)) {
        if ("/" === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }
      if (!/^(https?|wss?):\/\//.test(uri)) {
        if ("undefined" !== typeof loc) {
          uri = loc.protocol + "//" + uri;
        } else {
          uri = "https://" + uri;
        }
      }
      obj = parse(uri);
    }
    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = "80";
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = "443";
      }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
  }

  // node_modules/socket.io-parser/build/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    Decoder: () => Decoder,
    Encoder: () => Encoder,
    PacketType: () => PacketType,
    protocol: () => protocol3
  });

  // node_modules/socket.io-parser/build/esm/is-binary.js
  var withNativeArrayBuffer3 = typeof ArrayBuffer === "function";
  var isView2 = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };
  var toString = Object.prototype.toString;
  var withNativeBlob2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
  var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
  function isBinary(obj) {
    return withNativeArrayBuffer3 && (obj instanceof ArrayBuffer || isView2(obj)) || withNativeBlob2 && obj instanceof Blob || withNativeFile && obj instanceof File;
  }
  function hasBinary(obj, toJSON) {
    if (!obj || typeof obj !== "object") {
      return false;
    }
    if (Array.isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        if (hasBinary(obj[i])) {
          return true;
        }
      }
      return false;
    }
    if (isBinary(obj)) {
      return true;
    }
    if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
      return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
        return true;
      }
    }
    return false;
  }

  // node_modules/socket.io-parser/build/esm/binary.js
  function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length;
    return { packet: pack, buffers };
  }
  function _deconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (isBinary(data)) {
      const placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (Array.isArray(data)) {
      const newData = new Array(data.length);
      for (let i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i], buffers);
      }
      return newData;
    } else if (typeof data === "object" && !(data instanceof Date)) {
      const newData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          newData[key] = _deconstructPacket(data[key], buffers);
        }
      }
      return newData;
    }
    return data;
  }
  function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    delete packet.attachments;
    return packet;
  }
  function _reconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (data && data._placeholder === true) {
      const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
      if (isIndexValid) {
        return buffers[data.num];
      } else {
        throw new Error("illegal attachments");
      }
    } else if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i], buffers);
      }
    } else if (typeof data === "object") {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          data[key] = _reconstructPacket(data[key], buffers);
        }
      }
    }
    return data;
  }

  // node_modules/socket.io-parser/build/esm/index.js
  var RESERVED_EVENTS = [
    "connect",
    "connect_error",
    "disconnect",
    "disconnecting",
    "newListener",
    "removeListener"
    // used by the Node.js EventEmitter
  ];
  var protocol3 = 5;
  var PacketType;
  (function(PacketType2) {
    PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
    PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
    PacketType2[PacketType2["ACK"] = 3] = "ACK";
    PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
  })(PacketType || (PacketType = {}));
  var Encoder = class {
    /**
     * Encoder constructor
     *
     * @param {function} replacer - custom replacer to pass down to JSON.parse
     */
    constructor(replacer) {
      this.replacer = replacer;
    }
    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     */
    encode(obj) {
      if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
        if (hasBinary(obj)) {
          return this.encodeAsBinary({
            type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
            nsp: obj.nsp,
            data: obj.data,
            id: obj.id
          });
        }
      }
      return [this.encodeAsString(obj)];
    }
    /**
     * Encode packet as string.
     */
    encodeAsString(obj) {
      let str = "" + obj.type;
      if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
        str += obj.attachments + "-";
      }
      if (obj.nsp && "/" !== obj.nsp) {
        str += obj.nsp + ",";
      }
      if (null != obj.id) {
        str += obj.id;
      }
      if (null != obj.data) {
        str += JSON.stringify(obj.data, this.replacer);
      }
      return str;
    }
    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     */
    encodeAsBinary(obj) {
      const deconstruction = deconstructPacket(obj);
      const pack = this.encodeAsString(deconstruction.packet);
      const buffers = deconstruction.buffers;
      buffers.unshift(pack);
      return buffers;
    }
  };
  function isObject(value2) {
    return Object.prototype.toString.call(value2) === "[object Object]";
  }
  var Decoder = class _Decoder extends Emitter {
    /**
     * Decoder constructor
     *
     * @param {function} reviver - custom reviver to pass down to JSON.stringify
     */
    constructor(reviver) {
      super();
      this.reviver = reviver;
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */
    add(obj) {
      let packet;
      if (typeof obj === "string") {
        if (this.reconstructor) {
          throw new Error("got plaintext data when reconstructing a packet");
        }
        packet = this.decodeString(obj);
        const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
        if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
          packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
          this.reconstructor = new BinaryReconstructor(packet);
          if (packet.attachments === 0) {
            super.emitReserved("decoded", packet);
          }
        } else {
          super.emitReserved("decoded", packet);
        }
      } else if (isBinary(obj) || obj.base64) {
        if (!this.reconstructor) {
          throw new Error("got binary data when not reconstructing a packet");
        } else {
          packet = this.reconstructor.takeBinaryData(obj);
          if (packet) {
            this.reconstructor = null;
            super.emitReserved("decoded", packet);
          }
        }
      } else {
        throw new Error("Unknown type: " + obj);
      }
    }
    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     */
    decodeString(str) {
      let i = 0;
      const p = {
        type: Number(str.charAt(0))
      };
      if (PacketType[p.type] === void 0) {
        throw new Error("unknown packet type " + p.type);
      }
      if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
        const start = i + 1;
        while (str.charAt(++i) !== "-" && i != str.length) {
        }
        const buf = str.substring(start, i);
        if (buf != Number(buf) || str.charAt(i) !== "-") {
          throw new Error("Illegal attachments");
        }
        p.attachments = Number(buf);
      }
      if ("/" === str.charAt(i + 1)) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if ("," === c)
            break;
          if (i === str.length)
            break;
        }
        p.nsp = str.substring(start, i);
      } else {
        p.nsp = "/";
      }
      const next = str.charAt(i + 1);
      if ("" !== next && Number(next) == next) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if (null == c || Number(c) != c) {
            --i;
            break;
          }
          if (i === str.length)
            break;
        }
        p.id = Number(str.substring(start, i + 1));
      }
      if (str.charAt(++i)) {
        const payload = this.tryParse(str.substr(i));
        if (_Decoder.isPayloadValid(p.type, payload)) {
          p.data = payload;
        } else {
          throw new Error("invalid payload");
        }
      }
      return p;
    }
    tryParse(str) {
      try {
        return JSON.parse(str, this.reviver);
      } catch (e) {
        return false;
      }
    }
    static isPayloadValid(type, payload) {
      switch (type) {
        case PacketType.CONNECT:
          return isObject(payload);
        case PacketType.DISCONNECT:
          return payload === void 0;
        case PacketType.CONNECT_ERROR:
          return typeof payload === "string" || isObject(payload);
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          return Array.isArray(payload);
      }
    }
    /**
     * Deallocates a parser's resources
     */
    destroy() {
      if (this.reconstructor) {
        this.reconstructor.finishedReconstruction();
        this.reconstructor = null;
      }
    }
  };
  var BinaryReconstructor = class {
    constructor(packet) {
      this.packet = packet;
      this.buffers = [];
      this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */
    takeBinaryData(binData) {
      this.buffers.push(binData);
      if (this.buffers.length === this.reconPack.attachments) {
        const packet = reconstructPacket(this.reconPack, this.buffers);
        this.finishedReconstruction();
        return packet;
      }
      return null;
    }
    /**
     * Cleans up binary packet reconstruction variables.
     */
    finishedReconstruction() {
      this.reconPack = null;
      this.buffers = [];
    }
  };

  // node_modules/socket.io-client/build/esm/on.js
  function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
      obj.off(ev, fn);
    };
  }

  // node_modules/socket.io-client/build/esm/socket.js
  var RESERVED_EVENTS2 = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1
  });
  var Socket2 = class extends Emitter {
    /**
     * `Socket` constructor.
     */
    constructor(io, nsp, opts) {
      super();
      this.connected = false;
      this.recovered = false;
      this.receiveBuffer = [];
      this.sendBuffer = [];
      this._queue = [];
      this._queueSeq = 0;
      this.ids = 0;
      this.acks = {};
      this.flags = {};
      this.io = io;
      this.nsp = nsp;
      if (opts && opts.auth) {
        this.auth = opts.auth;
      }
      this._opts = Object.assign({}, opts);
      if (this.io._autoConnect)
        this.open();
    }
    /**
     * Whether the socket is currently disconnected
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.disconnected); // false
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.disconnected); // true
     * });
     */
    get disconnected() {
      return !this.connected;
    }
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    subEvents() {
      if (this.subs)
        return;
      const io = this.io;
      this.subs = [
        on(io, "open", this.onopen.bind(this)),
        on(io, "packet", this.onpacket.bind(this)),
        on(io, "error", this.onerror.bind(this)),
        on(io, "close", this.onclose.bind(this))
      ];
    }
    /**
     * Whether the Socket will try to reconnect when its Manager connects or reconnects.
     *
     * @example
     * const socket = io();
     *
     * console.log(socket.active); // true
     *
     * socket.on("disconnect", (reason) => {
     *   if (reason === "io server disconnect") {
     *     // the disconnection was initiated by the server, you need to manually reconnect
     *     console.log(socket.active); // false
     *   }
     *   // else the socket will automatically try to reconnect
     *   console.log(socket.active); // true
     * });
     */
    get active() {
      return !!this.subs;
    }
    /**
     * "Opens" the socket.
     *
     * @example
     * const socket = io({
     *   autoConnect: false
     * });
     *
     * socket.connect();
     */
    connect() {
      if (this.connected)
        return this;
      this.subEvents();
      if (!this.io["_reconnecting"])
        this.io.open();
      if ("open" === this.io._readyState)
        this.onopen();
      return this;
    }
    /**
     * Alias for {@link connect()}.
     */
    open() {
      return this.connect();
    }
    /**
     * Sends a `message` event.
     *
     * This method mimics the WebSocket.send() method.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
     *
     * @example
     * socket.send("hello");
     *
     * // this is equivalent to
     * socket.emit("message", "hello");
     *
     * @return self
     */
    send(...args) {
      args.unshift("message");
      this.emit.apply(this, args);
      return this;
    }
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @example
     * socket.emit("hello", "world");
     *
     * // all serializable datastructures are supported (no need to call JSON.stringify)
     * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
     *
     * // with an acknowledgement from the server
     * socket.emit("hello", "world", (val) => {
     *   // ...
     * });
     *
     * @return self
     */
    emit(ev, ...args) {
      var _a, _b, _c;
      if (RESERVED_EVENTS2.hasOwnProperty(ev)) {
        throw new Error('"' + ev.toString() + '" is a reserved event name');
      }
      args.unshift(ev);
      if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
        this._addToQueue(args);
        return this;
      }
      const packet = {
        type: PacketType.EVENT,
        data: args
      };
      packet.options = {};
      packet.options.compress = this.flags.compress !== false;
      if ("function" === typeof args[args.length - 1]) {
        const id = this.ids++;
        const ack = args.pop();
        this._registerAckCallback(id, ack);
        packet.id = id;
      }
      const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
      const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
      const discardPacket = this.flags.volatile && !isTransportWritable;
      if (discardPacket) {
      } else if (isConnected) {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      } else {
        this.sendBuffer.push(packet);
      }
      this.flags = {};
      return this;
    }
    /**
     * @private
     */
    _registerAckCallback(id, ack) {
      var _a;
      const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
      if (timeout === void 0) {
        this.acks[id] = ack;
        return;
      }
      const timer = this.io.setTimeoutFn(() => {
        delete this.acks[id];
        for (let i = 0; i < this.sendBuffer.length; i++) {
          if (this.sendBuffer[i].id === id) {
            this.sendBuffer.splice(i, 1);
          }
        }
        ack.call(this, new Error("operation has timed out"));
      }, timeout);
      const fn = (...args) => {
        this.io.clearTimeoutFn(timer);
        ack.apply(this, args);
      };
      fn.withError = true;
      this.acks[id] = fn;
    }
    /**
     * Emits an event and waits for an acknowledgement
     *
     * @example
     * // without timeout
     * const response = await socket.emitWithAck("hello", "world");
     *
     * // with a specific timeout
     * try {
     *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
     * } catch (err) {
     *   // the server did not acknowledge the event in the given delay
     * }
     *
     * @return a Promise that will be fulfilled when the server acknowledges the event
     */
    emitWithAck(ev, ...args) {
      return new Promise((resolve, reject) => {
        const fn = (arg1, arg2) => {
          return arg1 ? reject(arg1) : resolve(arg2);
        };
        fn.withError = true;
        args.push(fn);
        this.emit(ev, ...args);
      });
    }
    /**
     * Add the packet to the queue.
     * @param args
     * @private
     */
    _addToQueue(args) {
      let ack;
      if (typeof args[args.length - 1] === "function") {
        ack = args.pop();
      }
      const packet = {
        id: this._queueSeq++,
        tryCount: 0,
        pending: false,
        args,
        flags: Object.assign({ fromQueue: true }, this.flags)
      };
      args.push((err, ...responseArgs) => {
        if (packet !== this._queue[0]) {
          return;
        }
        const hasError = err !== null;
        if (hasError) {
          if (packet.tryCount > this._opts.retries) {
            this._queue.shift();
            if (ack) {
              ack(err);
            }
          }
        } else {
          this._queue.shift();
          if (ack) {
            ack(null, ...responseArgs);
          }
        }
        packet.pending = false;
        return this._drainQueue();
      });
      this._queue.push(packet);
      this._drainQueue();
    }
    /**
     * Send the first packet of the queue, and wait for an acknowledgement from the server.
     * @param force - whether to resend a packet that has not been acknowledged yet
     *
     * @private
     */
    _drainQueue(force = false) {
      if (!this.connected || this._queue.length === 0) {
        return;
      }
      const packet = this._queue[0];
      if (packet.pending && !force) {
        return;
      }
      packet.pending = true;
      packet.tryCount++;
      this.flags = packet.flags;
      this.emit.apply(this, packet.args);
    }
    /**
     * Sends a packet.
     *
     * @param packet
     * @private
     */
    packet(packet) {
      packet.nsp = this.nsp;
      this.io._packet(packet);
    }
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    onopen() {
      if (typeof this.auth == "function") {
        this.auth((data) => {
          this._sendConnectPacket(data);
        });
      } else {
        this._sendConnectPacket(this.auth);
      }
    }
    /**
     * Sends a CONNECT packet to initiate the Socket.IO session.
     *
     * @param data
     * @private
     */
    _sendConnectPacket(data) {
      this.packet({
        type: PacketType.CONNECT,
        data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
      });
    }
    /**
     * Called upon engine or manager `error`.
     *
     * @param err
     * @private
     */
    onerror(err) {
      if (!this.connected) {
        this.emitReserved("connect_error", err);
      }
    }
    /**
     * Called upon engine `close`.
     *
     * @param reason
     * @param description
     * @private
     */
    onclose(reason, description) {
      this.connected = false;
      delete this.id;
      this.emitReserved("disconnect", reason, description);
      this._clearAcks();
    }
    /**
     * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
     * the server.
     *
     * @private
     */
    _clearAcks() {
      Object.keys(this.acks).forEach((id) => {
        const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
        if (!isBuffered) {
          const ack = this.acks[id];
          delete this.acks[id];
          if (ack.withError) {
            ack.call(this, new Error("socket has been disconnected"));
          }
        }
      });
    }
    /**
     * Called with socket packet.
     *
     * @param packet
     * @private
     */
    onpacket(packet) {
      const sameNamespace = packet.nsp === this.nsp;
      if (!sameNamespace)
        return;
      switch (packet.type) {
        case PacketType.CONNECT:
          if (packet.data && packet.data.sid) {
            this.onconnect(packet.data.sid, packet.data.pid);
          } else {
            this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          }
          break;
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          this.onevent(packet);
          break;
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          this.onack(packet);
          break;
        case PacketType.DISCONNECT:
          this.ondisconnect();
          break;
        case PacketType.CONNECT_ERROR:
          this.destroy();
          const err = new Error(packet.data.message);
          err.data = packet.data.data;
          this.emitReserved("connect_error", err);
          break;
      }
    }
    /**
     * Called upon a server event.
     *
     * @param packet
     * @private
     */
    onevent(packet) {
      const args = packet.data || [];
      if (null != packet.id) {
        args.push(this.ack(packet.id));
      }
      if (this.connected) {
        this.emitEvent(args);
      } else {
        this.receiveBuffer.push(Object.freeze(args));
      }
    }
    emitEvent(args) {
      if (this._anyListeners && this._anyListeners.length) {
        const listeners = this._anyListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, args);
        }
      }
      super.emit.apply(this, args);
      if (this._pid && args.length && typeof args[args.length - 1] === "string") {
        this._lastOffset = args[args.length - 1];
      }
    }
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    ack(id) {
      const self2 = this;
      let sent = false;
      return function(...args) {
        if (sent)
          return;
        sent = true;
        self2.packet({
          type: PacketType.ACK,
          id,
          data: args
        });
      };
    }
    /**
     * Called upon a server acknowledgement.
     *
     * @param packet
     * @private
     */
    onack(packet) {
      const ack = this.acks[packet.id];
      if (typeof ack !== "function") {
        return;
      }
      delete this.acks[packet.id];
      if (ack.withError) {
        packet.data.unshift(null);
      }
      ack.apply(this, packet.data);
    }
    /**
     * Called upon server connect.
     *
     * @private
     */
    onconnect(id, pid) {
      this.id = id;
      this.recovered = pid && this._pid === pid;
      this._pid = pid;
      this.connected = true;
      this.emitBuffered();
      this.emitReserved("connect");
      this._drainQueue(true);
    }
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    emitBuffered() {
      this.receiveBuffer.forEach((args) => this.emitEvent(args));
      this.receiveBuffer = [];
      this.sendBuffer.forEach((packet) => {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      });
      this.sendBuffer = [];
    }
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    ondisconnect() {
      this.destroy();
      this.onclose("io server disconnect");
    }
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    destroy() {
      if (this.subs) {
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs = void 0;
      }
      this.io["_destroy"](this);
    }
    /**
     * Disconnects the socket manually. In that case, the socket will not try to reconnect.
     *
     * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
     *
     * @example
     * const socket = io();
     *
     * socket.on("disconnect", (reason) => {
     *   // console.log(reason); prints "io client disconnect"
     * });
     *
     * socket.disconnect();
     *
     * @return self
     */
    disconnect() {
      if (this.connected) {
        this.packet({ type: PacketType.DISCONNECT });
      }
      this.destroy();
      if (this.connected) {
        this.onclose("io client disconnect");
      }
      return this;
    }
    /**
     * Alias for {@link disconnect()}.
     *
     * @return self
     */
    close() {
      return this.disconnect();
    }
    /**
     * Sets the compress flag.
     *
     * @example
     * socket.compress(false).emit("hello");
     *
     * @param compress - if `true`, compresses the sending data
     * @return self
     */
    compress(compress) {
      this.flags.compress = compress;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @example
     * socket.volatile.emit("hello"); // the server may or may not receive it
     *
     * @returns self
     */
    get volatile() {
      this.flags.volatile = true;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
     * given number of milliseconds have elapsed without an acknowledgement from the server:
     *
     * @example
     * socket.timeout(5000).emit("my-event", (err) => {
     *   if (err) {
     *     // the server did not acknowledge the event in the given delay
     *   }
     * });
     *
     * @returns self
     */
    timeout(timeout) {
      this.flags.timeout = timeout;
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @example
     * socket.onAny((event, ...args) => {
     *   console.log(`got ${event}`);
     * });
     *
     * @param listener
     */
    onAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @example
     * socket.prependAny((event, ...args) => {
     *   console.log(`got event ${event}`);
     * });
     *
     * @param listener
     */
    prependAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`got event ${event}`);
     * }
     *
     * socket.onAny(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAny(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAny();
     *
     * @param listener
     */
    offAny(listener) {
      if (!this._anyListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAny() {
      return this._anyListeners || [];
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.onAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    onAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.prependAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    prependAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`sent event ${event}`);
     * }
     *
     * socket.onAnyOutgoing(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAnyOutgoing(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAnyOutgoing();
     *
     * @param [listener] - the catch-all listener (optional)
     */
    offAnyOutgoing(listener) {
      if (!this._anyOutgoingListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyOutgoingListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyOutgoingListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAnyOutgoing() {
      return this._anyOutgoingListeners || [];
    }
    /**
     * Notify the listeners for each packet sent
     *
     * @param packet
     *
     * @private
     */
    notifyOutgoingListeners(packet) {
      if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
        const listeners = this._anyOutgoingListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, packet.data);
        }
      }
    }
  };

  // node_modules/socket.io-client/build/esm/contrib/backo2.js
  function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 1e4;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }
  Backoff.prototype.duration = function() {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);
    if (this.jitter) {
      var rand = Math.random();
      var deviation = Math.floor(rand * this.jitter * ms);
      ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }
    return Math.min(ms, this.max) | 0;
  };
  Backoff.prototype.reset = function() {
    this.attempts = 0;
  };
  Backoff.prototype.setMin = function(min) {
    this.ms = min;
  };
  Backoff.prototype.setMax = function(max) {
    this.max = max;
  };
  Backoff.prototype.setJitter = function(jitter) {
    this.jitter = jitter;
  };

  // node_modules/socket.io-client/build/esm/manager.js
  var Manager = class extends Emitter {
    constructor(uri, opts) {
      var _a;
      super();
      this.nsps = {};
      this.subs = [];
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = void 0;
      }
      opts = opts || {};
      opts.path = opts.path || "/socket.io";
      this.opts = opts;
      installTimerFunctions(this, opts);
      this.reconnection(opts.reconnection !== false);
      this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
      this.reconnectionDelay(opts.reconnectionDelay || 1e3);
      this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
      this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
      this.backoff = new Backoff({
        min: this.reconnectionDelay(),
        max: this.reconnectionDelayMax(),
        jitter: this.randomizationFactor()
      });
      this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
      this._readyState = "closed";
      this.uri = uri;
      const _parser = opts.parser || esm_exports;
      this.encoder = new _parser.Encoder();
      this.decoder = new _parser.Decoder();
      this._autoConnect = opts.autoConnect !== false;
      if (this._autoConnect)
        this.open();
    }
    reconnection(v) {
      if (!arguments.length)
        return this._reconnection;
      this._reconnection = !!v;
      if (!v) {
        this.skipReconnect = true;
      }
      return this;
    }
    reconnectionAttempts(v) {
      if (v === void 0)
        return this._reconnectionAttempts;
      this._reconnectionAttempts = v;
      return this;
    }
    reconnectionDelay(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelay;
      this._reconnectionDelay = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
      return this;
    }
    randomizationFactor(v) {
      var _a;
      if (v === void 0)
        return this._randomizationFactor;
      this._randomizationFactor = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
      return this;
    }
    reconnectionDelayMax(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelayMax;
      this._reconnectionDelayMax = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
      return this;
    }
    timeout(v) {
      if (!arguments.length)
        return this._timeout;
      this._timeout = v;
      return this;
    }
    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @private
     */
    maybeReconnectOnOpen() {
      if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
        this.reconnect();
      }
    }
    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} fn - optional, callback
     * @return self
     * @public
     */
    open(fn) {
      if (~this._readyState.indexOf("open"))
        return this;
      this.engine = new Socket(this.uri, this.opts);
      const socket = this.engine;
      const self2 = this;
      this._readyState = "opening";
      this.skipReconnect = false;
      const openSubDestroy = on(socket, "open", function() {
        self2.onopen();
        fn && fn();
      });
      const onError = (err) => {
        this.cleanup();
        this._readyState = "closed";
        this.emitReserved("error", err);
        if (fn) {
          fn(err);
        } else {
          this.maybeReconnectOnOpen();
        }
      };
      const errorSub = on(socket, "error", onError);
      if (false !== this._timeout) {
        const timeout = this._timeout;
        const timer = this.setTimeoutFn(() => {
          openSubDestroy();
          onError(new Error("timeout"));
          socket.close();
        }, timeout);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
      this.subs.push(openSubDestroy);
      this.subs.push(errorSub);
      return this;
    }
    /**
     * Alias for open()
     *
     * @return self
     * @public
     */
    connect(fn) {
      return this.open(fn);
    }
    /**
     * Called upon transport open.
     *
     * @private
     */
    onopen() {
      this.cleanup();
      this._readyState = "open";
      this.emitReserved("open");
      const socket = this.engine;
      this.subs.push(
        on(socket, "ping", this.onping.bind(this)),
        on(socket, "data", this.ondata.bind(this)),
        on(socket, "error", this.onerror.bind(this)),
        on(socket, "close", this.onclose.bind(this)),
        // @ts-ignore
        on(this.decoder, "decoded", this.ondecoded.bind(this))
      );
    }
    /**
     * Called upon a ping.
     *
     * @private
     */
    onping() {
      this.emitReserved("ping");
    }
    /**
     * Called with data.
     *
     * @private
     */
    ondata(data) {
      try {
        this.decoder.add(data);
      } catch (e) {
        this.onclose("parse error", e);
      }
    }
    /**
     * Called when parser fully decodes a packet.
     *
     * @private
     */
    ondecoded(packet) {
      nextTick(() => {
        this.emitReserved("packet", packet);
      }, this.setTimeoutFn);
    }
    /**
     * Called upon socket error.
     *
     * @private
     */
    onerror(err) {
      this.emitReserved("error", err);
    }
    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @public
     */
    socket(nsp, opts) {
      let socket = this.nsps[nsp];
      if (!socket) {
        socket = new Socket2(this, nsp, opts);
        this.nsps[nsp] = socket;
      } else if (this._autoConnect && !socket.active) {
        socket.connect();
      }
      return socket;
    }
    /**
     * Called upon a socket close.
     *
     * @param socket
     * @private
     */
    _destroy(socket) {
      const nsps = Object.keys(this.nsps);
      for (const nsp of nsps) {
        const socket2 = this.nsps[nsp];
        if (socket2.active) {
          return;
        }
      }
      this._close();
    }
    /**
     * Writes a packet.
     *
     * @param packet
     * @private
     */
    _packet(packet) {
      const encodedPackets = this.encoder.encode(packet);
      for (let i = 0; i < encodedPackets.length; i++) {
        this.engine.write(encodedPackets[i], packet.options);
      }
    }
    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @private
     */
    cleanup() {
      this.subs.forEach((subDestroy) => subDestroy());
      this.subs.length = 0;
      this.decoder.destroy();
    }
    /**
     * Close the current socket.
     *
     * @private
     */
    _close() {
      this.skipReconnect = true;
      this._reconnecting = false;
      this.onclose("forced close");
    }
    /**
     * Alias for close()
     *
     * @private
     */
    disconnect() {
      return this._close();
    }
    /**
     * Called when:
     *
     * - the low-level engine is closed
     * - the parser encountered a badly formatted packet
     * - all sockets are disconnected
     *
     * @private
     */
    onclose(reason, description) {
      var _a;
      this.cleanup();
      (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
      this.backoff.reset();
      this._readyState = "closed";
      this.emitReserved("close", reason, description);
      if (this._reconnection && !this.skipReconnect) {
        this.reconnect();
      }
    }
    /**
     * Attempt a reconnection.
     *
     * @private
     */
    reconnect() {
      if (this._reconnecting || this.skipReconnect)
        return this;
      const self2 = this;
      if (this.backoff.attempts >= this._reconnectionAttempts) {
        this.backoff.reset();
        this.emitReserved("reconnect_failed");
        this._reconnecting = false;
      } else {
        const delay = this.backoff.duration();
        this._reconnecting = true;
        const timer = this.setTimeoutFn(() => {
          if (self2.skipReconnect)
            return;
          this.emitReserved("reconnect_attempt", self2.backoff.attempts);
          if (self2.skipReconnect)
            return;
          self2.open((err) => {
            if (err) {
              self2._reconnecting = false;
              self2.reconnect();
              this.emitReserved("reconnect_error", err);
            } else {
              self2.onreconnect();
            }
          });
        }, delay);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
    }
    /**
     * Called upon successful reconnect.
     *
     * @private
     */
    onreconnect() {
      const attempt = this.backoff.attempts;
      this._reconnecting = false;
      this.backoff.reset();
      this.emitReserved("reconnect", attempt);
    }
  };

  // node_modules/socket.io-client/build/esm/index.js
  var cache = {};
  function lookup2(uri, opts) {
    if (typeof uri === "object") {
      opts = uri;
      uri = void 0;
    }
    opts = opts || {};
    const parsed = url(uri, opts.path || "/socket.io");
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache[id] && path in cache[id]["nsps"];
    const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
    let io;
    if (newConnection) {
      io = new Manager(source, opts);
    } else {
      if (!cache[id]) {
        cache[id] = new Manager(source, opts);
      }
      io = cache[id];
    }
    if (parsed.query && !opts.query) {
      opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
  }
  Object.assign(lookup2, {
    Manager,
    Socket: Socket2,
    io: lookup2,
    connect: lookup2
  });

  // scripts/services/SocketService.ts
  var SocketService = class _SocketService {
    constructor() {
      this.socket = null;
    }
    static getInstance() {
      if (!_SocketService.instance) {
        _SocketService.instance = new _SocketService();
      }
      return _SocketService.instance;
    }
    connect() {
      if (!this.socket) {
        this.socket = lookup2("/", {
          path: "/socket.io/"
          // auth: { token }
        });
        console.log("SocketService: Connected");
      }
    }
    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    }
  };
  var SocketService_default = SocketService;

  // scripts/components/Data.ts
  var globalPath = "/assets/emoticons/";
  var animationPath = "/assets/animated/";
  var statusImages = {
    "available": "/assets/basic/status_online_small.png",
    "online": "/assets/basic/status_online_small.png",
    "busy": "/assets/basic/status_busy_small.png",
    "away": "/assets/basic/status_away_small.png",
    "invisible": "/assets/basic/status_offline_small.png",
    "offline": "/assets/basic/status_offline_small.png"
  };
  var statusLabels = {
    "available": "(Available)",
    "busy": "(Busy)",
    "away": "(Away)",
    "invisible": "(Appear offline)"
  };
  var getStatusDot = (status) => {
    switch (status) {
      case "available":
        return "/assets/friends/online-dot.png";
      case "busy":
        return "/assets/friends/busy-dot.png";
      case "away":
        return "/assets/friends/away-dot.png";
      default:
        return "/assets/friends/offline-dot.png";
    }
  };
  var animations = {
    "(boucy_ball)": animationPath + "bouncy_ball.gif",
    "(bow)": animationPath + "bow.gif",
    "(crying)": animationPath + "crying.gif",
    "(dancer)": animationPath + "dancer.gif",
    "(dancing_pig)": animationPath + "dancing_pig.gif",
    "(frog)": animationPath + "frog.gif",
    "(guitar_smash)": animationPath + "guitar_smash.gif",
    "(heart)": animationPath + "heart.gif",
    "(kiss)": animationPath + "kiss.gif",
    "(knock)": animationPath + "knock.gif",
    "(silly_face)": animationPath + "silly_face.gif",
    "(ufo)": animationPath + "ufo.gif",
    "(water_balloon)": animationPath + "water_balloon.gif"
  };
  var icons = {
    "(boucy_ball)": animationPath + "bouncy_ball.png",
    "(bow)": animationPath + "bow.jpg",
    "(crying)": animationPath + "crying.png",
    "(dancer)": animationPath + "dancer.png",
    "(dancing_pig)": animationPath + "dancing_pig.png",
    "(frog)": animationPath + "frog.png",
    "(guitar_smash)": animationPath + "guitar_smash.png",
    "(heart)": animationPath + "heart.png",
    "(kiss)": animationPath + "kiss.png",
    "(knock)": animationPath + "knock.png",
    "(silly_face)": animationPath + "silly_face.png",
    "(ufo)": animationPath + "ufo.png",
    "(water_balloon)": animationPath + "water_balloon.png"
  };
  var emoticons = {};
  function alias(keys, file) {
    keys.forEach((k) => emoticons[k] = globalPath + file);
  }
  Object.assign(emoticons, {
    ":-)": globalPath + "smile.gif",
    ":-O": globalPath + "surprised.gif",
    ";-)": globalPath + "wink_smile.gif",
    ":-S": globalPath + "confused.gif",
    ":'(": globalPath + "crying.gif",
    ":-#": globalPath + "silence.gif",
    "8-|": globalPath + "nerd.gif",
    ":-*": globalPath + "secret.gif",
    ":^)": globalPath + "unknow.gif",
    "|-)": globalPath + "sleepy.gif",
    "({)": globalPath + "guy_hug.gif",
    ":-[": globalPath + "bat.gif",
    "(@)": globalPath + "cat.gif",
    "(8)": globalPath + "note.gif",
    "(*)": globalPath + "star.gif",
    "(sn)": globalPath + "snail.gif",
    "(pl)": globalPath + "plate.gif",
    "(pi)": globalPath + "pizza.gif",
    "(au)": globalPath + "car.gif",
    "(um)": globalPath + "umbrella.gif",
    "(co)": globalPath + "computer.gif",
    "(st)": globalPath + "storm.gif",
    "(mo)": globalPath + "money.gif",
    "8o|": globalPath + "teeth.gif",
    "^o)": globalPath + "sarcastic.gif",
    "+o(": globalPath + "sick.gif",
    "*-)": globalPath + "thinking.gif",
    "8-)": globalPath + "eye_roll.gif",
    "(6)": globalPath + "devil_smile.gif",
    "(bah)": globalPath + "sheep.gif",
    "(||)": globalPath + "bowl.gif",
    "(so)": globalPath + "soccer.gif",
    "(ap)": globalPath + "airplane.gif",
    "(ip)": globalPath + "island.gif",
    "(mp)": globalPath + "portable.gif",
    "(li)": globalPath + "lightning.gif"
  });
  alias([":)", ":-)"], "smile.gif");
  alias([":o", ":-O"], "surprised.gif");
  alias([";)", ";-)"], "wink_smile.gif");
  alias([":s", ":-S"], "confused.gif");
  alias(["(H)", "(h)"], "hot.gif");
  alias(["(A)", "(a)"], "angel.gif");
  alias([":[", ":-["], "bat.gif");
  alias(["(L)", "(l)"], "heart.gif");
  alias(["(K)", "(k)"], "kiss.gif");
  alias(["(F)", "(f)"], "rose.gif");
  alias(["(P)", "(p)"], "camera.gif");
  alias(["(T)", "(t)"], "phone.gif");
  alias(["(O)", "(o)"], "clock.gif");
  alias([":D", ":-D"], "teeth_smile.gif");
  alias([":p", ":-P"], "tongue_smile.gif");
  alias([":(", ":-("], "sad.gif");
  alias([":|", ":-|"], "disappointed.gif");
  alias([":$", ":-$"], "embarrassed.gif");
  alias([":@", ":-@"], "angry.gif");
  alias(["(C)", "(c)"], "coffee.gif");
  alias(["(N)", "(n)"], "thumbs_down.gif");
  alias(["(D)", "(d)"], "martini.gif");
  alias(["(Z)", "(z)"], "guy.gif");
  alias(["(})", "({)"], "guy_hug.gif");
  alias(["(U)", "(u)"], "broken_heart.gif");
  alias(["(G)", "(g)"], "present.gif");
  alias(["(W)", "(w)"], "wilted_rose.gif");
  alias(["(E)", "(e)"], "email.gif");
  alias(["(I)", "(i)"], "lightbulb.gif");
  alias(["(M)", "(m)"], "messenger.gif");
  alias(["(Y)", "(y)"], "thumbs_up.gif");
  alias(["(B)", "(b)"], "beer_mug.gif");
  alias(["(X)", "(x)"], "girl.gif");

  // scripts/pages/api.ts
  async function fetchWithAuth(url2, options = {}) {
    const token = localStorage.getItem("accessToken");
    const getHeaders = (currentToken) => {
      const headers = new Headers(options.headers || {});
      if (!headers.has("Content-Type") && options.body) {
        headers.set("Content-Type", "application/json");
      }
      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }
      return headers;
    };
    let response = await fetch(url2, {
      ...options,
      headers: getHeaders(token)
    });
    if (response.status === 401) {
      console.warn("Token expired (401). Atempt to refresh...");
      try {
        const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.access_token;
          console.log("\u2705 Token refreshed with succeed !");
          localStorage.setItem("accessToken", newToken);
          response = await fetch(url2, {
            ...options,
            headers: getHeaders(newToken)
            // on utilise le nouveau token
          });
        } else {
          console.error("Refresh impossible. Deconnection.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userId");
          window.history.pushState({}, "", "/login");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      } catch (err) {
        console.error("Network error during the refresh of the token", err);
      }
    }
    return response;
  }

  // scripts/components/FriendList.ts
  var FriendList = class {
    constructor() {
      this.container = document.getElementById("contacts-list");
      this.userId = localStorage.getItem("userId");
    }
    init() {
      this.loadFriends();
      this.setupFriendRequests();
      this.setupNotifications();
      this.listenToUpdates();
    }
    async loadFriends() {
      const contactsList = this.container;
      if (!this.userId || !contactsList) return;
      try {
        const response = await fetchWithAuth(`/api/users/${this.userId}/friends`);
        if (!response.ok) throw new Error("Failed to fetch friends");
        const responseData = await response.json();
        const friendList = responseData.data;
        contactsList.innerHTML = "";
        if (!friendList || friendList.length === 0) {
          contactsList.innerHTML = '<div class="text-xs text-gray-500 ml-2">No friend yet</div>';
          return;
        }
        friendList.forEach((friend) => {
          const friendItem = document.createElement("div");
          friendItem.className = "friend-item flex items-center gap-3 p-2 rounded-sm hover:bg-gray-100 cursor-pointer transition";
          const status = friend.status || "invisible";
          friendItem.dataset.id = friend.id;
          friendItem.dataset.username = friend.alias;
          friendItem.dataset.status = status;
          friendItem.dataset.bio = friend.bio || "Share a quick message";
          friendItem.dataset.avatar = friend.avatar_url || friend.avatar || "/assets/basic/default.png";
          friendItem.innerHTML = `
                    <div class="relative w-[50px] h-[50px] flex-shrink-0">
                        <img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] object-cover"
                             src="${getStatusDot(status)}" alt="status">
                    </div>
                    <div class="flex flex-col leading-tight">
                        <span class="font-semibold text-sm text-gray-800">${friend.alias}</span>
                    </div>
                `;
          contactsList.appendChild(friendItem);
          friendItem.addEventListener("click", () => {
            const event = new CustomEvent("friendSelected", { detail: friend });
            window.dispatchEvent(event);
          });
        });
      } catch (error) {
        console.error("Error loading friends:", error);
        contactsList.innerHTML = '<div class="text-xs text-red-400 ml-2">Error loading contacts</div>';
      }
    }
    setupFriendRequests() {
      const addFriendButton = document.getElementById("add-friend-button");
      const addFriendDropdown = document.getElementById("add-friend-dropdown");
      const friendSearchInput = document.getElementById("friend-search-input");
      const sendFriendRequestBtn = document.getElementById("send-friend-request");
      const cancelFriendRequestBtn = document.getElementById("cancel-friend-request");
      const friendRequestMessage = document.getElementById("friend-request-message");
      if (addFriendButton && addFriendDropdown && friendSearchInput && sendFriendRequestBtn && cancelFriendRequestBtn) {
        addFriendButton.addEventListener("click", (e) => {
          e.stopPropagation();
          addFriendDropdown.classList.toggle("hidden");
          document.getElementById("status-dropdown")?.classList.add("hidden");
          if (!addFriendDropdown.classList.contains("hidden")) {
            friendSearchInput.focus();
          }
        });
        const sendFriendRequest = async () => {
          const searchValue = friendSearchInput.value.trim();
          if (!searchValue) {
            this.showFriendMessage("Please enter a username or email", "error", friendRequestMessage);
            return;
          }
          const userId = localStorage.getItem("userId");
          try {
            const response = await fetchWithAuth(`/api/users/${userId}/friendships`, {
              // on lance la requete sur cette route
              method: "POST",
              // post pour creer la demande
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ alias: searchValue })
            });
            const data = await response.json();
            if (response.ok) {
              this.showFriendMessage("Friend request sent!", "success", friendRequestMessage);
              friendSearchInput.value = "";
              setTimeout(() => {
                addFriendDropdown.classList.add("hidden");
                friendRequestMessage?.classList.add("hidden");
              }, 1500);
            } else {
              this.showFriendMessage(data.message || "Error sending request", "error", friendRequestMessage);
            }
          } catch (error) {
            console.error("Error:", error);
            this.showFriendMessage("Network error", "error", friendRequestMessage);
          }
        };
        sendFriendRequestBtn.addEventListener("click", sendFriendRequest);
        friendSearchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            sendFriendRequest();
          }
        });
        cancelFriendRequestBtn.addEventListener("click", () => {
          addFriendDropdown.classList.add("hidden");
          friendSearchInput.value = "";
          friendRequestMessage?.classList.add("hidden");
        });
        document.addEventListener("click", (e) => {
          const target = e.target;
          if (!addFriendDropdown.contains(target) && !addFriendButton.contains(target)) {
            addFriendDropdown.classList.add("hidden");
            friendRequestMessage?.classList.add("hidden");
          }
        });
      }
    }
    // affichage pour l'utilisateur
    showFriendMessage(message, type, element) {
      if (element) {
        element.textContent = message;
        element.classList.remove("hidden", "text-green-600", "text-red-600");
        element.classList.add(type === "success" ? "text-green-600" : "text-red-600");
      }
    }
    setupNotifications() {
      const notifButton = document.getElementById("notification-button");
      const notifDropdown = document.getElementById("notification-dropdown");
      const notifList = document.getElementById("notification-list");
      if (notifButton && notifDropdown && notifList) {
        const handleRequest = async (askerId, action, itemDiv) => {
          const userId = localStorage.getItem("userId");
          try {
            const response = await fetchWithAuth(`/api/users/${userId}/friendships/${itemDiv.dataset.friendshipId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: askerId, status: action })
            });
            if (response.ok) {
              itemDiv.style.opacity = "0";
              setTimeout(() => {
                itemDiv.remove();
                if (action === "validated") this.loadFriends();
                checkNotifications();
              }, 300);
            } else {
              console.error("Failed to update request");
            }
          } catch (error) {
            console.error("Network error", error);
          }
        };
        const checkNotifications = async () => {
          const userId = localStorage.getItem("userId");
          if (!userId) return;
          try {
            const response = await fetchWithAuth(`/api/users/${userId}/friendships/pendings`);
            if (!response.ok) throw new Error("Failed to fetch friends");
            const requests = await response.json();
            const pendingList = requests.data;
            const notifIcon = document.getElementById("notification-icon");
            if (pendingList.length > 0) {
              if (notifIcon) notifIcon.src = "/assets/basic/notification.png";
            } else {
              if (notifIcon) notifIcon.src = "/assets/basic/no_notification.png";
            }
            notifList.innerHTML = "";
            if (pendingList.length === 0) {
              notifList.innerHTML = '<div class="p-4 text-center text-xs text-gray-500">No new notifications</div>';
              return;
            }
            pendingList.forEach((req) => {
              const item = document.createElement("div");
              item.dataset.friendshipId = req.friendshipId;
              item.className = "flex items-center p-3 border-b border-gray-100 gap-3 hover:bg-gray-50 transition";
              item.innerHTML = `
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-semibold truncate">${req.alias}</p>
                                <p class="text-xs text-gray-500">Wants to be your friend</p>
                            </div>
                            <div class="flex gap-1">
                                <button class="btn-accept bg-blue-500 text-gray-600 p-1.5 rounded hover:bg-blue-600 transition" title="Accept">\u2713</button>
                                <button class="btn-reject bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300 transition" title="Decline">\u2715</button>
                                <button class="btn-block bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300 transition" title="Block">\u{1F6AB}</button>
                            </div>
                        `;
              const buttonAccept = item.querySelector(".btn-accept");
              const buttonReject = item.querySelector(".btn-reject");
              const buttonBlock = item.querySelector(".btn-block");
              buttonAccept?.addEventListener("click", (e) => {
                e.stopPropagation();
                handleRequest(req.id, "validated", item);
              });
              buttonReject?.addEventListener("click", (e) => {
                e.stopPropagation();
                handleRequest(req.id, "rejected", item);
              });
              buttonBlock?.addEventListener("click", (e) => {
                e.stopPropagation();
                handleRequest(req.id, "blocked", item);
              });
              notifList.appendChild(item);
            });
          } catch (error) {
            console.error("Error fetching notifications:", error);
          }
        };
        notifButton.addEventListener("click", (e) => {
          e.stopPropagation();
          notifDropdown.classList.toggle("hidden");
          document.getElementById("add-friend-dropdown")?.classList.add("hidden");
          if (!notifDropdown.classList.contains("hidden")) {
            checkNotifications();
          }
        });
        document.addEventListener("click", (e) => {
          if (!notifDropdown.contains(e.target) && !notifButton.contains(e.target))
            notifDropdown.classList.add("hidden");
        });
        checkNotifications();
        setInterval(checkNotifications, 3e4);
      }
    }
    listenToUpdates() {
      const socket = SocketService_default.getInstance().socket;
      if (!socket) return;
      socket.on("friendStatusUpdate", (data) => {
        console.log(`Status update for ${data.username}: ${data.status}`);
        this.updateFriendUI(data.username, data.status);
      });
      socket.on("userConnected", (data) => {
        const currentUsername = localStorage.getItem("username");
        if (data.username !== currentUsername) {
          this.updateFriendUI(data.username, data.status);
        }
      });
    }
    updateFriendUI(username, newStatus) {
      const friendItems = document.querySelectorAll(".friend-item");
      friendItems.forEach((item) => {
        const el = item;
        if (el.dataset.username === username) {
          el.dataset.status = newStatus;
          const statusImg = el.querySelector('img[alt="status"]');
          if (statusImg) {
            statusImg.src = getStatusDot(newStatus);
          }
        }
      });
    }
  };

  // scripts/components/ChatUtils.ts
  var escapeHTML = (text) => {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };
  var escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
  var parseMessage = (message) => {
    let formattedMessage = escapeHTML(message);
    const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);
    sortedKeys.forEach((key) => {
      const imgUrl = emoticons[key];
      const escapedKey = escapeRegex(escapeHTML(key));
      const regex = new RegExp(escapedKey, "g");
      formattedMessage = formattedMessage.replace(
        regex,
        `<img src="${imgUrl}" alt="${key}" class="inline-block w-[20px] h-[20px] align-middle mx-0.5" />`
      );
    });
    formattedMessage = formattedMessage.replace(/\[b\](.*?)\[\/b\]/g, "<strong>$1</strong>").replace(/\[i\](.*?)\[\/i\]/g, "<em>$1</em>").replace(/\[u\](.*?)\[\/u\]/g, "<u>$1</u>").replace(/\[s\](.*?)\[\/s\]/g, "<s>$1</s>").replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color:$1">$2</span>');
    return formattedMessage;
  };

  // scripts/components/UserProfile.ts
  var UserProfile = class {
    constructor() {
      this.bioText = document.getElementById("user-bio");
      this.bioWrapper = document.getElementById("bio-wrapper");
      this.statusFrame = document.getElementById("user-status");
      this.statusText = document.getElementById("current-status-text");
      this.userConnected = document.getElementById("user-name");
      this.userProfileImg = document.getElementById("user-profile");
      this.statusSelector = document.getElementById("status-selector");
      this.statusDropdown = document.getElementById("status-dropdown");
      this.charCountElement = document.querySelector("#bio-wrapper .char-count");
    }
    init() {
      this.loadUserData();
      this.setupBioEdit();
      this.setupStatusSelector();
      this.loadSavedStatus();
    }
    // CHARGEMENT DE LA BIO
    async loadUserData() {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("No user ID found");
        return;
      }
      try {
        const response = await fetchWithAuth(`/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user profile");
        const userData = await response.json();
        if (this.userConnected && userData.alias) {
          this.userConnected.textContent = userData.alias;
          localStorage.setItem("username", userData.alias);
        }
        if (this.bioText && userData.bio) {
          this.bioText.dataset.raw = userData.bio;
          this.bioText.innerHTML = parseMessage(userData.bio);
        }
        if (this.userProfileImg) {
          this.userProfileImg.src = userData.avatar_url || userData.avatar;
        }
        if (userData.status) {
          const normalizedStatus = userData.status.toLowerCase();
          this.updateStatusDisplay(normalizedStatus);
          localStorage.setItem("userStatus", normalizedStatus);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
    // LOGIQUE DE LA BIO et de la PHOTO
    setupBioEdit() {
      if (!this.bioText || !this.bioWrapper) return;
      const updateCharCount = (currentLength) => {
        if (this.charCountElement) {
          this.charCountElement.innerText = `${currentLength}/70`;
          if (currentLength > 70) {
            this.charCountElement.classList.remove("text-gray-500");
            this.charCountElement.classList.add("text-red-500");
          } else {
            this.charCountElement.classList.remove("text-red-500");
            this.charCountElement.classList.add("text-gray-500");
          }
        }
      };
      this.bioText.addEventListener("click", () => {
        const input = document.createElement("input");
        const currentText = this.bioText.dataset.raw || "";
        input.type = "text";
        input.value = currentText;
        input.className = "text-sm text-gray-700 italic border border-gray-300 rounded px-2 py-1 w-full bg-white focus:outline-none focus:ring focus:ring-blue-300";
        this.bioWrapper.replaceChild(input, this.bioText);
        if (this.charCountElement) {
          this.charCountElement.classList.remove("hidden");
          updateCharCount(currentText.length);
        }
        input.focus();
        input.addEventListener("input", () => {
          const currentLength = input.value.length;
          updateCharCount(currentLength);
        });
        const finalize = async (text) => {
          if (!this.bioWrapper || !this.bioText) return;
          if (this.charCountElement) {
            this.charCountElement.classList.add("hidden");
          }
          const newBio = text.trim() || "Share a quick message";
          const userId = localStorage.getItem("userId");
          const trimmedBio = newBio.trim();
          if (trimmedBio.length > 70) {
            console.error("Error: Cannot exceed 70 characters.");
            alert(`Your message cannot exceed 70 characters. Stop talking!`);
            this.bioWrapper.replaceChild(this.bioText, input);
            this.bioText.innerHTML = parseMessage(this.bioText.dataset.raw || "Share a quick message");
            return false;
          }
          try {
            const response = await fetchWithAuth(`api/users/${userId}/bio`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bio: trimmedBio })
            });
            if (response.ok) {
              this.bioText.dataset.raw = trimmedBio;
              this.bioText.innerHTML = parseMessage(trimmedBio) || "Share a quick message";
              this.bioWrapper.replaceChild(this.bioText, input);
              console.log("Message updated");
              return true;
            } else {
              console.error("Error while updating your message");
              this.bioWrapper.replaceChild(this.bioText, input);
              return false;
            }
          } catch (error) {
            console.error("Network error:", error);
            this.bioWrapper.replaceChild(this.bioText, input);
            return false;
          }
        };
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") finalize(input.value);
        });
        input.addEventListener("blur", () => {
          if (input.value.trim().length <= 70) {
            finalize(input.value);
          } else {
            alert(`Your message cannot exceed 70 characters. Stop talking!`);
            if (this.charCountElement) {
              this.charCountElement.classList.add("hidden");
            }
            this.bioWrapper.replaceChild(this.bioText, input);
          }
        });
      });
    }
    // LOGIQUE DES STATUS DYNAMIQUES
    setupStatusSelector() {
      if (this.statusSelector && this.statusDropdown) {
        this.statusSelector.addEventListener("click", (e) => {
          e.stopPropagation();
          this.statusDropdown.classList.toggle("hidden");
          document.getElementById("emoticon-dropdown")?.classList.add("hidden");
          document.getElementById("add-friend-dropdown")?.classList.add("hidden");
        });
        const statusOptions = document.querySelectorAll(".status-option");
        statusOptions.forEach((option) => {
          option.addEventListener("click", async (e) => {
            e.stopPropagation();
            const selectedStatus = option.dataset.status;
            if (selectedStatus) {
              this.updateStatusDisplay(selectedStatus);
              localStorage.setItem("userStatus", selectedStatus);
              const userId = localStorage.getItem("userId");
              try {
                await fetchWithAuth(`/api/users/${userId}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: selectedStatus })
                });
              } catch (error) {
                console.error("Error updating status:", error);
              }
            }
            this.statusDropdown.classList.add("hidden");
          });
        });
        document.addEventListener("click", (e) => {
          const target = e.target;
          if (this.statusDropdown && !this.statusDropdown.contains(target) && !this.statusSelector.contains(target)) {
            this.statusDropdown.classList.add("hidden");
          }
        });
      }
    }
    loadSavedStatus() {
      const rawStatus = localStorage.getItem("userStatus") || "available";
      const savedStatus = rawStatus.toLowerCase();
      this.updateStatusDisplay(savedStatus);
      window.addEventListener("storage", (e) => {
        if (e.key === "userStatus" && e.newValue) {
          this.updateStatusDisplay(e.newValue.toLowerCase());
        }
      });
    }
    updateStatusDisplay(status) {
      if (this.statusFrame && statusImages[status]) {
        console.log("Status:", this.statusFrame);
        this.statusFrame.src = statusImages[status];
      }
      if (this.statusText && statusLabels[status]) {
        this.statusText.textContent = statusLabels[status];
      }
      const statusOptions = document.querySelectorAll(".status-option");
      statusOptions.forEach((option) => {
        const opt = option;
        const optionStatus = opt.dataset.status;
        if (optionStatus === status) opt.classList.add("bg-blue-50");
        else opt.classList.remove("bg-blue-50");
      });
    }
  };

  // scripts/components/Chat.ts
  var Chat = class {
    constructor() {
      this.currentChannel = "general";
      this.socket = SocketService_default.getInstance().socket;
      this.messagesContainer = document.getElementById("chat-messages");
      this.messageInput = document.getElementById("chat-input");
      this.wizzContainer = document.getElementById("wizz-container");
    }
    init() {
      if (!this.socket) return;
      this.setupSocketEvents();
      this.setupInputListeners();
      this.setupWizz();
      this.setupTools();
    }
    joinChannel(channelKey) {
      this.currentChannel = channelKey;
      this.socket.emit("joinChannel", channelKey);
      if (this.messagesContainer) {
        this.messagesContainer.innerHTML = "";
      }
    }
    // ---------------------------------------------------
    // ----      MISE EN ÉCOUTE DES SOCKETS           ----
    // ---------------------------------------------------
    setupSocketEvents() {
      this.socket.on("connect", () => {
        this.addMessage("Connected to chat server!", "System");
      });
      this.socket.on("chatMessage", (data) => {
        this.addMessage(data.msg_content, data.sender_alias);
      });
      this.socket.on("msg_history", (data) => {
        if (this.messagesContainer) {
          this.messagesContainer.innerHTML = "";
          if (data.msg_history && data.msg_history.length > 0) {
            data.msg_history.forEach((msg) => {
              this.addMessage(msg.msg_content, msg.sender_alias);
            });
          } else {
            console.log("No former message in this channel");
          }
        }
      });
      this.socket.on("receivedWizz", (data) => {
        this.addMessage(`<strong>${data.author} sent a nudge</strong>`, "System");
        this.shakeElement(this.wizzContainer, 3e3);
      });
      this.socket.on("receivedAnimation", (data) => {
        const { animationKey, author } = data;
        const imgUrl = animations[animationKey];
        if (imgUrl) {
          const animationHTML = `
                    <div>
                        <strong>${author} said:</strong><br>
                        <img src="${imgUrl}" alt="${animationKey}">
                    </div>
                `;
          this.addCustomContent(animationHTML);
        } else {
          this.addMessage(`Animation inconnue (${animationKey}) re\xE7ue de ${author}.`, "Syst\xE8me");
        }
      });
      this.socket.on("disconnected", () => {
        this.addMessage("Disconnected from chat server!", "System");
      });
    }
    // ---------------------------------------------------
    // ----           GESTION DE L'INPUT              ----
    // ---------------------------------------------------
    setupInputListeners() {
      if (!this.messageInput) return;
      this.messageInput.addEventListener("keyup", (event) => {
        if (event.key == "Enter" && this.messageInput?.value.trim() != "") {
          const msg_content = this.messageInput.value;
          const sender_alias = localStorage.getItem("username");
          const sender_id = Number.parseInt(localStorage.getItem("userId") || "0");
          this.socket.emit("chatMessage", {
            sender_id,
            sender_alias,
            channel_key: this.currentChannel,
            msg_content
          });
          this.messageInput.value = "";
        }
      });
    }
    // ---------------------------------------------------
    // ----            LOGIQUE DU WIZZ                ----
    // ---------------------------------------------------
    setupWizz() {
      const wizzButton = document.getElementById("send-wizz");
      if (wizzButton) {
        wizzButton.addEventListener("click", () => {
          const currentUsername = localStorage.getItem("username");
          this.socket.emit("sendWizz", { author: currentUsername });
          this.shakeElement(this.wizzContainer, 500);
        });
      }
    }
    // délcencher la secousse 
    shakeElement(element, duration = 500) {
      if (!element) return;
      if (this.shakeTimeout) clearTimeout(this.shakeTimeout);
      element.classList.remove("wizz-shake");
      void element.offsetWidth;
      element.classList.add("wizz-shake");
      this.shakeTimeout = window.setTimeout(() => {
        element.classList.remove("wizz-shake");
        this.shakeTimeout = void 0;
      }, duration);
      try {
        const wizzSound = new Audio("/assets/chat/wizz_sound.mp3");
        wizzSound.play().catch((e) => console.log("Could not play wizz sound:", e.message));
      } catch (e) {
        console.log("Audio API error:", e.message);
      }
    }
    // ---------------------------------------------------
    // ----         AFFICHAGE DES MESSAGES            ----
    // ---------------------------------------------------
    addMessage(message, author) {
      if (!this.messagesContainer) return;
      const msgElement = document.createElement("p");
      msgElement.className = "mb-1";
      const contentEmoticons = parseMessage(message);
      msgElement.innerHTML = `<strong>${author} said:</strong><br> ${contentEmoticons}`;
      this.messagesContainer.appendChild(msgElement);
      this.scrollToBottom();
    }
    addCustomContent(htmlContent) {
      if (!this.messagesContainer) return;
      const msgElement = document.createElement("div");
      msgElement.className = "mb-1";
      msgElement.innerHTML = htmlContent;
      this.messagesContainer.appendChild(msgElement);
      this.scrollToBottom();
    }
    scrollToBottom() {
      if (this.messagesContainer) {
        setTimeout(() => {
          if (this.messagesContainer)
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 50);
      }
    }
    // ---------------------------------------------------
    // ----      OUTILS (EMOTICONES, FONTS...)        ----
    // ---------------------------------------------------
    setupTools() {
      const emoticonButton = document.getElementById("select-emoticon");
      const emoticonDropdown = document.getElementById("emoticon-dropdown");
      const emoticonGrid = document.getElementById("emoticon-grid");
      if (emoticonButton && emoticonDropdown && emoticonGrid) {
        emoticonGrid.innerHTML = "";
        const emoticonsByUrl = /* @__PURE__ */ new Map();
        const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);
        sortedKeys.forEach((key) => {
          const imgUrl = emoticons[key];
          if (!emoticonsByUrl.has(imgUrl)) emoticonsByUrl.set(imgUrl, []);
          emoticonsByUrl.get(imgUrl).push(key);
        });
        emoticonsByUrl.forEach((keys, imgUrl) => {
          const primaryKey = keys[0];
          const tooltipTitle = keys.join(" | ");
          const emoticonItem = document.createElement("div");
          emoticonItem.className = "cursor-pointer w-7 h-7 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100";
          emoticonItem.innerHTML = `<img src="${imgUrl}" alt="${primaryKey}" title="${tooltipTitle}" class="w-[20px] h-[20px]">`;
          emoticonItem.addEventListener("click", (event) => {
            event.stopPropagation();
            this.insertText(primaryKey + " ");
            emoticonDropdown.classList.add("hidden");
          });
          emoticonGrid.appendChild(emoticonItem);
        });
        emoticonButton.addEventListener("click", (e) => {
          e.stopPropagation();
          emoticonDropdown.classList.toggle("hidden");
          this.closeOtherMenus("emoticon");
        });
        document.addEventListener("click", (e) => {
          if (!emoticonDropdown.contains(e.target) && !emoticonButton.contains(e.target)) {
            emoticonDropdown.classList.add("hidden");
          }
        });
      }
      const animationButton = document.getElementById("select-animation");
      const animationDropdown = document.getElementById("animation-dropdown");
      const animationGrid = document.getElementById("animation-grid");
      if (animationButton && animationDropdown && animationGrid) {
        animationGrid.innerHTML = "";
        Object.keys(icons).forEach((key) => {
          const imgUrl = icons[key];
          const animationItem = document.createElement("div");
          animationItem.className = "cursor-pointer-w10 h-10 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100";
          animationItem.innerHTML = `<img src="${imgUrl}" alt="${key}" title="${key}" class="w-[32px] h-[32px] object-contain">`;
          animationItem.addEventListener("click", (event) => {
            event.stopPropagation();
            const currentUsername = localStorage.getItem("username");
            this.socket.emit("sendAnimation", {
              animationKey: key,
              author: currentUsername
            });
            animationDropdown.classList.add("hidden");
          });
          animationGrid.appendChild(animationItem);
        });
        animationButton.addEventListener("click", (e) => {
          e.stopPropagation();
          animationDropdown.classList.toggle("hidden");
          this.closeOtherMenus("animation");
        });
        document.addEventListener("click", (e) => {
          if (!animationDropdown.contains(e.target) && !animationButton.contains(e.target)) {
            animationDropdown.classList.add("hidden");
          }
        });
      }
      const fontButton = document.getElementById("change-font");
      const fontDropdown = document.getElementById("font-dropdown");
      const fontGrid = document.getElementById("font-grid");
      if (fontButton && fontDropdown && fontGrid) {
        fontGrid.innerHTML = "";
        const colors = ["#000000", "#F42F25", "#F934FB", "#F76D2A", "#217F1C", "#3019F7", "#F9CA37", "#42FB37"];
        colors.forEach((color) => {
          const colorButton = document.createElement("div");
          colorButton.className = "w-6 h-6 cursor-pointer border border-gray-300 hover:border-blue-500 hover:shadow-sm rounded-[2px]";
          colorButton.style.backgroundColor = color;
          colorButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.wrapSelection(color, true);
            fontDropdown.classList.add("hidden");
          });
          fontGrid.appendChild(colorButton);
        });
        const styles = [
          { tag: "b", icon: "font_bold.png", title: "Bold" },
          { tag: "i", icon: "font_italic.png", title: "Italic" },
          { tag: "u", icon: "font_underline.png", title: "Underline" },
          { tag: "s", icon: "font_strikethrough.png", title: "Strikethrough" }
        ];
        styles.forEach((style) => {
          const styleButton = document.createElement("div");
          styleButton.className = "w-6 h-6 flex justify-center items-center cursor-pointer border border-transparent hover:bg-blue-50 hover:border-blue-200 rounded-[2px] transition-all";
          styleButton.innerHTML = `<img src="/assets/chat/${style.icon}" alt="${style.title}" class="w-[14px] h-[14px]">`;
          styleButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.wrapSelection(style.tag, false);
            fontDropdown.classList.add("hidden");
          });
          fontGrid.appendChild(styleButton);
        });
        fontButton.addEventListener("click", (e) => {
          e.stopPropagation();
          fontDropdown.classList.toggle("hidden");
          this.closeOtherMenus("font");
        });
        document.addEventListener("click", (e) => {
          if (!fontDropdown.contains(e.target) && !fontButton.contains(e.target)) {
            fontDropdown.classList.add("hidden");
          }
        });
      }
      const bgButton = document.getElementById("select-background");
      const bgDropdown = document.getElementById("background-dropdown");
      const chatFrame = document.getElementById("chat-frame");
      const bgOptions = document.querySelectorAll(".bg-option");
      if (bgButton && bgDropdown && chatFrame) {
        bgButton.addEventListener("click", (e) => {
          e.stopPropagation();
          bgDropdown.classList.toggle("hidden");
          this.closeOtherMenus("background");
        });
        bgOptions.forEach((option) => {
          option.addEventListener("click", () => {
            const bgImage = option.getAttribute("data-bg");
            if (bgImage === "none") {
              chatFrame.style.backgroundImage = "";
              chatFrame.classList.add("bg-[#3DB6EC]");
            } else if (bgImage) {
              chatFrame.classList.remove("bg-[#BC787B]");
              chatFrame.style.backgroundImage = bgImage;
              chatFrame.style.backgroundSize = "cover";
              chatFrame.style.backgroundPosition = "center";
            }
            bgDropdown.classList.add("hidden");
          });
        });
        document.addEventListener("click", (e) => {
          if (!bgDropdown.contains(e.target) && !bgButton.contains(e.target)) {
            bgDropdown.classList.add("hidden");
          }
        });
      }
      const chatOptionsButton = document.getElementById("chat-options-button");
      const chatOptionsDropdown = document.getElementById("chat-options-dropdown");
      if (chatOptionsButton && chatOptionsDropdown) {
        chatOptionsButton.addEventListener("click", (e) => {
          e.stopPropagation();
          chatOptionsDropdown.classList.toggle("hidden");
          this.closeOtherMenus("options");
        });
        document.addEventListener("click", (e) => {
          if (!chatOptionsDropdown.contains(e.target) && !chatOptionsButton.contains(e.target)) {
            chatOptionsDropdown.classList.add("hidden");
          }
        });
        document.getElementById("button-invite-game")?.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("Invite clicked");
          chatOptionsDropdown.classList.add("hidden");
        });
        document.getElementById("button-view-profile")?.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("Profile clicked");
          chatOptionsDropdown.classList.add("hidden");
        });
        document.getElementById("button-report-user")?.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("Report clicked");
          chatOptionsDropdown.classList.add("hidden");
        });
        document.getElementById("button-block-user")?.addEventListener("click", (e) => {
          e.stopPropagation();
          const currentChatUser = document.getElementById("chat-header-username")?.textContent;
          if (currentChatUser && confirm(`Block ${currentChatUser}?`)) {
            console.log(`Blocking ${currentChatUser}`);
          }
          chatOptionsDropdown.classList.add("hidden");
        });
      }
    }
    closeOtherMenus(current) {
      if (current !== "emoticon") document.getElementById("emoticon-dropdown")?.classList.add("hidden");
      if (current !== "animation") document.getElementById("animation-dropdown")?.classList.add("hidden");
      if (current !== "font") document.getElementById("font-dropdown")?.classList.add("hidden");
      if (current !== "background") document.getElementById("background-dropdown")?.classList.add("hidden");
      if (current !== "options") document.getElementById("chat-options-dropdown")?.classList.add("hidden");
      document.getElementById("add-friend-dropdown")?.classList.add("hidden");
      document.getElementById("status-dropdown")?.classList.add("hidden");
    }
    // insertion de la clé de l'emoticon a la position actuelle du cursor dans l'unpout
    insertText(text) {
      if (!this.messageInput) return;
      const start = this.messageInput.selectionStart ?? this.messageInput.value.length;
      const end = this.messageInput.selectionEnd ?? this.messageInput.value.length;
      const newValue = this.messageInput.value.substring(0, start) + text + this.messageInput.value.substring(end);
      this.messageInput.value = newValue;
      const newPos = start + text.length;
      this.messageInput.setSelectionRange(newPos, newPos);
      this.messageInput.focus();
    }
    // insertion des balises autour du texte selectionne
    wrapSelection(tagOrColor, isColor) {
      if (!this.messageInput) return;
      const start = this.messageInput.selectionStart ?? this.messageInput.value.length;
      const end = this.messageInput.selectionEnd ?? this.messageInput.value.length;
      const selectedText = this.messageInput.value.substring(start, end);
      let replacement;
      let cursorOffset;
      if (isColor) {
        const openTag = `[color=${tagOrColor}]`;
        replacement = `${openTag}${selectedText}[/color]`;
        cursorOffset = openTag.length;
      } else {
        const openTag = `[${tagOrColor}]`;
        replacement = `${openTag}${selectedText}[/${tagOrColor}]`;
        cursorOffset = openTag.length;
      }
      this.messageInput.value = this.messageInput.value.substring(0, start) + replacement + this.messageInput.value.substring(end);
      const newCursorPos = selectedText.length > 0 ? start + replacement.length : start + cursorOffset;
      this.messageInput.setSelectionRange(newCursorPos, newCursorPos);
      this.messageInput.focus();
    }
  };

  // scripts/pages/HomePage.ts
  function render2() {
    return HomePage_default;
  }
  function afterRender() {
    const socketService = SocketService_default.getInstance();
    socketService.connect();
    const friendList = new FriendList();
    friendList.init();
    const userProfile = new UserProfile();
    userProfile.init();
    const chat = new Chat();
    chat.init();
    window.addEventListener("friendSelected", (e) => {
      const friend = e.detail;
      const myId = parseInt(localStorage.getItem("userId") || "0");
      const friendId = friend.id;
      const ids = [myId, friendId].sort((a, b) => a - b);
      const channelKey = `channel_${ids[0]}_${ids[1]}`;
      const chatPlaceholder = document.getElementById("chat-placeholder");
      const channelChat = document.getElementById("channel-chat");
      if (chatPlaceholder) chatPlaceholder.classList.add("hidden");
      if (channelChat) channelChat.classList.remove("hidden");
      const headerName = document.getElementById("chat-header-username");
      const headerAvatar = document.getElementById("chat-header-avatar");
      const headerStatus = document.getElementById("chat-header-status");
      const headerBio = document.getElementById("chat-header-bio");
      if (headerName) headerName.textContent = friend.alias;
      if (headerBio) headerBio.textContent = friend.bio;
      if (headerAvatar) headerAvatar.src = friend.avatar || friend.avatar_url;
      if (headerStatus) {
        headerStatus.src = statusImages[friend.status] || statusImages["invisible"];
      }
      chat.joinChannel(channelKey);
    });
  }

  // scripts/pages/ProfilePage.html
  var ProfilePage_default = '<div id="main-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden bg-gradient-to-b from-white via-white to-[#7ED5F4]">\n\n    <div class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat"\n         style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;">\n    </div>\n\n    <div class="min-h-screen flex items-center justify-center">\n        <div class="window" style="width: 900px;">\n            <div class="title-bar">\n                <div class="title-bar-text">Profil</div>\n                <div class="title-bar-controls">\n                    <button aria-label="Minimize"></button>\n                    <button aria-label="Maximize"></button>\n                    <button aria-label="Close"></button>\n                </div>\n            </div>\n    \n            <div class="window-body bg-white">\n                <div class="flex flex-col items-center py-12">\n                    <div class="flex flex-row gap-6 border border-gray-300 rounded-sm bg-white shadow-sm p-6 w-[880px]">\n            \n                        <div class="flex flex-col items-center border border-gray-300 rounded-sm p-4 w-[280px] shadow-sm">\n                            <h1 class="text-lg font-normal mb-4">My Profile</h1>\n\n                            <div class="relative w-[170px] h-[170px] mb-1">\n                                <img id="current-statut" class="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"\n                                src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">\n                                \n                                <img id="current-avatar" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover z-10"\n                                src="https://wlm.vercel.app/assets/usertiles/default.png">\n                            </div>\n\n                            <button id="edit-picture-button" class="text-xs underline text-blue-600 hover:underline mb-4 cursor-pointer bg-transparent border-none">\n                                Change my profile picture\n                            </button>\n                            <div>\n                                <div class="flex items-center gap-2 mt-1">\n                                    <label class="text-sm">Status:</label>\n                                    <select class="bg-transparent rounded-sm px-2 py-1 text-sm">\n                                        <option>Available</option>\n                                        <option selected>Busy</option>\n                                        <option>Away</option>\n                                        <option>Appear offline</option>\n                                    </select>\n                                </div>\n                            </div>\n                            <div class="text-sm text-center w-full leading-6">\n                                <p id="username-profile" class="text-xl font-semibold"><strong></strong></p>\n                                <p id="bio-profile" class="text-lg font-semibold" style="word-break: break-all; overflow-wrap: anywhere; white-space: normal;"></p>\n                            </div>\n                        </div>\n            \n                        <div class="flex flex-col justify-between flex-1">\n                            <div class="flex flex-col gap-4">\n                                <label class="text-sm">Username:</label>\n                                <div class="flex flex-row gap-2" data-field="alias">\n                                    <p class="field-display w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-50 flex items-center" style="width:350px">Wait...</p>\n                                    <input type="text" value="" placeholder="Username" class="field-input w-full border border-gray-300 rounded-sm p-2 text-sm text-gray-600 hidden" style="width:350px" disabled/>\n                                    \n                                    <button class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Change</button>\n                                    <button class="confirm-button hidden bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Confirm</button>\n                                </div>\n                                <label class="text-sm">Share a quick message:</label>\n                                <div class="flex flex-row gap-2 bg-gray-400" data-field="bio">\n                                    <p class="field-display w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-500 flex items-center" style="width:350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Share a quick message</p>\n                                    <input type="text" value="" placeholder="Share a quick message" class="field-input w-full bg-gray-400 border border-gray-300 rounded-sm p-2 text-sm text-gray-600 hidden" style="width:350px; overflow: hidden;" disabled/>\n                                    <span class="char-count hidden text-xs text-gray-500 self-center">0/70</span>\n                                    <button class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Change</button>\n                                    <button class="confirm-button hidden bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Confirm</button>\n                                </div>\n                            </div>\n            \n                            <div class="mt-8 border-t border-gray-300 pt-4">\n                                <div class="flex flex-col gap-4">\n                                    <label class="text-sm">Email:</label>\n                                    <div class="flex flex-row gap-2" data-field="email">\n                                        <p class="field-display w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-50 flex items-center" style="width:350px">Wait...</p>\n                                        <input type="email" value="" placeholder="email@gmail.com" class="field-input w-full border border-gray-300 rounded-sm p-2 text-sm hidden" style="width:350px" disabled/>\n                                        \n                                        <button class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Change</button>\n                                        <button class="confirm-button hidden bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Confirm</button>\n                                    </div>\n\n                                    <label class="text-sm">Password:</label>\n                                    <div class="flex flex-row gap-2" data-field="password">\n                                        <p class="field-display w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-50 flex items-center" style="width:350px">Wait...</p>\n                                        <input type="password" value="" placeholder="New password" class="field-input w-full border border-gray-300 rounded-sm p-2 text-sm hidden" style="width:350px" disabled/>\n                                        \n                                        <button class="change-button bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Change</button>\n                                        <button class="confirm-button hidden bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm">Confirm</button>\n                                    </div>\n                                    <button class="2FA-button bg-green-600 border border-gray-400 rounded-sm px-3 py-1 text-sm">Enable 2FA authentication</button>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n\n    <div id="picture-modal" class="absolute inset-0 bg-black/40 z-50 hidden items-center justify-center">\n        <div class="window bg-white" style="width: 650px; box-shadow: 0px 0px 20px rgba(0,0,0,0.5);">\n            <div class="title-bar">\n                <div class="title-bar-text">Change Picture</div>\n                <div class="title-bar-controls">\n                    <button aria-label="Minimize"></button>\n                    <button aria-label="Maximize"></button>\n                    <button id="close-modal" aria-label="Close"></button>\n                </div>\n            </div>\n            <div class="window-body p-6">\n                <div class="mb-6">\n                    <h2 class="text-xl mb-1">Select a picture</h2>\n                    <p class="text-gray-500 text-sm">Choose how you want to appear on transcendence.</p>\n                </div>\n                \n                <div class="flex flex-row gap-6">\n                    <div class="flex-1">\n                        <div class="bg-white border border-[#828790] shadow-inner p-2 h-[250px] overflow-y-auto">\n                            <div id="modal-grid" class="grid grid-cols-4 gap-2">\n                                <img src="/assets/profile/Beach_Chairs.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Chess_Pieces.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Dirt_Bike.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Friendly_Dog.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Guest_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Orange_Daisy.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Palm_Trees.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Rocket_Launch.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Rubber_Ducky.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Running_Horses.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Skateboarder.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Soccer_Ball.png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/User_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Usertile11_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Usertile3_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                                <img src="/assets/profile/Usertile8_(Windows_Vista).png" class="w-full aspect-square object-cover border-2 border-transparent hover:border-[#0078D7] cursor-pointer">\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class="flex flex-col items-center gap-4 w-[200px]">\n                        <div class="relative w-[170px] h-[170px]">\n                            <img class="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"\n                            src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">\n                            \n                            <img id="modal-preview-avatar" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover"\n                            src="https://wlm.vercel.app/assets/usertiles/default.png">\n                        </div>\n\n                        <div class="flex flex-col gap-2 w-full mt-2 h-64">\n                            <input type="file" id="file-input" accept="image/*" hidden>\n\n                            <button id="browse-button" \n                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">\n                            BROWSE\n                            </button>\n                            \n                            <button id="delete-button" \n                            class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">\n                            DELETE\n                            </button>\n\n                            <div class="mt-auto flex justify-center gap-2 pb-3" style="padding-top:101px">\n                                <button id="validation-button" \n                                        class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                            px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">\n                                        OK\n                                </button>\n                                <button id="cancel-button" \n                                        class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm \n                                            px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 \n                                            active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">\n                                        CANCEL\n                                </button>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>';

  // scripts/pages/ProfilePage.ts
  function render3() {
    return ProfilePage_default;
  }
  function afterRender2() {
    const mainAvatar = document.getElementById("current-avatar");
    const statusFrame = document.getElementById("current-statut");
    const usernameDisplay = document.getElementById("username-profile");
    const bioDisplay = document.getElementById("bio-profile");
    const modal = document.getElementById("picture-modal");
    const statusSelect = document.querySelector("select");
    const editButton = document.getElementById("edit-picture-button");
    const closeButton = document.getElementById("close-modal");
    const cancelButton = document.getElementById("cancel-button");
    const okButton = document.getElementById("validation-button");
    const browseButton = document.getElementById("browse-button");
    const deleteButton = document.getElementById("delete-button");
    const gridContainer = document.getElementById("modal-grid");
    const previewAvatar = document.getElementById("modal-preview-avatar");
    const fileInput = document.getElementById("file-input");
    const fieldContainers = document.querySelectorAll(".flex.flex-row.gap-2[data-field]");
    const userId = localStorage.getItem("userId");
    let selectedImageSrc = mainAvatar?.src || "";
    const statusImages3 = {
      "available": "https://wlm.vercel.app/assets/status/status_frame_online_large.png",
      "online": "https://wlm.vercel.app/assets/status/status_frame_online_large.png",
      "busy": "https://wlm.vercel.app/assets/status/status_frame_busy_large.png",
      "away": "https://wlm.vercel.app/assets/status/status_frame_away_large.png",
      "invisible": "https://wlm.vercel.app/assets/status/status_frame_offline_large.png"
    };
    const statusMapping = {
      "Available": "available",
      "Busy": "busy",
      "Away": "away",
      "Appear offline": "invisible"
    };
    const reverseStatusMapping = {
      "available": "Available",
      "online": "Available",
      "busy": "Busy",
      "away": "Away",
      "invisible": "Appear offline"
    };
    const closeModalFunc = () => {
      if (!modal) return;
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    };
    const openModalFunc = () => {
      if (!modal || !previewAvatar || !mainAvatar) return;
      selectedImageSrc = mainAvatar.src;
      previewAvatar.src = selectedImageSrc;
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    };
    const loadUserData = async () => {
      if (!userId)
        return;
      try {
        const response = await fetchWithAuth(`api/users/${userId}`);
        if (response.ok) {
          const user = await response.json();
          if (user.avatar_url && mainAvatar) {
            mainAvatar.src = user.avatar_url;
            selectedImageSrc = user.avatar_url;
          }
          fieldContainers.forEach((container) => {
            const fieldName = container.dataset.field;
            const display = container.querySelector(".field-display");
            const input = container.querySelector(".field-input");
            if (fieldName && display && input) {
              let value2 = user[fieldName];
              if (fieldName === "alias" && user.alias) {
                value2 = user.alias;
                if (usernameDisplay)
                  usernameDisplay.innerText = value2;
              } else if (fieldName === "bio" && user.bio) {
                value2 = user.bio;
                if (bioDisplay)
                  bioDisplay.innerHTML = parseMessage(value2);
              } else if (fieldName === "email" && user.email) {
                value2 = user.email;
              } else if (fieldName === "password") {
                value2 = "********";
              }
              if (value2) {
                display.innerText = value2;
                if (fieldName !== "password") {
                  input.placeholder = value2;
                }
              }
            }
          });
          if (user.status) {
            const normalizedStatus = user.status.toLowerCase();
            const statusValue = reverseStatusMapping[normalizedStatus] || "Appear offline";
            if (statusSelect) statusSelect.value = statusValue;
            updateStatusFrame(normalizedStatus);
          }
          fieldContainers.forEach((container) => {
            const display = container.querySelector(".field-display");
            const input = container.querySelector(".field-input");
            const changeButton = container.querySelector(".change-button");
            const confirmButton = container.querySelector(".confirm-button");
            if (display && input && changeButton && confirmButton) {
              const fieldElements = { container, display, input, changeButton, confirmButton };
              setupField(fieldElements, container.dataset.field);
            }
          });
        }
      } catch (error) {
        console.error("Erreur while charging profile:", error);
      }
    };
    const updateStatusFrame = (status) => {
      if (statusFrame && statusImages3[status]) {
        statusFrame.src = statusImages3[status];
      }
    };
    loadUserData();
    const updateUsername = async (newUsername) => {
      if (!userId || !newUsername.trim()) return false;
      try {
        const response = await fetchWithAuth(`api/users/${userId}/alias`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alias: newUsername })
        });
        if (response.ok) {
          if (usernameDisplay) usernameDisplay.innerText = newUsername;
          console.log("Username mis \xE0 jour");
          return true;
        } else {
          console.error("Erreur lors de la mise \xE0 jour du username");
          alert("Erreur lors de la sauvegarde du username");
          return false;
        }
      } catch (error) {
        console.error("Erreur r\xE9seau:", error);
        alert("Erreur lors de la sauvegarde du username");
        return false;
      }
    };
    const updateBio = async (newBio) => {
      if (!userId) return false;
      const MAX_BIO_LENGTH = 70;
      const trimmedBio = newBio.trim();
      if (trimmedBio.length > MAX_BIO_LENGTH) {
        console.error("Erreur: Bio d\xE9passe la limite de 70 caract\xE8res.");
        alert(`La biographie ne doit pas d\xE9passer ${MAX_BIO_LENGTH} caract\xE8res.`);
        return false;
      }
      try {
        const response = await fetchWithAuth(`api/users/${userId}/bio`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bio: trimmedBio })
        });
        if (response.ok) {
          if (bioDisplay) bioDisplay.innerHTML = parseMessage(trimmedBio) || "Share a quick message";
          console.log("Bio mise \xE0 jour");
          return true;
        } else {
          console.error("Erreur lors de la mise \xE0 jour de la bio");
          alert("Erreur lors de la sauvegarde de la bio");
          return false;
        }
      } catch (error) {
        console.error("Erreur r\xE9seau:", error);
        alert("Erreur lors de la sauvegarde de la bio");
        return false;
      }
    };
    const updateEmail = async (newEmail) => {
      if (!userId || !newEmail.trim()) return false;
      try {
        const response = await fetchWithAuth(`api/users/${userId}/email`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail })
        });
        if (response.ok) {
          const user = await response.json();
          user.email = newEmail;
          console.log("Email mis \xE0 jour");
          return true;
        } else {
          console.error("Erreur lors de la mise \xE0 jour du Email");
          alert("Erreur lors de la sauvegarde du Email");
          return false;
        }
      } catch (error) {
        console.error("Erreur r\xE9seau:", error);
        alert("Erreur lors de la sauvegarde du Email");
        return false;
      }
    };
    const updatePassword = async (newPassword) => {
    };
    const setupField = (elements, fieldName) => {
      const { display, input, changeButton, confirmButton } = elements;
      let initialValue = display.innerText;
      const MAX_BIO_LENGTH = 70;
      const charCountElement = fieldName === "bio" ? elements.container.querySelector(".char-count") : null;
      const updateCharCount = (currentLength) => {
        if (charCountElement) {
          charCountElement.innerText = `${currentLength}/${MAX_BIO_LENGTH}`;
          if (currentLength > MAX_BIO_LENGTH) {
            charCountElement.classList.add("text-red-500");
            charCountElement.classList.remove("text-gray-500");
          } else {
            charCountElement.classList.remove("text-red-500");
            charCountElement.classList.add("text-gray-500");
          }
        }
      };
      const enableEditMode = () => {
        initialValue = fieldName === "password" ? "" : display.innerText;
        display.classList.add("hidden");
        input.classList.remove("hidden");
        input.disabled = false;
        if (fieldName !== "password") {
          input.value = "";
          input.placeholder = initialValue;
        } else {
          input.value = "";
        }
        if (fieldName === "bio" && charCountElement) {
          charCountElement.classList.remove("hidden");
          const initialLength = initialValue.length;
          updateCharCount(initialLength);
        }
        changeButton.classList.add("hidden");
        confirmButton.classList.add("hidden");
        input.focus();
      };
      const disableEditMode = (newValue) => {
        display.classList.remove("hidden");
        input.classList.add("hidden");
        input.disabled = true;
        if (fieldName === "password") {
          display.innerText = "********";
        } else {
          display.innerText = newValue;
          input.placeholder = newValue;
        }
        if (fieldName === "bio" && charCountElement) {
          charCountElement.classList.add("hidden");
        }
        changeButton.classList.remove("hidden");
        confirmButton.classList.add("hidden");
      };
      changeButton.addEventListener("click", enableEditMode);
      input.addEventListener("input", () => {
        const currentValue = input.value;
        let isChanged = false;
        let isValid = true;
        const trimmedValue = currentValue.trim();
        if (fieldName === "bio") {
          updateCharCount(currentValue.length);
          if (currentValue.length > MAX_BIO_LENGTH) {
            isValid = false;
          }
          const initialTrimmedValue = initialValue.trim();
          isChanged = trimmedValue.length > 0 && trimmedValue !== initialTrimmedValue;
        } else if (fieldName === "password") {
          isChanged = currentValue.length > 0;
        } else {
          isChanged = trimmedValue !== initialValue.trim() && trimmedValue.length > 0;
        }
        if (isChanged && isValid) {
          confirmButton.classList.remove("hidden");
        } else {
          confirmButton.classList.add("hidden");
        }
      });
      confirmButton.addEventListener("click", async () => {
        const newValue = input.value.trim();
        let updateSuccessful = false;
        switch (fieldName) {
          case "alias":
            updateSuccessful = await updateUsername(newValue);
            break;
          case "bio":
            updateSuccessful = await updateBio(newValue);
            break;
          case "email":
            updateSuccessful = await updateEmail(newValue);
            break;
          // case 'password':
          //     updateSuccessful = await updatePassword(newValue);
          //     break;
          default:
            updateSuccessful = true;
        }
        if (updateSuccessful) {
          disableEditMode(newValue);
        }
      });
      input.addEventListener("blur", (e) => {
        if (e.relatedTarget !== confirmButton) {
          const isConfirmedVisible = !confirmButton.classList.contains("hidden");
          if (isConfirmedVisible) {
            disableEditMode(fieldName === "password" ? display.innerText : initialValue);
          } else {
            disableEditMode(fieldName === "password" ? display.innerText : initialValue);
          }
        }
      });
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const isConfirmedVisible = !confirmButton.classList.contains("hidden");
          if (isConfirmedVisible) {
            confirmButton.click();
          } else {
            input.blur();
          }
        }
      });
    };
    const updateStatus = async (newStatus) => {
      if (!userId) return;
      try {
        const response = await fetchWithAuth(`api/users/${userId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          updateStatusFrame(newStatus);
          localStorage.setItem("userStatus", newStatus);
          console.log("Status mis \xE0 jour:", newStatus);
        } else {
          console.error("Erreur lors de la mise \xE0 jour du status");
          alert("Erreur lors de la sauvegarde du status");
        }
      } catch (error) {
        console.error("Erreur r\xE9seau:", error);
        alert("Erreur lors de la sauvegarde du status");
      }
    };
    statusSelect?.addEventListener("change", () => {
      const selectedValue = statusSelect.value;
      const statusKey = statusMapping[selectedValue];
      if (statusKey) {
        updateStatus(statusKey);
      }
    });
    editButton?.addEventListener("click", openModalFunc);
    closeButton?.addEventListener("click", closeModalFunc);
    cancelButton?.addEventListener("click", () => {
      closeModalFunc();
    });
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModalFunc();
    });
    if (gridContainer) {
      const gridImages = gridContainer.querySelectorAll("img");
      gridImages.forEach((img) => {
        img.addEventListener("click", () => {
          selectedImageSrc = img.src;
          if (previewAvatar) previewAvatar.src = selectedImageSrc;
          gridImages.forEach((i) => i.classList.remove("border-[#0078D7]"));
          img.classList.add("border-[#0078D7]");
        });
      });
    }
    browseButton?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const result = e.target.result;
            selectedImageSrc = result;
            if (previewAvatar) previewAvatar.src = result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
    deleteButton?.addEventListener("click", () => {
      const defaultAvatar = "https://wlm.vercel.app/assets/usertiles/default.png";
      selectedImageSrc = defaultAvatar;
      if (previewAvatar) previewAvatar.src = defaultAvatar;
    });
    okButton?.addEventListener("click", async () => {
      if (!userId) {
        alert("Error: no user found");
        return;
      }
      try {
        console.log("avatar charge");
        const response = await fetchWithAuth(`api/users/${userId}/avatar`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: selectedImageSrc })
        });
        if (response.ok) {
          if (mainAvatar) mainAvatar.src = selectedImageSrc;
          closeModalFunc();
          console.log("avatar maj");
        } else {
          console.error("Error while updating");
          alert("Error while saving");
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    });
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

  // scripts/pages/LandingPage.ts
  function LandingPage() {
    return `
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
			Welcome to Transcendence
		</h1>
		<!-- Login div -->
		<div class="flex flex-col justify-center items-center gap-6">
			<!-- Bouton de connexion/Register/Guest -->
			<button id="login-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Login</button>
	 		<button id="register-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Register</button>
 			<button id="guest-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Play as guest</button>
	</div>
	</div>

	
	`;
  }
  function initLandingPage() {
    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");
    const guestButton = document.getElementById("guest-button");
    const handleNavigation = (path) => {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };
    loginButton?.addEventListener("click", () => {
      handleNavigation("/login");
    });
    registerButton?.addEventListener("click", () => {
      handleNavigation("/register");
    });
    guestButton?.addEventListener("click", () => {
      handleNavigation("/home");
    });
  }

  // scripts/pages/RegisterPage.ts
  function RegisterPage() {
    return `
	<div class="w-screen h-[200px] bg-cover bg-center bg-no-repeat" style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;"></div>
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
			Sign up to Transcendence
		</h1>
		<!-- Login div -->
		<div class="flex flex-col justify-center items-center gap-6">
			<div class="border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm bg-white w-80 p-4 shadow-sm">
				<!-- Username -->
				<input type="alias" placeholder="faufaudu49" id="alias-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>

				<!-- Email -->
				<input type="email" placeholder="Example555@hotmail.com" id="email-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
		
				<!-- Mot de passe -->
				<input type="password" placeholder="Enter your password" id="password-input"
					class="w-full border border-gray-300 appearance-none [border-color:rgb(209,213,219)] rounded-sm p-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
				<div class="flex flex-col items-center justify-center">
					<p id="error-message" class="text-red-600 text-sm mb-2 hidden"></p>
				</div>
			</div>
			<!-- Bouton de register -->
			<div class="flex flex-col gap-2 w-48">
				<button id="register-button" class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 appearance-none [border-color:rgb(209,213,219)] rounded-sm px-4 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">Register</button>
			</div>
	</div>
	</div>
	`;
  }
  function handleRegister() {
    const button = document.getElementById("register-button");
    const errorElement = document.getElementById("error-message");
    if (!button) {
      console.error("Can't find register button in DOM");
      return;
    }
    button.addEventListener("click", async () => {
      const email = document.getElementById("email-input").value;
      const password = document.getElementById("password-input").value;
      const alias2 = document.getElementById("alias-input").value;
      if (errorElement) {
        errorElement.classList.add("hidden");
        errorElement.textContent = "";
      }
      if (!alias2 || !password || !email) {
        if (errorElement) {
          errorElement.textContent = "Please fill all inputs";
          errorElement.classList.remove("hidden");
        }
        return;
      }
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ alias: alias2, email, password })
        });
        const result = await response.json();
        console.log("RECEPTION DU BACKEND:", result);
        if (response.ok) {
          const { access_token, user_id } = result;
          console.log("User ID:", user_id);
          console.log("Access Token:", access_token);
          if (access_token)
            localStorage.setItem("accessToken", access_token);
          if (user_id)
            localStorage.setItem("userId", user_id.toString());
          if (user_id) {
            try {
              const userRes = await fetch(`/api/users/${user_id}`, {
                headers: { "Authorization": `Bearer ${access_token}` }
              });
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.alias) {
                  localStorage.setItem("username", userData.alias);
                }
                if (userData.status) {
                  const statusSaved = userData.status === "online" ? "available" : userData.status;
                  localStorage.setItem("userStatus", statusSaved);
                }
              }
            } catch (err) {
              console.error("Can't get user's profile", err);
            }
          }
          window.history.pushState({}, "", "/home");
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else {
          console.error("Login error:", result.error.message);
          if (errorElement) {
            errorElement.textContent = result.error.message || "Authentication failed";
            errorElement.classList.remove("hidden");
          }
        }
      } catch (error) {
        console.error("Network error:", error);
        if (errorElement) {
          errorElement.textContent = "Network error, please try again REGISTER PAGE";
          errorElement.classList.remove("hidden");
        }
      }
    });
  }
  function registerEvents() {
    handleRegister();
  }

  // scripts/main.ts
  var appElement = document.getElementById("app");
  var publicRoutes = ["/", "/login", "/register", "/404"];
  var routes = {
    "/": {
      render: LandingPage,
      afterRender: initLandingPage
    },
    "/home": {
      render: render2,
      afterRender
    },
    "/profile": {
      render: render3,
      afterRender: afterRender2
    },
    "/register": {
      render: RegisterPage,
      afterRender: registerEvents
    },
    "/login": {
      render,
      afterRender: loginEvents
    },
    "/404": {
      render: NotFoundPage
    }
  };
  var handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // force l'envoi du cookie HttpOnly au serveur
        credentials: "include",
        body: JSON.stringify({})
        // force le format JSON
      });
      console.log("Deconnection from the backend server succeed");
    } catch (error) {
      console.error("Error during the deconnection from the server: ", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("userStatus");
      window.history.pushState({}, "", "/");
      const popStateEvent = new PopStateEvent("popstate");
      window.dispatchEvent(popStateEvent);
    }
  };
  var handleLocationChange = () => {
    if (!appElement) return;
    let path = window.location.pathname;
    const accessToken = localStorage.getItem("accessToken");
    if (path === "/logout") {
      handleLogout();
      return;
    }
    if (accessToken && (path === "/" || path === "/login" || path === "/register")) {
      window.history.pushState({}, "", "/home");
      path = "/home";
    }
    if (!accessToken && !publicRoutes.includes(path)) {
      window.history.pushState({}, "", "/");
      path = "/";
    }
    const page = routes[path] || routes["/404"];
    appElement.innerHTML = page.render();
    if (page.afterRender) {
      page.afterRender();
    }
  };
  window.addEventListener("click", (event) => {
    const target = event.target;
    const anchor = target.closest("a");
    if (anchor && anchor.href.startsWith(window.location.origin)) {
      event.preventDefault();
      const href = anchor.href;
      if (href === window.location.href) return;
      window.history.pushState({}, "", href);
      handleLocationChange();
    }
  });
  window.addEventListener("popstate", () => {
    handleLocationChange();
  });
  document.addEventListener("DOMContentLoaded", () => {
    handleLocationChange();
  });
})();
