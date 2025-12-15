import htmlContent from "./LocalGame.html";
import { ballEmoticons, gameBackgrounds } from "../components/Data";

export function render(): string {
    return htmlContent;
}

export function initGamePage(mode: string): void {

    const modal = document.getElementById('game-setup-modal') as HTMLElement;
    const startButton = document.getElementById('start-game-btn') as HTMLButtonElement;
    const nameInput = document.getElementById('opponent-name') as HTMLInputElement;
    const errorMsg = document.getElementById('error-message') as HTMLElement;
    const player2Display = document.getElementById('player2-name-display') as HTMLElement;
    
    const ballButton = document.getElementById('ball-selector-button') as HTMLButtonElement;
    const ballDropdown = document.getElementById('ball-selector-dropdown') as HTMLElement;
    const ballGrid = document.getElementById('ball-grid') as HTMLElement;
    const selectedBallImg = document.getElementById('selected-ball-img') as HTMLImageElement;
    const ballValueInput = document.getElementById('ball-value') as HTMLInputElement;

    const bgButton = document.getElementById('bg-selector-button') as HTMLButtonElement;
    const bgDropdown = document.getElementById('bg-selector-dropdown') as HTMLElement;
    const bgGrid = document.getElementById('bg-grid') as HTMLElement;
    const selectedBgPreview = document.getElementById('selected-bg-preview') as HTMLElement;
    const bgValueInput = document.getElementById('bg-value') as HTMLInputElement;
    const gameField = document.getElementById('left') as HTMLElement;

    if (!modal || !startButton || !nameInput) {
        return;
    }

    // affichage selon le mode, on rajoutera remote + tournoi plus tard
    if (mode === 'local') {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }


    // ---------------------------------------------------------
    // --- LOGIQUE DU SÉLECTEUR DE BALLE (EMOTICONS) -----------
    // ---------------------------------------------------------

    if (ballButton && ballDropdown && ballGrid) {
        
        // la grille des emotifcones
        const uniqueUrls = new Set<string>();
        
        ballGrid.innerHTML = '';

        Object.keys(ballEmoticons).forEach(key => {
            const imgUrl = ballEmoticons[key];

            // on evite les doublons
            if (!uniqueUrls.has(imgUrl)) {
                uniqueUrls.add(imgUrl);

                const div = document.createElement('div');
                div.className = "cursor-pointer p-1 hover:bg-blue-100 rounded border border-transparent hover:border-blue-300 flex justify-center items-center";
                div.innerHTML = `<img src="${imgUrl}" alt="${key}" class="w-6 h-6 object-contain pointer-events-none">`;

                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    selectedBallImg.src = imgUrl;
                    ballValueInput.value = imgUrl;
                    ballDropdown.classList.add('hidden');
                });

                ballGrid.appendChild(div);
            }
        });

        ballButton.addEventListener('click', (e) => {
            e.stopPropagation();
            ballDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!ballDropdown.contains(target) && !ballButton.contains(target)) {
                ballDropdown.classList.add('hidden');
            }
        });
    }



    // ---------------------------------------------------------
    // --- LOGIQUE DU SÉLECTEUR DE BACKGROUND -------------------
    // ---------------------------------------------------------

    if (bgButton && bgDropdown && bgGrid) {
        
        // geneere la grille de couleurs -> penser a ajouter un reset
        bgGrid.innerHTML = '';

        Object.keys(gameBackgrounds).forEach(key => {
            const color = gameBackgrounds[key];

            const div = document.createElement('div');
            div.className = "cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-full";
            div.style.padding = "4px";
            div.style.display = "flex";
            div.style.justifyContent = "center";
            div.style.alignItems = "center";
            div.style.width = "36px";
            div.style.height = "36px";

            const colorCircle = document.createElement('div');
            colorCircle.className = "w-full h-full rounded-full border-2 border-gray-300"; // trouver pourquoi ca fait pas un rond -> forcer en inline?
            colorCircle.style.backgroundColor = color;
            
            div.appendChild(colorCircle);

            div.addEventListener('click', (e) => {
                e.stopPropagation();
                
                selectedBgPreview.style.backgroundColor = color;
                bgValueInput.value = color;
                if (gameField) {
                    gameField.style.backgroundColor = color;
                }
                bgDropdown.classList.add('hidden');
            });

            bgGrid.appendChild(div);
        });

        bgButton.addEventListener('click', (e) => {
            e.stopPropagation();
            bgDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!bgDropdown.contains(target) && !bgButton.contains(target)) {
                bgDropdown.classList.add('hidden');
            }
        });
    }

    // on clique sur play
    startButton.addEventListener('click', () => {
        const opponentName = nameInput.value.trim(); // l'opposent a besoin du name input

        // est-ce qu'on peut utliser un nom qui est egalement un usrename deja pris?
        if (opponentName === "") {
            if (errorMsg) errorMsg.classList.remove('hidden');
            nameInput.classList.add('border-red-500');
            return;
        }

        // valeur par default 
        const selectedBall = ballValueInput ? ballValueInput.value : 'classic';
        const selectedBg = bgValueInput ? bgValueInput.value : '#E8F4F8';
        // on met a jour le nom du second joueur
        if (player2Display) {
            player2Display.textContent = opponentName;
        }

        if (gameField) {
            gameField.style.backgroundColor = selectedBg;
        }

        // on ferme la modale 
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        // ICI LANCEMENT DU JEU
    });

    // resrt erreur ecritur e
    nameInput.addEventListener('input', () => {
        if (errorMsg) errorMsg.classList.add('hidden');
        nameInput.classList.remove('border-red-500');
    });
}