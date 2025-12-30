import { Database } from 'sqlite'
import { updateUserStats } from './stats.js'
import { localTournament } from "./tournament_interfaces.js";


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
    // 1. on sauvegarde le tournois lui meme 
    const tournamentRes = await db.run(`
        INSERT INTO TOURNAMENTS (name, winner_alias, status)
        VALUES (?, ?, 'finished')`,
        [data.tournament_name, data.winner]
    );

    // lastID = PRIMARY KEY AUTOINCREMENT -> derniere ligne inseree dans le tableau
    // permet de lier le tournois a une table match
    const tournamentId = tournamentRes.lastID;
    if (!tournamentId)
        throw new Error("Failed to save tournament");

    // 2. on boucle sur la liste des 3 match dans la table MATCHES
    // for of --> permet d'iterer sur chaque element de la liste data.matchList
    // la valeur match prend la valeur du premier objet de la liste
    for (const match of data.matchList)
    {
        // creation du match dans la table MATCHES
        const matchRes = await db.run(`
            INSERT INTO MATCHES (game_type, fk_tournament_id, status)
            VALUES (?, ?, 'finished')`,
            [match.type || 'pong', tournamentId] // valeur par defaut su type manquant
        );

        const matchId = matchRes.lastID;

        // Gestion du joueur 1 (INSERT + UPDATE_STATS)
        const p1IsWinner = match.winner === match.player1.alias;

        await db.run(`
            INSERT INTO PLAYER_MATCH (match_id, user_id, guest_alias, score, is_winner)
            VALUES (?, ?, ?, ?, ?)`,
            [
                matchId, 
                match.player1.userId || null, 
                match.player1.userId ? null : match.player1.alias,
                match.player1.score,
                p1IsWinner ? 1 : 0,
            ]
        );

        // si player 1 est un utilisateur on met a jour la db pour ses stats
        if (match.player1.userId)
            await updateUserStats(db, match.player1.userId, match.player1.score, p1IsWinner ? 1 : 0);

        // Gestion joueur 2
        const p2IsWinner = match.winner === match.player2.alias;

        await db.run(`
            INSERT INTO PLAYER_MATCH (match_id, user_id, guest_alias, score, is_winner)
            VALUES (?, ?, ?, ?, ?)`,
            [
                matchId, 
                match.player2.userId || null, 
                match.player2.userId ? null : match.player2.alias,
                match.player2.score,
                p2IsWinner ? 1 : 0,
            ]
        );

        // si player 1 est un utilisateur on met a jour la db pour ses stats
        if (match.player2.userId)
            await updateUserStats(db, match.player2.userId, match.player2.score, p2IsWinner ? 1 : 0);

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
