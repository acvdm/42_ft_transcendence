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
    p1Alias: string,
    p2Alias: string,
    p1Score: number,
    p2Score: number,
    winnerAlias: string,
    status: string,
    round: string,
    tournamentId: number | null,
    startDate?: string | undefined,
    endDate?: string | undefined

): Promise<number | undefined>
{
    const newMatch = await db.run(`
        INSERT INTO MATCHES (
            game_type, 
            player1_alias, 
            player2_alias, 
            score_p1, 
            score_p2, 
            winner_alias, 
            status, 
            round,
            started_at,
            finished_at, 
            fk_tournament_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [type, p1Alias, p2Alias, p1Score, p2Score, winnerAlias, status, round, startDate, endDate, tournamentId]
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