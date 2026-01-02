
// Interface pour la gestion interne du tournois
interface TournamentPlayer 
{
    userId: number | null; // null si c'est un invite qui joue
    alias: string;
    score: number; // score final d'un match
}

// Interface pour un match termine
interface TournamentMatch 
{
    round: 'semi_final_1' | 'semi_final_2' | 'final';
    winner: string;
    player1: TournamentPlayer;
    player2: TournamentPlayer;
}

// Etat global du tournoi en cours
interface TournamentData 
{
    name: string;
    players: TournamentPlayer[];
    matches: TournamentMatch[];
    currentStep: 'registration' | 'semi_final_1' | 'semi_final_2' | 'final' | 'finished';
}

// Variable globale pour garder en memoire les infos des match
let tournamentState: TournamentData = 
{
    name: "",
    players: [],
    matches: [],
    currentStep: 'registration'
};

export function startTournament(tournamentName: string, aliases: string[]) {

    console.log('Start tournament: ', tournamentName);

    // 1. recuperation des infos de joueur connecte s'il y en a un
    const userIdStr = localStorage.getItem('userId'); // localStorage renvoit du string donc on converti en number
    const userIdNb = userIdStr ? Number(userIdStr) : null; // VERIFIER si quand on est co en tant qu'invite on a bien pas de userId
    const userAlias = localStorage.getItem('username') || aliases[0];

    console.log(`🔍 DEBUG LOCALSTORAGE -> userId: "${userIdStr}", username: "${userAlias}"`);
    console.log(`👤 DEBUG PLAYER 1 -> ID assigné: ${userIdNb} (Type: ${typeof userIdNb})`);

    // 2. creation des 4 joueurs
    let player1: TournamentPlayer = {
        userId: userIdNb,
        alias: userAlias,
        score: 0
    };

    let player2: TournamentPlayer = {
        userId: null,
        alias: aliases[1],
        score: 0
    };

    let player3: TournamentPlayer = {
        userId: null,
        alias: aliases[2],
        score: 0
    };

    let player4: TournamentPlayer = {
        userId: null,
        alias: aliases[3],
        score: 0
    };

    // 2 - initialisation de tournamentState
    tournamentState.name = tournamentName;
    tournamentState.players = [player1, player2, player3, player4];
    tournamentState.matches = [];
    tournamentState.currentStep = 'semi_final_1';

    // 3 - appeler fonction qui va regarder l'etape actuelle et afficher les bons noms a l'ecran
    // affichage dynamique -> regarde currentStep et decide qui doit jouer
    updateGameUI();
}

export function updateGameUI() {
// pour la mise a jour des alias a afficher dans le html

    let p1: TournamentPlayer;
    let p2: TournamentPlayer;

    switch (tournamentState.currentStep)
    {
        case 'semi_final_1':
            p1 = tournamentState.players[0];
            p2 = tournamentState.players[1];
            break;

        case 'semi_final_2':
            p1 = tournamentState.players[2];
            p2 = tournamentState.players[3];
            break;

        case 'final':
            // on recupere les alias
            const winnerMatch1Alias = tournamentState.matches[0].winner;
            const winnerMatch2Alias = tournamentState.matches[1].winner;
            // puis on recupere les objets joueurs 
            // (find parcourt la liste et p represente le joueur actuel que la boucle est en train d'examiner
            p1 = tournamentState.players.find(p => p.alias === winnerMatch1Alias)!;
            p2 = tournamentState.players.find(p => p.alias === winnerMatch2Alias)!;
            break;
    
        case 'finished':
            console.log("Tournoi termine ! Afficher le resume")
            return;
    
        default:
            return;    
    }

    // CONNEXION AVEC LE HTML
    // const leftSpan = document.getElementById...
    // if (leftSpan) leftSpan.innerText = p1.alias;..........
}

