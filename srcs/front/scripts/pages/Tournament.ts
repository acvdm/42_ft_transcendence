
// Interface pour la gestion interne du tournois
interface TournamentPlayer 
{
    id: number | null; // null si c'est un invite qui joue
    alias: string;
    score: number; // score final d'un match
}

// Interface pour un match termine
interface TournamentMatch 
{
    round: 'semi1' | 'semi2' | 'final';
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
    currentStep: 'registration' | 'semi1' | 'semi2' | 'final' | 'finished';
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

    // 2. creation des 4 joueurs
    let player1: TournamentPlayer = {
        id: userIdNb,
        alias: userAlias,
        score: 0
    };

    let player2: TournamentPlayer = {
        id: null,
        alias: aliases[1],
        score: 0
    };

    let player3: TournamentPlayer = {
        id: null,
        alias: aliases[2],
        score: 0
    };

    let player4: TournamentPlayer = {
        id: null,
        alias: aliases[3],
        score: 0
    };

    // 2 - initialisation de tournamentState
    tournamentState.name = tournamentName;
    tournamentState.players = [player1, player2, player3, player4];
    tournamentState.matches = [];
    tournamentState.currentStep = 'semi1';

    // 3 - appeler fonction qui va regarder l'etape actuelle et afficher les bons noms a l'ecran
    // affichage dynamique -> regarde currentStep et decide qui doit jouer
    updateGameUI();

    // 4 - enregistrement dun match
    // identifier le match
    // le round
    // le vainqueur
    // les info des joueur A et B
    // changer de page pour nouvelle etape

   

}

export function updateGameUI() {
// pour la mise a jour des alias a afficher dans le html

    let p1: TournamentPlayer;
    let p2: TournamentPlayer;

    switch (tournamentState.currentStep)
    {
        case 'semi1':
            p1 = tournamentState.players[0];
            p2 = tournamentState.players[1];
            break;

        case 'semi2':
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
    let p1!: TournamentPlayer;
    let p2!: TournamentPlayer;

    // variable pour stocker le nom officiel du round pour le backend
    let roundName: 'semi_final_1' | 'semi_final_2' | 'final';

    if (tournamentState.currentStep === 'semi1')
    {
        p1 = tournamentState.players[0];
        p2 = tournamentState.players[1];
        roundName = 'semi_final_1';
    }
    else if (tournamentState.currentStep === 'semi2')
    {
        p1 = tournamentState.players[2];
        p2 = tournamentState.players[3];
        roundName = 'semi_final_2';
    }
    else if (tournamentState.currentStep === 'final')
    {
        const winnerMatch1Alias = tournamentState.matches[0].winner;
        const winnerMatch2Alias = tournamentState.matches[1].winner;
        p1 = tournamentState.players.find(p => p.alias === winnerMatch1Alias)!;
        p2 = tournamentState.players.find(p => p.alias === winnerMatch2Alias)!;
        roundName = 'final';
    }

    // {...} permet de creer une copie du joueur
    let finishedMatch : TournamentMatch = {
        round = tournamentState.currentStep,
        winner = winnerAlias,
        player1 = { ...p1 },
        player2 = { ...p2 }
    }

    p1.score = player1Score;
    p2.score = player2Score;

    // ajouter le match termine au carnet de match
    tournamentState.matches.push(finishedMatch);

    if (tournamentState.currentStep === 'semi1')
        tournamentState.currentStep = 'semi2'
    else if (tournamentState.currentStep === 'semi2')
        tournamentState.currentStep = 'final'
    else if (tournamentState.currentStep === 'final')
        tournamentState.currentStep = 'finished'

    if (tournamentState.currentStep === 'finished')
        // sendToBackend() -> fonciton qui transforme tournamentState en JSON pour le back

    // mise a jour de la page en fonciton de l'etat du match
    updateGameUI();


}