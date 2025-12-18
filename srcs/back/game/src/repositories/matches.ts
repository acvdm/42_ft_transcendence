import { Database } from 'sqlite'

export interface Match {
    matchId: number,
    gameType: string,
    status: string,
    startedAt: Date,
    finishedAT: Date,
    tournamentId: number
}


//-------- GET / READ
export async function findMatchById (
    db: Database,
    matchId: number
): Promise<number | undefined>
{
    const id = await db.get(`
        SELECT * FROM GAMES WHERE match_id = ?`
        [matchId]
    );

    return id;
}


//-------- POST / CREATE
export async function createMatch (
    db: Database,
    type: string,
    tournamentId: number
): Promise<number | undefined>
{
    const newMatch = await db.run(`
        INSERT INTO MATCHES (game_type, fk_tournament_id)
        VALUES (?, ?)`,
        [type, tournamentId]
    );

    return newMatch?.lastID;
}


//-------- PUT / PATCH / UPDATE

//-------- DELETE
export async function rollbackDeleteGame (
    db: Database,
    matchId: number
)
{
    const match = await findMatchById(db, matchId);
    if (!match) {
        throw new Error(`Error matchId: ${matchId} does not exist`);
    }

    await db.run(`
        DELETE FROM GAMES WHERE match_id = ?`,
        matchId
    );
}