export function recordMatchResult(winnerAlias: string, player1Score: number, player2Score: number) {

    // pour la mise a jour de l'etat du tournois
    // identifier le match
    // le round
    // le vainqueur
    // les info des joueur A et B (ou p1 et p2)
    // changer de page pour nouvelle etape

    let p1!: TournamentPlayer;
    let p2!: TournamentPlayer;

    // variable pour stocker le nom officiel du round pour le backend
    let roundName: 'semi_final_1' | 'semi_final_2' | 'final';

    if (tournamentState.currentStep === 'semi_final_1')
    {
        p1 = tournamentState.players[0];
        p2 = tournamentState.players[1];
        roundName = 'semi_final_1';
    }
    else if (tournamentState.currentStep === 'semi_final_2')
    {
        p1 = tournamentState.players[2];
        p2 = tournamentState.players[3];
        roundName = 'semi_final_2';
    }
    else if (tournamentState.currentStep === 'final')
    {
        const winnerMatch1Alias = tournamentState.matches[0].winner;
        const winnerMatch2Alias = tournamentState.matches[1].winner;

        const foundP1 = tournamentState.players.find(p => p.alias === winnerMatch1Alias)!;
        const foundP2 = tournamentState.players.find(p => p.alias === winnerMatch2Alias)!;

        if (!foundP1 || !foundP2)
        {
            console.error(`Error: impossible to find finalists`);
            console.log("Joueurs disponibles :", tournamentState.players);
            return;
        }

        p1 = foundP1;
        p2 = foundP2;

        roundName = 'final';
    }
    else
    {
        console.error("Critical error: Attempted to save outside of match. Current step: " + tournamentState.currentStep);
        return;
    }

    p1.score = player1Score;
    p2.score = player2Score;

    // {...} permet de creer une copie du joueur
    let finishedMatch : TournamentMatch = {
        round: roundName,
        winner: winnerAlias,
        player1: { ...p1 },
        player2: { ...p2 }
    }

    // ajouter le match termine au carnet de match
    tournamentState.matches.push(finishedMatch);

    if (tournamentState.currentStep === 'semi_final_1')
        tournamentState.currentStep = 'semi_final_2'
    else if (tournamentState.currentStep === 'semi_final_2')
        tournamentState.currentStep = 'final'
    else if (tournamentState.currentStep === 'final')
        tournamentState.currentStep = 'finished'

    if (tournamentState.currentStep === 'finished')
        sendToBackend(tournamentState); // -> fonction qui transforme tournamentState en JSON pour le back

    // mise a jour de la page en fonction de l'etat du match
    updateGameUI();


}

export async function sendToBackend(state: TournamentData) {

    const token = localStorage.getItem('accessToken');
    if (!token)
    {
        console.error("Error: No users are logged in, unable to save the tournament.");
        // rediriger vers la page du login ou afficher une alerte
        return ;
    }

    const payload = {
        tournament_name: state.name,
        matchList: state.matches,
        winner: state.matches[2].winner
    }

    console.log(`user1 alias: "${state.players[0].alias}" , id:  "${state.players[0].userId}"`)

    try {
        const response = await fetch('/api/game/tournament', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) 
        {
            console.log("Tournament saved !");
            // afficher message de succes pour l'utilisateur ?
            // vider le state pour prochain tournois?
            // afficher page "tournois sauvegarder?"
        }
        else
        {
            console.error("Server error", result);
            // afficher l'erreur a l'utilisateur

        }
    }
    catch (error) {
        console.error("Error with the tournament saving");
    }
}

// ==========================================
// ZONE DE TEST (A supprimer une fois fini)
// ==========================================

// export function runTestSimulation() {
//     console.clear();
//     console.log("%c🧪 DÉBUT DE LA SIMULATION DU TOURNOI", "color: orange; font-weight: bold; font-size: 14px");

//     // 1. On simule un utilisateur connecté (Mock du localStorage)
//     if (!localStorage.getItem('accessToken')) {
//         console.warn("⚠️ Attention: Pas de token trouvé. J'en mets un faux pour le test, mais l'envoi au back échouera.");
//         localStorage.setItem('accessToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImNyZWRfaWQiOjEsImlhdCI6MTc2NzEwNjIzOCwiZXhwIjoxNzY3MTA3MjU4fQ.CXfJMkkNtvYa-KAWnvDvythT1EonOerniJdWpfD1lg4');
//         localStorage.setItem('userId', '1');
//         localStorage.setItem('username', 'Moi');
//     }

//     console.clear();
//     console.log("%c🧪 DÉBUT DE LA SIMULATION DU TOURNOI", "color: orange; font-weight: bold; font-size: 14px");

//     // 1. Démarrage
//     console.log("--- ÉTAPE 1 : Inscription ---");
//     // On lance le tournoi
//     startTournament("Coupe de la Victoire", ["Moi", "Faufau", "Annechat", "Lanou"]);

//     // ASTUCE : On récupère le vrai nom du Joueur 1 tel qu'il a été enregistré (Moi ou pseudo localStorage)
//     const realPlayer1Name = tournamentState.players[0].alias;
//     console.log(`ℹ️ Le Joueur 1 est enregistré sous le nom : "${realPlayer1Name}"`);

//     // 2. Simulation Match 1 : Joueur 1 (Vrai Nom) vs Faufau
//     console.log(`\n--- ÉTAPE 2 : Demi-Finale 1 (${realPlayer1Name} vs Faufau) ---`);
//     recordMatchResult(realPlayer1Name, 10, 2); // C'est le vrai J1 qui gagne

//     // 3. Simulation Match 2 : Annechat vs Lanou
//     console.log("\n--- ÉTAPE 3 : Demi-Finale 2 (Annechat vs Lanou) ---");
//     recordMatchResult("Annechat", 10, 8); // Annechat gagne

//     // 4. Simulation Finale : Joueur 1 vs Annechat
//     console.log(`\n--- ÉTAPE 4 : FINALE (${realPlayer1Name} vs Annechat) ---`);
//     recordMatchResult(realPlayer1Name, 11, 9); // Le vrai J1 gagne la finale
    
//     console.log("%c✅ SIMULATION TERMINÉE AVEC SUCCÈS", "color: green; font-weight: bold;");
// }

// runTestSimulation();