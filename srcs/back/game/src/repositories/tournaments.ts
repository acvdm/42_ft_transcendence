import { Database } from 'sqlite'

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

export async function createTournament (
    db: Database,
    name: string,
    endAt: Date,
    remainingMatches: number,
    nbOfParticipants: number
): Promise<number | undefined>
{
    const newTournament = await db.run(`
        INSERT INTO TOURNAMENTS (name, end_at, remaining_matches, nb_of_participants)
        VALUES (?, ?, ?, ?)`,
        [name]
    );

    // On verifie que l'ID existe bien
    if (newTournament.lastID === undefined) {
        throw new Error("Failed: ID is missing")
    }

    return newTournament.lastID;
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

    if (tournament?.tournament_id)
        throw new Error(`No tournament matching ${id}`);

    return tournament;
}
