import { Database } from 'sqlite'
import { updateUserStats } from './stats.js'
import { localTournament } from "./tournament_interfaces.js";
import { addPlayerMatch } from './player_match.js';
import { createMatch } from './matches.js';


export interface Tournament {
    tournamentId: number,
    name: string,
    beginAt: Date,
    endAt: Date,
    status: string,
    remainingMatches: number,
    nbOfParticipants: number,
    winnerId: number
}

/* dans le front il faudra gerer le fait que le tournois ne peut se faire que en local */

export async function saveLocalTournament (
    db: Database,
    data: localTournament // corespond a l'interface dans tournament_interface.js
): Promise<number>
{

    // --- DEBUG LOG ---
    console.log("DEBUG BACKEND - Début sauvegarde tournoi");
    console.log("Nom du tournoi:", data.tournament_name);
    
    // Vérifions si 'match_list' existe et sa taille
    if (data.match_list) {
        console.log(`DEBUG BACKEND - Nombre de matches reçus: ${data.match_list.length}`);
    } else {
        console.error("DEBUG BACKEND - ERREUR: data.match_list est undefined !");
    }

    // 1. on sauvegarde le tournois lui meme 
    const tournamentRes = await db.run(`
        INSERT INTO TOURNAMENTS (name, winner_alias, status, begin_at)
        VALUES (?, ?, 'finished', ?)`,
        [data.tournament_name, data.winner, data.startedAt]
    );

    // lastID = PRIMARY KEY AUTOINCREMENT -> derniere ligne inseree dans le tableau
    // permet de lier le tournois a une table match
    const tournamentId = tournamentRes.lastID;
    if (!tournamentId)
        throw new Error("Failed to save tournament");

    // 2. on boucle sur la liste des 3 match dans la table MATCHES
    // for of --> permet d'iterer sur chaque element de la liste data.match_list
    // la valeur match prend la valeur du premier objet de la liste
    console.log(data.match_list);
    for (const match of data.match_list)
    {
        if (!match.p1.alias || !match.p2.alias)
        {
            console.error("One game is missing players");
            continue ;
        }

        console.log(`match.startDate = ${match.startDate}`);

        // creation du match dans la table MATCHES
        const matchId = await createMatch(
            db, "tournament", 
            match.p1.alias, match.p2.alias, 
            match.p1.score, match.p2.score, match.winner,
            "finished", match.round, tournamentId, 
            match.startDate, match.endDate
        );

        if (!matchId) {
            throw new Error("Failed to save match: ID is missing");
        }

        // -- JOUEUR 1 --
        // On ne sauvegarde que si c'est un user enregistré
        if (match.p1.user_id) 
        {
            console.log("match.p1.user_id ", match.p1.user_id)
            const p1IsWinner = match.winner === match.p1.alias;

            await addPlayerMatch(
                db, "tournament", matchId, 
                match.p1.user_id, match.p2.alias, 
                match.p1.score, p1IsWinner ? 1 : 0
            );

            console.log(`match.p1.score: ${match.p1.score}`);
            await updateUserStats(
                db, match.p1.user_id,
                match.p1.score, p1IsWinner ? 1 : 0
            );
        };


        // -- JOUEUR 2 --
        // On ne sauvegarde que si c'est un user enregistré
        if (match.p2.user_id)
        { 
            console.log("match.p2.user_id ", match.p2.user_id)
            const p2IsWinner = match.winner === match.p2.alias;

            await addPlayerMatch(
                db, "tournament", matchId,
                match.p2.user_id, match.p1.alias,
                match.p2.score, p2IsWinner ? 1 : 0
            );

            console.log(`match.p1.score: ${match.p2.score}`);
            await updateUserStats(
                db, match.p2.user_id,
                match.p2.score, p2IsWinner ? 1 : 0
            );
        }
    }

    return tournamentId;
}


/* saveLocalTournament()
    recupere le fichierJSON
    inserer le tournoi (recup l'ID)
    boucler sur els 3 matchs
    inserer les joueurs dans PLAYER_MATCH en gerant le NULL pour le invites
    appeler create_stat si cest un vria joueur

 */

export async function findTournamentById (
    db: Database,
    id: number
): Promise<Tournament>
{
    const tournament = await db.get(`
        SELECT * FROM TOURNAMENTS WHERE tournament_id = ?`,
        [id]
    );

    // toute petite correction ici
    if (!tournament?.tournament_id)
        throw new Error(`No tournament matching ${id}`);

    return tournament;
}
