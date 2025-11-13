// on va exportrter une fonction qui renvoie du html 
export function HomePage(): string {
	return `
    <div class="relative w-full h-[calc(100vh-50px)] overflow-hidden bg-gradient-to-b from-white via-white to-[#7ED5F4]">

        <div class="absolute top-0 left-0 w-full h-[200px] bg-cover bg-center bg-no-repeat" 
             style="background-image: url(https://wlm.vercel.app/assets/background/background.jpg); background-size: cover;">
        </div>

        <div class="absolute top-[20px] bottom-0 left-0 right-0 flex justify-center p-6 overflow-y-auto">

            <div class="flex flex-row min-w-[1000px] h-full gap-4">

                <div class="w-[1300px] h-full bg-gradient-to-b from-blue-50 to-blue-100 border border-gray-300 shadow-inner rounded-sm flex items-center justify-center min-w-[650px]">
                    <h1 class="text-lg font-semibold"> Pong 👾</h1>
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
                        <input type="text" placeholder="Écrire un message..." class="mt-3 bg-gray-100 rounded-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    </div>
                </div>
            </div>
        </div>
    </div>
	`;
};