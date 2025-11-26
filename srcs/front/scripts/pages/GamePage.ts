// on va exportrter une fonction qui renvoie du html 
export function GamePage(): string {
	return `

                <!-- Partie live chat -->

                <div id="chat-frame" class="relative flex-1 p-10 bg-transparent rounded-sm flex flex-row items-end gap-4 bg-cover bg-center transition-all duration-300 min-h-0 overflow-hidden">
                  
                  <!-- Image à gauche -->
                  <div class="relative w-[110px] h-[110px] flex-shrink-0">
                      <!-- le cadre -->
                      <img id="user-status" class="absolute inset-0 w-full h-full object-cover" src="https://wlm.vercel.app/assets/status/status_frame_offline_large.png">
                      <!-- l'image -->
                      <img id="user-profile" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] object-cover" src="/assets/profile/Friendly_Dog.png">
                  </div>
                  
                  <!-- Live chat à droite -->
                  <div class="flex flex-col bg-white border border-gray-300 rounded-sm shadow-sm p-4 flex-1 relative z-10 min-h-0 h-full -mb-4 -mr-4">
                      <h1 class="text-lg font-bold mb-2">Live chat </h1>
                      <div id="chat-messages" class="flex-1 h-0 overflow-y-auto min-h-0 border-t border-gray-200 pt-2 space-y-2 text-sm"></div>

                      <!-- Input element  -->

                      <div class="flex flex-col">
                        <input type="text" id="chat-input" placeholder="Écrire un message..." class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">

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
	`;
}