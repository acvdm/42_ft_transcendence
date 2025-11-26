"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // scripts/pages/LoginPage.ts
  function LoginPage() {
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
								<option value="Available">Available</option>
								<option value="Busy">Busy</option>
								<option value="Away">Away</option>
								<option value="Appear offline">Appear offline</option>
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
	</div>
	`;
  }
  function handleLogin() {
    const button = document.getElementById("login-button");
    const errorElement = document.getElementById("error-message");
    button?.addEventListener("click", async () => {
      const email = document.getElementById("email-input").value;
      const password = document.getElementById("password-input").value;
      console.log("Tentative de connexion avec :", email, password);
    });
  }

  // scripts/pages/HomePage.ts
  function render() {
    return `
<div id="wizz-container" class="relative w-full h-[calc(100vh-50px)] overflow-hidden bg-gradient-to-b from-white via-white to-[#7ED5F4]">

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


                <!-- Partie live chat -->

                <div id="chat-frame" class="relative flex-1 p-10 bg-transparent rounded-sm flex flex-row items-end gap-4 bg-cover bg-center transition-all duration-300 min-h-0 overflow-hidden">
                  
                  <!-- Image \xE0 gauche -->
                  <div class="relative w-[110px] h-[110px] flex-shrink-0">
                      <!-- le cadre -->
                      <img id="user-status" class="absolute inset-0 w-full h-full object-cover" src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">
                      <!-- l'image -->
                      <img id="user-profile" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] object-cover" src="/assets/profile/Friendly_Dog.png">
                  </div>
                  
                  <!-- Live chat \xE0 droite -->
                  <div class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 relative z-10 min-h-0 h-full -mb-4 -mr-4">
                      <h1 class="text-lg font-bold mb-2">Live chat </h1>
                      <div id="chat-messages" class="flex-1 h-0 overflow-y-auto min-h-0 border-t border-gray-200 pt-2 space-y-2 text-sm"></div>

                      <!-- Input element  -->

                      <div class="flex flex-col">
                        <input type="text" id="chat-input" placeholder="\xC9crire un message..." class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">

                        <!-- Insertion des emoticones, wizz etc -->
                         <div class="flex border-x border-b rounded-b-[4px] border-[#bdd5df] items-center pl-1" style="background-image: url(&quot;/assets/chat/chat_icons_background.png&quot;);">
                            <button id="select-emoticon" class="h-6">
                                <div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
                                <div class="w-5"><img src="/assets/chat/select_emoticon.png" alt="Select Emoticon"></div>
                                <div><img src="/assets/chat/arrow.png" alt="Select arrow">
                              </div>

                              <!-- Menu dropdown -> il s'ouvre quand on clique -->

                              <div id="emoticon-dropdown" class="absolute z-10 hidden bottom-full left-0 mb-1 w-72 p-2 bg-white border border-gray-300 rounded-md shadow-xl">
                                <div class="grid grid-cols-8 gap-1" id="emoticon-grid"></div>
                              </div>

                              </div>
                            </button>
                            
                              <button id="select-animation" class="h-6">
                                <div class="relative flex items-center aerobutton p-0.7 h-5 border border-transparent rounded-sm hover:border-gray-300">
                                <div class="w-5"><img src="/assets/chat/select_wink.png" alt="Select Animation"></div>
                                <div><img src="/assets/chat/arrow.png" alt="Select arrow">
                                  </div>

                                  <!-- Menu dropdown -> il s'ouvre quand on clique -->

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
</div>

    `;
  }
  function afterRender() {
    let globalPath = "/assets/emoticons/";
    let animationPath = "/assets/animated/";
    const emoticons = {};
    const animations = {
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
    const icons = {
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
    const socket = lookup2("/", {
      path: "/socket.io/"
      // on met le chemin que nginx va intercepter 
    });
    const messagesContainer = document.getElementById("chat-messages");
    const messageInput = document.getElementById("chat-input");
    const wizzButton = document.getElementById("send-wizz");
    const wizzContainer = document.getElementById("wizz-container");
    const currentUsername = localStorage.getItem("username");
    if (!messagesContainer || !messageInput) {
      console.log("Can't find chat elements");
      return;
    }
    const scrollToBottom = () => {
      if (messagesContainer) {
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
      }
    };
    const animationButton = document.getElementById("select-animation");
    const animationDropdown = document.getElementById("animation-dropdown");
    const animationGrid = document.getElementById("animation-grid");
    const insertTag = (tagKey) => {
      const start = messageInput.selectionStart ?? messageInput.value.length;
      const end = messageInput.selectionEnd ?? messageInput.value.length;
      const toInsert = tagKey + " ";
      const newValue = messageInput.value.substring(0, start) + toInsert + messageInput.value.substring(end);
      messageInput.value = newValue;
      const newCursorPosition = start + toInsert.length;
      messageInput.selectionStart = newCursorPosition;
      messageInput.selectionEnd = newCursorPosition;
      messageInput.focus();
    };
    if (animationButton && animationDropdown && animationGrid) {
      const fillAnimationGrid = () => {
        animationGrid.innerHTML = "";
        Object.keys(icons).forEach((key) => {
          const imgUrl = icons[key];
          const animationItem = document.createElement("div");
          animationItem.className = "cursor-pointer-w10 h-10 flex justify-center items-center hover:bg-blue-100 rounded-sm transition-colors duration-100";
          animationItem.innerHTML = `<img src="${imgUrl}" alt="${key}" title="${key}" class="w-[32px] h-[32px] object-contain">`;
          animationItem.addEventListener("click", (event) => {
            event.stopPropagation();
            socket.emit("sendAnimation", {
              animationKey: key,
              author: currentUsername
              // a remplacer par l'username de l'envoyeur 
            });
            animationDropdown.classList.add("hidden");
          });
          animationGrid.appendChild(animationItem);
        });
      };
      animationButton.addEventListener("click", (event) => {
        event.stopPropagation();
        animationDropdown.classList.toggle("hidden");
      });
      document.addEventListener("click", (event) => {
        const target = event.target;
        if (!animationDropdown.contains(target) && !animationButton.contains(target))
          animationDropdown.classList.add("hidden");
      });
      fillAnimationGrid();
    }
    socket.on("receivedAnimation", (data) => {
      const { animationKey, author } = data;
      const imgUrl = animations[animationKey];
      if (imgUrl) {
        const animationHTML = `
                <div>
                    <strong>${author} said:</strong><br>
                    <img src="${imgUrl}" alt="${animationKey}">
                </div>
            `;
        addCustomContent(animationHTML);
      } else {
        addMessage(`Animation inconnue (${animationKey}) re\xE7ue de ${author}.`, "Syst\xE8me");
      }
    });
    const addCustomContent = (htmlContent) => {
      const msgElement = document.createElement("div");
      msgElement.className = "mb-1";
      msgElement.innerHTML = htmlContent;
      messagesContainer.appendChild(msgElement);
      scrollToBottom();
      setTimeout(scrollToBottom, 200);
    };
    const bgButton = document.getElementById("select-background");
    const bgDropdown = document.getElementById("background-dropdown");
    const chatFrame = document.getElementById("chat-frame");
    const bgOptions = document.querySelectorAll(".bg-option");
    if (bgButton && bgDropdown && chatFrame) {
      bgButton.addEventListener("click", (e) => {
        e.stopPropagation();
        bgDropdown.classList.toggle("hidden");
        document.getElementById("emoticon-dropdown")?.classList.add("hidden");
        document.getElementById("animation-dropdown")?.classList.add("hidden");
        document.getElementById("font-dropdown")?.classList.add("hidden");
      });
      bgOptions.forEach((option) => {
        option.addEventListener("click", () => {
          const bgImage = option.getAttribute("data-bg");
          if (bgImage === "none") {
            chatFrame.style.backgroundImage = "";
            chatFrame.classList.add("bg-transparent");
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
        const target = e.target;
        if (!bgDropdown.contains(target) && !bgButton.contains(target)) {
          bgDropdown.classList.add("hidden");
        }
      });
    }
    const emoticonButton = document.getElementById("select-emoticon");
    const emoticonDropdown = document.getElementById("emoticon-dropdown");
    const emoticonGrid = document.getElementById("emoticon-grid");
    if (emoticonButton && emoticonDropdown && emoticonGrid) {
      const insertEmoticon = (emoticonKey) => {
        const start = messageInput.selectionStart ?? messageInput.value.length;
        const end = messageInput.selectionEnd ?? messageInput.value.length;
        const toInsert = emoticonKey + " ";
        const newValue = messageInput.value.substring(0, start) + toInsert + messageInput.value.substring(end);
        messageInput.value = newValue;
        const newCursorPosition = start + toInsert.length;
        messageInput.selectionStart = newCursorPosition;
        messageInput.selectionEnd = newCursorPosition;
        messageInput.focus();
      };
      const fillEmoticonsGrid = () => {
        emoticonGrid.innerHTML = "";
        const emoticonsByUrl = /* @__PURE__ */ new Map();
        const sortedKeys = Object.keys(emoticons).sort((a, b) => b.length - a.length);
        sortedKeys.forEach((key) => {
          const imgUrl = emoticons[key];
          if (!emoticonsByUrl.has(imgUrl)) {
            emoticonsByUrl.set(imgUrl, []);
          }
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
            insertEmoticon(primaryKey);
            emoticonDropdown.classList.add("hidden");
          });
          emoticonGrid.appendChild(emoticonItem);
        });
      };
      emoticonButton.addEventListener("click", (event) => {
        event.stopPropagation();
        emoticonDropdown.classList.toggle("hidden");
      });
      document.addEventListener("click", (event) => {
        const target = event.target;
        if (!emoticonDropdown.contains(target) && !emoticonButton.contains(target)) {
          emoticonDropdown.classList.add("hidden");
        }
      });
      fillEmoticonsGrid();
    }
    const escapeHTML = (text) => {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };
    const escapeRegex = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };
    const parseMessage = (message) => {
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
    const fontButton = document.getElementById("change-font");
    const fontDropdown = document.getElementById("font-dropdown");
    const fontGrid = document.getElementById("font-grid");
    const wrapSelection = (tagOrColor, isColor = false) => {
      if (!messageInput) return;
      const start = messageInput.selectionStart ?? messageInput.value.length;
      const end = messageInput.selectionEnd ?? messageInput.value.length;
      const selectedText = messageInput.value.substring(start, end);
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
      messageInput.value = messageInput.value.substring(0, start) + replacement + messageInput.value.substring(end);
      const newCursorPos = selectedText.length > 0 ? start + replacement.length : start + cursorOffset;
      messageInput.setSelectionRange(newCursorPos, newCursorPos);
      messageInput.focus();
    };
    if (fontButton && fontDropdown && fontGrid) {
      const generateFontGrid = () => {
        fontGrid.innerHTML = "";
        const colors = [
          "#000000",
          // noir
          "#F42F25",
          // rouge
          "#F934FB",
          // rose
          "#F76D2A",
          // orange
          "#217F1C",
          // vert
          "#3019F7",
          // bleu
          "#F9CA37",
          // jaune
          "#42FB37"
          // vert fluo
        ];
        colors.forEach((color) => {
          const colorButton = document.createElement("div");
          colorButton.className = "w-6 h-6 cursor-pointer border border-gray-300 hover:border-blue-500 hover:shadow-sm rounded-[2px]";
          colorButton.style.backgroundColor = color;
          colorButton.addEventListener("click", (e) => {
            e.stopPropagation();
            wrapSelection(color, true);
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
        styles.forEach((styles2) => {
          const styleButton = document.createElement("div");
          styleButton.className = "w-6 h-6 flex justify-center items-center cursor-pointer border border-transparent hover:bg-blue-50 hover:border-blue-200 rounded-[2px] transition-all";
          styleButton.innerHTML = `<img src="/assets/chat/${styles2.icon}" alt="${styles2.title}" class="w-[14px] h-[14px]">`;
          styleButton.addEventListener("click", (e) => {
            e.stopPropagation();
            wrapSelection(styles2.tag, false);
            fontDropdown.classList.add("hidden");
          });
          fontGrid.appendChild(styleButton);
        });
      };
      generateFontGrid();
      fontButton.addEventListener("click", (e) => {
        e.stopPropagation();
        fontDropdown.classList.toggle("hidden");
        document.getElementById("emoticon-dropdown")?.classList.add("hidden");
        document.getElementById("animation-dropdown")?.classList.add("hidden");
      });
      fontDropdown.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const target = e.currentTarget;
          const tag = target.dataset.tag;
          const color = target.dataset.color;
          if (tag) {
            wrapSelection(tag, false);
          } else if (color) {
            wrapSelection(color, true);
          }
          fontDropdown.classList.add("hidden");
        });
      });
    }
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (fontDropdown && !fontDropdown.contains(target) && !fontButton?.contains(target)) {
        fontDropdown.classList.add("hidden");
      }
    });
    const addMessage = async (message, author = "Admin") => {
      const msgElement = document.createElement("p");
      msgElement.className = "mb-1";
      const contentEmoticons = parseMessage(message);
      msgElement.innerHTML = `<strong>${author} said:</strong><br> ${contentEmoticons}`;
      messagesContainer.appendChild(msgElement);
      scrollToBottom();
      setTimeout(scrollToBottom, 200);
    };
    let shakeTimeout;
    const shakeElement = (element, duration = 500) => {
      if (!element)
        return;
      if (shakeTimeout)
        clearTimeout(shakeTimeout);
      element.classList.remove("wizz-shake");
      void element.offsetWidth;
      element.classList.add("wizz-shake");
      shakeTimeout = window.setTimeout(() => {
        element.classList.remove("wizz-shake");
        shakeTimeout = void 0;
      }, duration);
      try {
        const wizzSound = new Audio("/assets/chat/wizz_sound.mp3");
        wizzSound.play().catch((e) => console.log("Could not play wizz sound:", e.message));
      } catch (e) {
        console.log("Audio API error:", e.message);
      }
    };
    if (wizzButton) {
      wizzButton.addEventListener("click", () => {
        socket.emit("sendWizz", { author: currentUsername });
        if (wizzContainer) {
          shakeElement(wizzContainer, 500);
        }
      });
    }
    socket.on("receivedWizz", (data) => {
      addMessage(`<strong>${data.author} sent a nudge</strong>`, "Admin");
      shakeElement(wizzContainer, 3e3);
    });
    socket.on("connect", () => {
      addMessage("Connected to chat server!");
    });
    socket.on("chatMessage", (data) => {
      addMessage(data.message || data, data.author || "Anonyme");
      console.log("Username:", data.alias);
    });
    socket.on("disconnected", () => {
      addMessage("Disconnected from chat server!");
    });
    messageInput.addEventListener("keyup", (event) => {
      if (event.key == "Enter" && messageInput.value.trim() != "") {
        const message = messageInput.value;
        socket.emit("chatMessage", { message, author: currentUsername });
        messageInput.value = "";
      }
    });
  }

  // scripts/pages/ProfilePage.ts
  function ProfilPage() {
    return `

