import { Chat } from "../Chat";
import i18next from "../../i18n"; // Assurez-vous que le chemin vers i18n est correct

//================================================
//=================== GET DATE ===================
//================================================

export function getSqlDate(): string {

    const now = new Date();
    
    // 2. Astuce rapide : on prend l'ISO, on coupe les ms, et on remplace T par espace
    // .slice(0, 19) garde "YYYY-MM-DDTHH:mm:ss"
    return now.toISOString().slice(0, 19).replace('T', ' ');
}

//================================================
//============ LAUCH CONFETTI AT END =============
//================================================

export function launchConfetti(duration: number = 3000) {
    
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
    const confettiCount = 150;
    const container = document.body;
    const confettiContainer = document.createElement('div');
    
    confettiContainer.id = 'confetti-container';
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
    `;
    container.appendChild(confettiContainer);

    for (let i = 0; i < confettiCount; i++) {
        createConfetti(confettiContainer, colors);
    }

    setTimeout(() => {
        confettiContainer.remove();
    }, duration);
}

function createConfetti(container: HTMLElement, colors: string[]) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;
    const startX = Math.random() * window.innerWidth;
    const endX = startX + (Math.random() - 0.5) * 200;
    const rotation = Math.random() * 360;
    const duration = Math.random() * 2 + 2;
    const delay = Math.random() * 0.5;
    
    confetti.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        top: -20px;
        left: ${startX}px;
        opacity: 1;
        transform: rotate(${rotation}deg);
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'}; /* Rond ou carré */
        animation: fall ${duration}s ease-in ${delay}s forwards;
    `;

    container.appendChild(confetti);
    const style = document.createElement('style');
    if (!document.getElementById('confetti-animation-style')) {
        style.id = 'confetti-animation-style';
        style.textContent = `
            @keyframes fall {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(${window.innerHeight + 50}px) translateX(${endX - startX}px) rotate(${rotation + 720}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

//================================================
//============ VICTORY AND END MODAL =============
//================================================

export function showVictoryModal(winnerName: string, gameChat: Chat | null) {

    const modal = document.getElementById('local-summary-modal');
    const winnerText = document.getElementById('winner-name');
    const quitLocalBtn = document.getElementById('quit-local-btn');
    const quitRemoteBtn = document.getElementById('quit-remote-btn');
    
    if (modal && winnerText) {
        winnerText.innerText = winnerName;
        modal.classList.remove('hidden');
        
        if (gameChat) {
            // MODIFICATION : Traduction du message système
            gameChat.addSystemMessage(i18next.t('gameUI.winner_message', { name: winnerName }));
        }
        launchConfetti(4000);
    }
    const backAction = () => {
        window.history.back();
    }

    quitLocalBtn?.addEventListener('click', backAction);
    quitRemoteBtn?.addEventListener('click', backAction);
}

export function showRemoteEndModal(winnerName: string, message: string) {
    if (document.getElementById('remote-end-modal')) {
        return;
    }

    // MODIFICATION : Récupération des traductions pour le HTML
    const t_gameOver = i18next.t('gameUI.game_over');
    const t_congrat = i18next.t('gameUI.congratulations');
    const t_return = i18next.t('gameUI.return_menu');

    const modalHtml = `
        <div id="remote-end-modal" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" style="position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center;">
            <div class="window w-[600px] bg-white shadow-2xl animate-bounce-in">

                <div class="title-bar">
                    <div class="title-bar-text text-white" style="text-shadow: none;">${t_gameOver}</div>
                    <div class="title-bar-controls"></div>
                </div>

                <div class="window-body bg-gray-100 p-8 flex flex-col items-center gap-8">

                    <h1 class="text-4xl font-black text-yellow-600 uppercase tracking-widest">${t_congrat}</h1>

                    <div class="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-lg w-full">
                        <p class="text-2xl font-bold text-gray-800 text-center">
                            ${winnerName}
                        </p>
                        <p class="text-sm text-gray-600 font-semibold italic text-center">
                            ${message}
                        </p>
                    </div>

                    <div class="flex gap-6 w-full justify-center">
                        <button id="remote-quit-btn"
                                class="bg-gradient-to-b from-gray-100 to-gray-300 border border-gray-400 rounded-sm
                                    px-6 py-4 text-base font-semibold shadow-sm
                                    hover:from-gray-200 hover:to-gray-400
                                    active:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400
                                    transition-all duration-200 hover:shadow-md"
                                style="width: 200px; padding: 4px;">
                            ${t_return}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    document.getElementById('remote-quit-btn')?.addEventListener('click', () => {
        document.getElementById('remote-end-modal')?.remove();
        window.history.back();
    });
}

//================================================
//================== COUNTDOWN ===================
//================================================

export function launchCountdown(onComplete: () => void) {

    const modal = document.getElementById('countdown-modal');
    const text = document.getElementById('countdown-text');
    
    if (!modal || !text) {
        onComplete();
        return;
    }

    modal.classList.remove('hidden');
    let count = 3;
    text.innerText = count.toString();
    text.className = "text-[150px] font-black text-white animate-bounce";

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            text.innerText = count.toString();
        } else if (count === 0) {
            // MODIFICATION : Traduction du "GO!"
            text.innerText = i18next.t('gameUI.go');
            text.classList.remove('animate-bounce');
            text.classList.add('animate-ping');
        } else {
            clearInterval(interval);
            modal.classList.add('hidden');
            onComplete();
        }
    }, 1000);
}