<!-- Main content -->
  <div class="flex flex-col items-center py-8">

    <div class="flex flex-row gap-6 border border-gray-300 rounded-sm bg-white shadow-sm p-6 w-[880px]">

      <!-- Left: My Profile -->
      <div class="flex flex-col items-center border border-gray-300 rounded-sm p-4 w-[280px] shadow-sm">
        <h1 class="text-lg font-normal mb-4">My Profile</h1>

        <!-- Profile picture -->
        <div class="relative w-[170px] h-[170px] mb-4">
          <img class="absolute inset-0 w-full h-full object-cover"
            src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png" alt="profile frame">
          <img class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130px] h-[130px] object-cover"
            src="https://wlm.vercel.app/assets/usertiles/default.png" alt="user photo">
        </div>

        <!-- Profile info -->
        <div class="text-sm text-left w-full leading-6">
          <p><strong>FAUSToche01</strong></p>
          <p>c00uk\xF6\xFC les kop1</p>
          <p>Status: <span class="text-red-600">dcdscsd</span></p>
          <p>Email: fsdsdsfsd</p>
          <p>Password: dfsdcsd</p>
          <p>Background: scscsd</p>
        </div>
      </div>

      <!-- Right: Profile editor -->
      <div class="flex flex-col justify-between flex-1">

        <!-- Upper section -->
        <div class="flex flex-col gap-4">
          <div>
            <label class="text-sm">Username:</label>
            <input type="text" value="FAUSToche01"
              class="w-full border border-gray-300 rounded-sm p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>

          <div>
            <label class="text-sm">Choose your message:</label>
            <input type="text" value="c00uk\xF6\xFC les kop1"
              class="w-full border border-gray-300 rounded-sm p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div>
            <label class="text-sm">Status:</label>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-gray-600 text-sm">Choose your status:</span>
              <select
                class="bg-transparent rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option>Available</option>
                <option selected>Busy</option>
                <option>Away</option>
                <option>Appear offline</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="mt-8 border-t border-gray-300 pt-4">
          <h2 class="text-red-600 text-base font-semibold mb-2">DANGER ZONE !!! \u26A0\uFE0F</h2>
          <div class="flex items-center justify-start gap-6">
            <div class="flex items-center gap-2">
              <span class="text-sm">Email</span>
              <button
                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                Change
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm">Password</span>
              <button
                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm px-3 py-1 text-sm shadow-sm hover:from-gray-200 hover:to-gray-400 active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400">
                Change
              </button>
            </div>
          </div>
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
  var publicRoutes = ["/", "/login", "/register", "/404"];
  var routes = {
    "/": {
      render: LandingPage,
      afterRender: initLandingPage
    },
    "/home": {
      render,
      afterRender
    },
    "/profile": {
      render: ProfilPage,
      afterRender: () => console.log("Profil page charg\xE9e -> modifications de la page de profil, photo etc")
    },
    "/register": {
      render: RegisterPage,
      afterRender: registerEvents
    },
    "/login": {
      render: LoginPage,
      afterRender: loginEvents
    },
    "/404": {
      render: NotFoundPage
    }
  };
  var handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    window.history.pushState({}, "", "/");
    const popStateEvent = new PopStateEvent("popstate");
    window.dispatchEvent(popStateEvent);
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
